import type { DateCandidate, DateParseOptions } from '../types/index.js';
/**
 * 改良版日程計算ユーティリティクラス
 * より詳細な自然言語による日程指定を解析し、除外日付にも対応
 */
export declare class ImprovedDateCalculator {
    /**
     * 日程文字列を解析して具体的な日程候補を計算
     */
    static parseSchedule(scheduleText: string, options?: DateParseOptions): DateCandidate[];
    /**
     * 除外日付を抽出
     */
    private static extractExcludedDates;
    /**
     * 除外指定のテキストを除去
     */
    private static removeExclusionText;
    /**
     * 除外日付を適用
     */
    private static applyExclusions;
    /**
     * 自然言語の日程パターンを解析（改良版）
     */
    private static analyzeSchedulePatterns;
    /**
     * 曜日文字列を解析
     */
    private static parseDayChars;
    /**
     * 指定月の最初の該当曜日を探す
     */
    private static findFirstMatchingDayInMonth;
    /**
     * 終了日を計算
     */
    private static calculateEndDate;
    /**
     * 具体的な日程候補を計算（基本機能）
     */
    static calculateDates(options: Required<DateParseOptions>): DateCandidate[];
    /**
     * 毎週パターンの日程を計算
     */
    private static calculateWeeklyDates;
    /**
     * 期間指定の日程を計算
     */
    private static calculateRangeDates;
    /**
     * 具体的な日付からDateCandidate配列を作成
     */
    private static createSpecificDates;
    /**
     * 具体的な日付文字列をパース
     */
    private static parseSpecificDate;
    /**
     * 次の金曜日を取得
     */
    static getNextFriday(date: Date): Date;
    /**
     * 日付に日数を追加
     */
    private static addDays;
    /**
     * 日付を調整さん用にフォーマット
     */
    static formatDate(date: Date, timeFormat: string): string;
    /**
     * 日程候補配列を調整さん用文字列に変換
     */
    static formatDatesForChouseisan(dates: DateCandidate[]): string[];
}
//# sourceMappingURL=improved-date-calculator.d.ts.map