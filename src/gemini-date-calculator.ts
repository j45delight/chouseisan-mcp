import type { ChouseiSanEventData } from './types/index.js';

/**
 * Gemini APIベースの日程計算ユーティリティクラス
 * Gemini APIに日程を推論させて、その結果を直接使用
 */
export class GeminiDateCalculator {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent';
    
    if (!this.apiKey) {
      throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable.');
    }
  }

  /**
   * 自然言語の日程指定をGemini APIで解析して日程候補を生成
   */
  async parseScheduleWithGemini(
    scheduleText: string, 
    timeFormat: string = '19:30〜'
  ): Promise<string[]> {
    try {
      const prompt = this.createScheduleParsingPrompt(scheduleText, timeFormat);
      
      // Gemini APIに推論させる
      const response = await this.callGeminiAPI(prompt);
      
      // Geminiの出力から日程候補を抽出
      return this.extractDateCandidatesSimple(response);
      
    } catch (error) {
      console.error('Gemini APIによる日程解析エラー:', error);
      // エラー時のみフォールバック
      return this.generateFallbackDates(timeFormat);
    }
  }

  /**
   * Gemini APIを呼び出す
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API call failed: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling Gemini API');
    }
  }

  /**
   * 日程解析用プロンプト（Geminiに全て任せる）
   */
  private createScheduleParsingPrompt(scheduleText: string, timeFormat: string): string {
    const today = new Date();
    const todayStr = today.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });

    return `現在日時: ${todayStr}

以下の自然言語による日程指定を解析して、調整さん用の日程候補リストを生成してください。

日程指定: "${scheduleText}"
時間フォーマット: "${timeFormat}"

出力形式（この形式で1行ずつ出力してください）：
7月4日(金) 19:30〜
7月11日(金) 19:30〜
7月18日(金) 19:30〜
7月25日(金) 19:30〜

要件：
- 現在日時から将来の日程のみ生成
- 指定された時間フォーマットを使用
- 日本語形式で出力（月日(曜日) 時間〜）
- 最大30個の候補を生成
- 箇条書き記号（•）は付けない
- 各行に1つの日程のみ記載
- 余計な説明文は不要、日程候補のみを出力
- 日本の祝日は除外してください。

日程候補:`;
  }

  /**
   * Geminiの出力を単純に行分割して日程候補を抽出
   */
  private extractDateCandidatesSimple(geminiResponse: string): string[] {
    const lines = geminiResponse.split('\n');
    const candidates: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // 空行やプロンプトの残骸をスキップ
      if (!trimmed || 
          trimmed.includes('現在日時') || 
          trimmed.includes('日程指定') ||
          trimmed.includes('出力形式') ||
          trimmed.includes('要件') ||
          trimmed.includes('日程候補:') ||
          trimmed.includes('以下の') ||
          trimmed.includes('生成しました') ||
          trimmed.includes('候補は以下') ||
          trimmed.length < 5) {
        continue;
      }

      // 箇条書き記号を除去
      const cleaned = trimmed.replace(/^[•・\-*]\s*/, '').replace(/^\d+\.\s*/, '');
      
      // 基本的な日程フォーマットチェック
      if (cleaned && this.isValidDateFormat(cleaned) && candidates.length < 30) {
        candidates.push(cleaned);
      }
    }

    return candidates;
  }

  /**
   * 基本的な日程フォーマットの検証
   */
  private isValidDateFormat(dateStr: string): boolean {
    // 基本的なパターンチェック：月日(曜日) 時間形式
    const patterns = [
      /\d{1,2}月\d{1,2}日\([月火水木金土日]\)/,  // 基本形式
      /\d{1,2}\/\d{1,2}\([月火水木金土日]\)/,    // スラッシュ形式
    ];
    
    return patterns.some(pattern => pattern.test(dateStr));
  }

  /**
   * エラー時のフォールバック用日程生成
   */
  private generateFallbackDates(timeFormat: string = '19:30〜'): string[] {
    const dates: string[] = [];
    const today = new Date();
    
    // 次の金曜日から4週間分
    for (let i = 0; i < 4; i++) {
      const targetDate = new Date(today);
      const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
      targetDate.setDate(today.getDate() + daysUntilFriday + (i * 7));
      
      const month = targetDate.getMonth() + 1;
      const day = targetDate.getDate();
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = dayNames[targetDate.getDay()];
      
      dates.push(`${month}月${day}日(${dayOfWeek}) ${timeFormat}`);
    }
    
    return dates;
  }

  /**
   * ChouseiSanEventData形式に変換（Geminiの結果を直接使用）
   */
  static async createEventData(
    title: string,
    scheduleText: string,
    calculator: GeminiDateCalculator,
    options: {
      memo?: string;
      timeFormat?: string;
    } = {}
  ): Promise<ChouseiSanEventData> {
    const timeFormat = options.timeFormat || '19:30〜';
    
    // Geminiに推論させた日程候補をそのまま使用
    const dateCandidates = await calculator.parseScheduleWithGemini(scheduleText, timeFormat);

    return {
      title,
      memo: options.memo,
      timeFormat,
      dateCandidates
    };
  }

  /**
   * API接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.callGeminiAPI('こんにちは');
      return response.length > 0;
    } catch (error) {
      console.error('Gemini API connection test failed:', error);
      return false;
    }
  }
}