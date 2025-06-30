import type { ChouseiSanEventData } from './types/index.js';
/**
 * LLMベースの日程計算ユーティリティクラス（シンプル版）
 * LLMに日程を推論させて、その結果を直接使用
 */
export declare class LLMDateCalculator {
    private server;
    constructor(server: any);
    /**
     * 自然言語の日程指定をLLMで解析して日程候補を生成
     */
    parseScheduleWithLLM(scheduleText: string, timeFormat?: string): Promise<string[]>;
    /**
     * 日程解析用プロンプト（LLMに全て任せる）
     */
    private createScheduleParsingPrompt;
    /**
     * LLMの出力を単純に行分割して日程候補を抽出
     */
    private extractDateCandidatesSimple;
    /**
     * エラー時のフォールバック用日程生成
     */
    private generateFallbackDates;
    /**
     * ChouseiSanEventData形式に変換（LLMの結果を直接使用）
     */
    static createEventData(title: string, scheduleText: string, calculator: LLMDateCalculator, options?: {
        memo?: string;
        timeFormat?: string;
    }): Promise<ChouseiSanEventData>;
}
//# sourceMappingURL=llm-date-calculator.d.ts.map