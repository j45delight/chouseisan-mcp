/**
 * LLMベースの日程計算ユーティリティクラス（シンプル版）
 * LLMに日程を推論させて、その結果を直接使用
 */
export class LLMDateCalculator {
    server;
    constructor(server) {
        this.server = server;
    }
    /**
     * 自然言語の日程指定をLLMで解析して日程候補を生成
     */
    async parseScheduleWithLLM(scheduleText, timeFormat = '19:30〜') {
        try {
            const prompt = this.createScheduleParsingPrompt(scheduleText, timeFormat);
            // MCPのsampling機能でLLMに推論させる
            const response = await this.server.requestSampling({
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: prompt
                        }
                    }
                ],
                modelPreferences: {
                    intelligencePriority: 0.8,
                    speedPriority: 0.6,
                    costPriority: 0.4
                },
                maxTokens: 1000
            });
            // LLMの出力から日程候補を抽出（パターン認識なし、単純な行分割）
            return this.extractDateCandidatesSimple(response.content.text);
        }
        catch (error) {
            console.error('LLMによる日程解析エラー:', error);
            // エラー時のみフォールバック
            return this.generateFallbackDates(timeFormat);
        }
    }
    /**
     * 日程解析用プロンプト（LLMに全て任せる）
     */
    createScheduleParsingPrompt(scheduleText, timeFormat) {
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

日程候補:`;
    }
    /**
     * LLMの出力を単純に行分割して日程候補を抽出
     */
    extractDateCandidatesSimple(llmResponse) {
        const lines = llmResponse.split('\n');
        const candidates = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // 空行やプロンプトの残骸をスキップ
            if (!trimmed ||
                trimmed.includes('現在日時') ||
                trimmed.includes('日程指定') ||
                trimmed.includes('出力形式') ||
                trimmed.includes('要件') ||
                trimmed.includes('日程候補')) {
                continue;
            }
            // 箇条書き記号を除去
            const cleaned = trimmed.replace(/^[•・]\s*/, '');
            if (cleaned && candidates.length < 30) {
                candidates.push(cleaned);
            }
        }
        //return candidates.length > 0 ? candidates : this.generateFallbackDates();
        return candidates;
    }
    /**
     * エラー時のフォールバック用日程生成
     */
    generateFallbackDates(timeFormat = '19:30〜') {
        const dates = [];
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
     * ChouseiSanEventData形式に変換（LLMの結果を直接使用）
     */
    static async createEventData(title, scheduleText, calculator, options = {}) {
        const timeFormat = options.timeFormat || '19:30〜';
        // LLMに推論させた日程候補をそのまま使用
        const dateCandidates = await calculator.parseScheduleWithLLM(scheduleText, timeFormat);
        return {
            title,
            memo: options.memo,
            timeFormat,
            dateCandidates
        };
    }
}
//# sourceMappingURL=llm-date-calculator.js.map