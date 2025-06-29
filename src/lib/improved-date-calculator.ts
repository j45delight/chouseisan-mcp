import type { DateCandidate, DateParseOptions } from '../types/index.js';

/**
 * 改良版日程計算ユーティリティクラス
 * より詳細な自然言語による日程指定を解析し、除外日付にも対応
 */
export class ImprovedDateCalculator {
  /**
   * 日程文字列を解析して具体的な日程候補を計算
   */
  static parseSchedule(scheduleText: string, options: DateParseOptions = {}): DateCandidate[] {
    const {
      startDate = new Date(),
      timeFormat = '19:30〜',
      daysOfWeek,
      endDate
    } = options;

    console.error(`日程解析開始: "${scheduleText}"`);

    // 除外日付を抽出
    const exclusions = this.extractExcludedDates(scheduleText);
    console.error(`除外日付: ${exclusions.map(d => d.toLocaleDateString('ja-JP')).join(', ')}`);

    // メインの日程パターンを解析（除外指定を除去したテキストで）
    const cleanScheduleText = this.removeExclusionText(scheduleText);
    console.error(`クリーンなスケジュール文: "${cleanScheduleText}"`);

    const patterns = this.analyzeSchedulePatterns(cleanScheduleText);
    console.error('解析されたパターン:', patterns);
    
    let candidates: DateCandidate[] = [];

    if (patterns.specificDates.length > 0) {
      // 具体的な日付が指定されている場合
      candidates = this.createSpecificDates(patterns.specificDates, timeFormat);
    }
    else if (patterns.weeklyPattern) {
      // 毎週パターンの場合
      const calculatedEndDate = this.calculateEndDate(startDate, patterns, endDate);
      candidates = this.calculateWeeklyDates({
        startDate: patterns.weeklyPattern.startDate || startDate,
        endDate: calculatedEndDate,
        daysOfWeek: patterns.weeklyPattern.daysOfWeek,
        timeFormat
      });
    }
    else if (patterns.dateRange) {
      // 期間指定の場合
      candidates = this.calculateRangeDates({
        startDate: patterns.dateRange.start,
        endDate: patterns.dateRange.end,
        daysOfWeek: daysOfWeek || [1, 2, 3, 4, 5], // デフォルトは平日
        timeFormat
      });
    }
    else {
      // フォールバック: 次の金曜日から4週間
      candidates = this.calculateDates({
        startDate: this.getNextFriday(startDate),
        endDate: endDate || this.addDays(startDate, 28),
        daysOfWeek: daysOfWeek || [5], // 金曜日
        timeFormat
      });
    }

    // 除外日付を適用
    const filteredCandidates = this.applyExclusions(candidates, exclusions);
    console.error(`最終候補数: ${filteredCandidates.length}件`);

    return filteredCandidates;
  }

  /**
   * 除外日付を抽出
   */
  private static extractExcludedDates(scheduleText: string): Date[] {
    const exclusions: Date[] = [];
    const text = scheduleText.toLowerCase();
    
    // "7/11は除く"のようなパターン
    const excludeMatches = text.match(/(\d{1,2})[\/\-月](\d{1,2})[日]?\s*[はを]*[除外除く]/g);
    if (excludeMatches) {
      excludeMatches.forEach(match => {
        const dateMatch = match.match(/(\d{1,2})[\/\-月](\d{1,2})/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]) - 1; // 0ベース
          const day = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          const excludeDate = new Date(year, month, day);
          
          // 来年の可能性も考慮
          if (excludeDate < new Date()) {
            excludeDate.setFullYear(year + 1);
          }
          
          exclusions.push(excludeDate);
        }
      });
    }

    // "ただし○月○日は除く"パターン
    const tadashiMatches = text.match(/ただし\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日[はを]*[除外除く]/g);
    if (tadashiMatches) {
      tadashiMatches.forEach(match => {
        const dateMatch = match.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]) - 1;
          const day = parseInt(dateMatch[2]);
          const year = new Date().getFullYear();
          const excludeDate = new Date(year, month, day);
          
          if (excludeDate < new Date()) {
            excludeDate.setFullYear(year + 1);
          }
          
          exclusions.push(excludeDate);
        }
      });
    }

    return exclusions;
  }

  /**
   * 除外指定のテキストを除去
   */
  private static removeExclusionText(scheduleText: string): string {
    return scheduleText
      .replace(/[、，]\s*ただし.*?[除外除く]/g, '')
      .replace(/\s*ただし.*?[除外除く]/g, '')
      .replace(/[、，]\s*\d{1,2}[\/\-月]\d{1,2}[日]?\s*[はを]*[除外除く]/g, '')
      .replace(/\s*\d{1,2}[\/\-月]\d{1,2}[日]?\s*[はを]*[除外除く]/g, '')
      .trim();
  }

  /**
   * 除外日付を適用
   */
  private static applyExclusions(candidates: DateCandidate[], exclusions: Date[]): DateCandidate[] {
    if (exclusions.length === 0) return candidates;

    return candidates.filter(candidate => {
      return !exclusions.some(exclusion => 
        candidate.date.getFullYear() === exclusion.getFullYear() &&
        candidate.date.getMonth() === exclusion.getMonth() &&
        candidate.date.getDate() === exclusion.getDate()
      );
    });
  }

  /**
   * 自然言語の日程パターンを解析（改良版）
   */
  private static analyzeSchedulePatterns(scheduleText: string) {
    const text = scheduleText.toLowerCase().replace(/\s/g, '');
    
    // 具体的な日付パターン（例: 1月15日、2月20日）
    const specificDateMatches = text.match(/(\d{1,2})月(\d{1,2})日/g);
    const specificDates = specificDateMatches ? 
      specificDateMatches.map(match => this.parseSpecificDate(match)) : [];

    // 毎週パターンの詳細解析
    let weeklyPattern = null;
    
    // "毎週月水金" パターン
    const weeklyMatch = text.match(/毎週([月火水木金土日]+)/);
    if (weeklyMatch) {
      const dayChars = weeklyMatch[1];
      const daysOfWeek = this.parseDayChars(dayChars);
      
      // 開始月の指定があるか確認
      let startDate = null;
      const monthMatch = text.match(/(\d{1,2})月以降|(\d{1,2})月から/);
      if (monthMatch) {
        const month = parseInt(monthMatch[1] || monthMatch[2]) - 1;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        
        // 指定月が現在月より後の場合は今年、そうでなければ来年
        const year = month >= currentMonth ? currentYear : currentYear + 1;
        startDate = new Date(year, month, 1);
        
        // その月の最初の該当曜日を探す
        startDate = this.findFirstMatchingDayInMonth(startDate, daysOfWeek);
      }
      
      weeklyPattern = { daysOfWeek, startDate };
    }

    // 期間指定パターン（改良版）
    let dateRange = null;
    const rangeMatch = text.match(/(\d{1,2})月から(\d{1,2})月/);
    if (rangeMatch) {
      const startMonth = parseInt(rangeMatch[1]) - 1;
      const endMonth = parseInt(rangeMatch[2]) - 1;
      const currentYear = new Date().getFullYear();
      dateRange = {
        start: new Date(currentYear, startMonth, 1),
        end: new Date(currentYear, endMonth + 1, 0) // 月末
      };
    }

    // 期間の長さを推定（改良版）
    let duration = 90; // デフォルト3ヶ月
    if (text.includes('来月まで')) duration = 60;
    if (text.includes('半年')) duration = 180;
    if (text.includes('1年')) duration = 365;
    if (text.includes('年末まで')) {
      const now = new Date();
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      duration = Math.ceil((yearEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      specificDates,
      weeklyPattern,
      dateRange,
      duration
    };
  }

  /**
   * 曜日文字列を解析
   */
  private static parseDayChars(dayChars: string): number[] {
    const dayMap: { [key: string]: number } = {
      '日': 0, '月': 1, '火': 2, '水': 3, '木': 4, '金': 5, '土': 6
    };
    return Array.from(dayChars).map(char => dayMap[char]).filter(day => day !== undefined);
  }

  /**
   * 指定月の最初の該当曜日を探す
   */
  private static findFirstMatchingDayInMonth(monthStart: Date, daysOfWeek: number[]): Date {
    const firstDay = new Date(monthStart);
    const currentDate = new Date(firstDay);
    
    // 月内で最初に見つかる該当曜日を探す
    while (currentDate.getMonth() === firstDay.getMonth()) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        return new Date(currentDate);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return firstDay; // フォールバック
  }

  /**
   * 終了日を計算
   */
  private static calculateEndDate(startDate: Date, patterns: any, explicitEndDate?: Date): Date {
    if (explicitEndDate) return explicitEndDate;
    
    // パターンに基づいた終了日の計算
    if (patterns.dateRange) {
      return patterns.dateRange.end;
    }
    
    // デフォルトは開始日から指定期間後
    return this.addDays(startDate, patterns.duration || 90);
  }

  /**
   * 具体的な日程候補を計算（基本機能）
   */
  static calculateDates(options: Required<DateParseOptions>): DateCandidate[] {
    const { startDate, endDate, daysOfWeek, timeFormat } = options;
    const dates: DateCandidate[] = [];
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
   * 毎週パターンの日程を計算
   */
  private static calculateWeeklyDates(options: Required<DateParseOptions>): DateCandidate[] {
    return this.calculateDates(options);
  }

  /**
   * 期間指定の日程を計算
   */
  private static calculateRangeDates(options: Required<DateParseOptions>): DateCandidate[] {
    return this.calculateDates(options);
  }

  /**
   * 具体的な日付からDateCandidate配列を作成
   */
  private static createSpecificDates(dates: Date[], timeFormat: string): DateCandidate[] {
    return dates.map(date => ({
      date: new Date(date),
      formatted: this.formatDate(date, timeFormat),
      dayOfWeek: date.getDay()
    }));
  }

  /**
   * 具体的な日付文字列をパース
   */
  private static parseSpecificDate(dateStr: string): Date {
    const match = dateStr.match(/(\d{1,2})月(\d{1,2})日/);
    if (match) {
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, month, day);
    }
    return new Date();
  }

  /**
   * 次の金曜日を取得
   */
  static getNextFriday(date: Date): Date {
    const nextFriday = new Date(date);
    const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
    nextFriday.setDate(date.getDate() + daysUntilFriday);
    return nextFriday;
  }

  /**
   * 日付に日数を追加
   */
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 日付を調整さん用にフォーマット
   */
  static formatDate(date: Date, timeFormat: string): string {
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
  static formatDatesForChouseisan(dates: DateCandidate[]): string[] {
    return dates.map(d => d.formatted);
  }
}