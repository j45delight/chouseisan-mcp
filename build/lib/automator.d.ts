import type { ChouseiSanEventData, ChouseiSanResult } from '../types/index.js';
/**
 * 調整さん自動化クラス
 * Playwrightを使用して調整さんのイベント作成を自動化
 */
export declare class ChouseiSanAutomator {
    private browser;
    private page;
    constructor();
    /**
     * ブラウザを初期化
     */
    init(): Promise<boolean>;
    /**
     * 調整さんイベントを作成
     */
    createEvent(eventData: ChouseiSanEventData): Promise<ChouseiSanResult>;
    /**
     * ブラウザを閉じる
     */
    close(): Promise<void>;
}
//# sourceMappingURL=automator.d.ts.map