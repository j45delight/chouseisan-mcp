import type { ChouseiSanEventData } from './types/index.js';
/**
 * Gemini APIベースの日程計算ユーティリティクラス
 * Gemini APIに日程を推論させて、その結果を直接使用
 */
export declare class GeminiDateCalculator {
    private apiKey;
    private apiUrl;
    constructor(apiKey?: string);
    /**
     * 自然言語の日程指定をGemini APIで解析して日程候補を生成
     */
    parseScheduleWithGemini(scheduleText: string, timeFormat?: string): Promise<string[]>;
    /**
     * Gemini APIを呼び出す
     */
    private callGeminiAPI;
    /**
     * 日程解析用プロンプト（Geminiに全て任せる）
     */
    private createScheduleParsingPrompt;
    /**
     * Geminiの出力を単純に行分割して日程候補を抽出
     */
    private extractDateCandidatesSimple;
    /**
     * 基本的な日程フォーマットの検証
     */
    private isValidDateFormat;
    /**
     * エラー時のフォールバック用日程生成
     */
    private generateFallbackDates;
    /**
     * ChouseiSanEventData形式に変換（Geminiの結果を直接使用）
     */
    static createEventData(title: string, scheduleText: string, calculator: GeminiDateCalculator, options?: {
        memo?: string;
        timeFormat?: string;
    }): Promise<ChouseiSanEventData>;
    /**
     * API接続テスト
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=gemini-date-calculator.d.ts.map