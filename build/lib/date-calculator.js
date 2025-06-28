/**
 * 日程計算ユーティリティクラス
 * 自然言語による日程指定を解析し、具体的な日付リストを生成
 */
export class DateCalculator {
    /**
     * 日程文字列を解析して具体的な日程候補を計算
     */
    static parseSchedule(scheduleText, options = {}) {
        const { startDate = new Date(), timeFormat = '19:30〜', daysOfWeek, endDate } = options;
        // 自然言語パターンの解析
        const patterns = this.analyzeSchedulePatterns(scheduleText);
        if (patterns.specificDates.length > 0) {
            // 具体的な日付が指定されている場合
            return this.createSpecificDates(patterns.specificDates, timeFormat);
        }
        if (patterns.weeklyPattern) {
            // 毎週パターンの場合
            return this.calculateWeeklyDates({
                startDate,
                endDate: endDate || this.getDefaultEndDate(startDate, patterns.duration),
                daysOfWeek: patterns.weeklyPattern.daysOfWeek,
                timeFormat
            });
        }
        if (patterns.dateRange) {
            // 期間指定の場合
            return this.calculateRangeDates({
                startDate: patterns.dateRange.start,
                endDate: patterns.dateRange.end,
                daysOfWeek: daysOfWeek || [1, 2, 3, 4, 5], // デフォルトは平日
                timeFormat
            });
        }
        // フォールバック: 次の金曜日から7月末までの金曜日
        return this.calculateDates({
            startDate: this.getNextFriday(startDate),
            endDate: endDate || new Date(startDate.getFullYear(), 6, 31),
            daysOfWeek: daysOfWeek || [5], // 金曜日
            timeFormat
        });
    }
    /**
     * 具体的な日程候補を計算（基本機能）
     */
    static calculateDates(options) {
        const { startDate, endDate, daysOfWeek, timeFormat } = options;
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (daysOfWeek.includes(dayOfWeek)) {
                const formatted = this.formatDate(currentDate, timeFormat);
                dates.push({
                    date: new Date(currentDate),
                    formatted,
                    dayOfWeek
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }
    /**
     * 次の金曜日を取得
     */
    static getNextFriday(date) {
        const nextFriday = new Date(date);
        const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
        nextFriday.setDate(date.getDate() + daysUntilFriday);
        return nextFriday;
    }
    /**
     * 日付を調整さん用にフォーマット
     */
    static formatDate(date, timeFormat) {
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const dayOfWeek = dayNames[date.getDay()];
        return `${month}${day}日(${dayOfWeek}) ${timeFormat}`;
    }
    /**
     * 日程候補配列を調整さん用文字列に変換
     */
    static formatDatesForChouseisan(dates) {
        return dates.map(d => d.formatted);
    }
    /**
     * 自然言語の日程パターンを解析
     */
    static analyzeSchedulePatterns(scheduleText) {
        const text = scheduleText.toLowerCase();
        // 具体的な日付パターン（例: 1月15日、2月20日）
        const specificDateMatches = text.match(/(\\d{1,2})月(\\d{1,2})日/g);
        const specificDates = specificDateMatches ?
            specificDateMatches.map(match => this.parseSpecificDate(match)) : [];
        // 毎週パターン（例: 毎週金曜日、毎週月水金）
        const weeklyMatch = text.match(/毎週([月火水木金土日]+)/);
        let weeklyPattern = null;
        if (weeklyMatch) {
            const dayChars = weeklyMatch[1];
            const dayMap = {
                '日': 0, '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6
            };
            const daysOfWeek = Array.from(dayChars).map(char => dayMap[char]).filter(day => day !== undefined);
            weeklyPattern = { daysOfWeek };
        }
        // 期間指定パターン（例: 1月から3月まで、来月まで）
        let dateRange = null;
        const rangeMatch = text.match(/(\\d{1,2})月から(\\d{1,2})月/);
        if (rangeMatch) {
            const startMonth = parseInt(rangeMatch[1]) - 1;
            const endMonth = parseInt(rangeMatch[2]) - 1;
            const currentYear = new Date().getFullYear();
            dateRange = {
                start: new Date(currentYear, startMonth, 1),
                end: new Date(currentYear, endMonth + 1, 0) // 月末
            };
        }
        // 期間の長さを推定
        let duration = 90; // デフォルト3ヶ月
        if (text.includes('来月まで'))
            duration = 60;
        if (text.includes('半年'))
            duration = 180;
        if (text.includes('1年'))
            duration = 365;
        return {
            specificDates,
            weeklyPattern,
            dateRange,
            duration
        };
    }
    /**
     * 具体的な日付文字列をパース
     */
    static parseSpecificDate(dateStr) {
        const match = dateStr.match(/(\\d{1,2})月(\\d{1,2})日/);
        if (match) {
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const currentYear = new Date().getFullYear();
            return new Date(currentYear, month, day);
        }
        return new Date();
    }
    /**
     * 具体的な日付からDateCandidate配列を作成
     */
    static createSpecificDates(dates, timeFormat) {
        return dates.map(date => ({
            date: new Date(date),
            formatted: this.formatDate(date, timeFormat),
            dayOfWeek: date.getDay()
        }));
    }
    /**
     * 毎週パターンの日程を計算
     */
    static calculateWeeklyDates(options) {
        return this.calculateDates(options);
    }
    /**
     * 期間指定の日程を計算
     */
    static calculateRangeDates(options) {
        return this.calculateDates(options);
    }
    /**
     * デフォルトの終了日を取得
     */
    static getDefaultEndDate(startDate, duration) {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration);
        return endDate;
    }
}
//# sourceMappingURL=date-calculator.js.map