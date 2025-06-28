import type { DateCandidate, DateParseOptions } from '../types/index.js';
/**
 * 日程計算ユーティリティクラス
 * 自然言語による日程指定を解析し、具体的な日付リストを生成
 */
export declare class DateCalculator {
    /**
     * 日程文字列を解析して具体的な日程候補を計算
     */
    static parseSchedule(scheduleText: string, options?: DateParseOptions): DateCandidate[];
    /**
     * 具体的な日程候補を計算（基本機能）
     */
    static calculateDates(options: Required<DateParseOptions>): DateCandidate[];
    /**
     * 次の金曜日を取得
     */
    static getNextFriday(date: Date): Date;
    /**
     * 日付を調整さん用にフォーマット
     */
    static formatDate(date: Date, timeFormat: string): string;
    /**
     * 日程候補配列を調整さん用文字列に変換
     */
    static formatDatesForChouseisan(dates: DateCandidate[]): string[];
    /**
     * 自然言語の日程パターンを解析
     */
    private static analyzeSchedulePatterns;
    /**
     * 具体的な日付文字列をパース
     */
    private static parseSpecificDate;
    /**
     * 具体的な日付からDateCandidate配列を作成
     */
    private static createSpecificDates;
    /**
     * 毎週パターンの日程を計算
     */
    private static calculateWeeklyDates;
    /**
     * 期間指定の日程を計算
     */
    private static calculateRangeDates;
    /**
     * デフォルトの終了日を取得
     */
    private static getDefaultEndDate;
}
//# sourceMappingURL=date-calculator.d.ts.map