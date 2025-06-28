/**
 * 調整さんイベント作成用の型定義
 */

export interface ChouseiSanEventData {
  /** イベントタイトル */
  title: string;
  /** メモ・説明文 */
  memo?: string;
  /** 時間表記フォーマット（例: "19:30〜", "19:30～21:00"） */
  timeFormat?: string;
  /** 日程候補の配列 */
  dateCandidates: string[];
}

export interface ChouseiSanResult {
  /** 作成成功フラグ */
  success: boolean;
  /** 作成された調整さんのURL */
  url?: string;
  /** 結果メッセージ */
  message: string;
  /** エラー情報 */
  error?: string;
}

export interface DateCandidate {
  /** Date オブジェクト */
  date: Date;
  /** フォーマットされた文字列（例: "1月15日(金) 19:30〜"） */
  formatted: string;
  /** 曜日（0=日, 1=月, ..., 6=土） */
  dayOfWeek: number;
}

export interface CreateEventRequest {
  /** イベントのタイトル */
  title: string;
  /** 日程の指定（自然言語で指定可能） */
  schedule: string;
  /** 時間帯（省略可能、デフォルト: "19:30〜"） */
  timeFormat?: string;
  /** メモ・説明文（省略可能） */
  memo?: string;
}

/**
 * 自然言語による日程パースのオプション
 */
export interface DateParseOptions {
  /** 開始日（省略時は今日から）*/
  startDate?: Date;
  /** 終了日（省略時は適切なデフォルト値） */
  endDate?: Date;
  /** 対象曜日の配列（0=日, 1=月, ..., 6=土） */
  daysOfWeek?: number[];
  /** 時間表記 */
  timeFormat?: string;
}
