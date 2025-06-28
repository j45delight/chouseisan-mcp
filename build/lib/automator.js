import { chromium } from 'playwright';
/**
 * 調整さん自動化クラス
 * Playwrightを使用して調整さんのイベント作成を自動化
 */
export class ChouseiSanAutomator {
    browser = null;
    page = null;
    constructor() {
        this.browser = null;
        this.page = null;
    }
    /**
     * ブラウザを初期化
     */
    async init() {
        try {
            console.error('ブラウザ初期化開始...');
            // Windows環境での設定を追加
            const launchOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                timeout: 30000
            };
            console.error('Chromium起動中...');
            this.browser = await chromium.launch(launchOptions);
            console.error('ブラウザコンテキスト作成中...');
            const context = await this.browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });
            console.error('ページ作成中...');
            this.page = await context.newPage();
            console.error('ブラウザ初期化完了');
            return true;
        }
        catch (error) {
            console.error('ブラウザ初期化エラー:', error);
            console.error('エラー詳細:', error instanceof Error ? error.stack : error);
            // cleanup if failed
            if (this.browser) {
                try {
                    await this.browser.close();
                }
                catch (closeError) {
                    console.error('ブラウザクローズエラー:', closeError);
                }
                this.browser = null;
                this.page = null;
            }
            return false;
        }
    }
    /**
     * 調整さんイベントを作成
     */
    async createEvent(eventData) {
        if (!this.page) {
            return {
                success: false,
                message: 'ブラウザが初期化されていません',
                error: 'Browser not initialized'
            };
        }
        try {
            // 調整さんのメインページへアクセス
            await this.page.goto('https://chouseisan.com/', { timeout: 30000 });
            // イベント名を入力
            const titleField = this.page.locator('input[name=\"event_name\"]');
            await titleField.fill(eventData.title);
            // メモがある場合は入力
            if (eventData.memo) {
                const memoField = this.page.locator('textarea[name=\"comment\"]');
                await memoField.fill(eventData.memo);
            }
            // 時間設定を変更
            if (eventData.timeFormat) {
                const timeField = this.page.locator('input[name=\"calendar_time_suffix\"]');
                await timeField.fill(eventData.timeFormat);
            }
            // 日程候補を入力
            if (eventData.dateCandidates && eventData.dateCandidates.length > 0) {
                const dateField = this.page.locator('textarea[name=\"event_kouho\"]');
                await dateField.fill(eventData.dateCandidates.join('\\n'));
            }
            // 出欠表を作成ボタンをクリック
            const createButton = this.page.locator('input[type=\"submit\"][value*=\"出欠表をつくる\"]');
            await createButton.click();
            // 結果ページの読み込みを待つ
            await this.page.waitForURL('**/create_complete**', { timeout: 15000 });
            // 生成されたURLを取得
            const urlElement = this.page.locator('input[type=\"text\"]').first();
            const generatedUrl = await urlElement.inputValue();
            return {
                success: true,
                url: generatedUrl,
                message: 'イベントが正常に作成されました'
            };
        }
        catch (error) {
            console.error('イベント作成エラー:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                message: 'イベント作成に失敗しました'
            };
        }
    }
    /**
     * ブラウザを閉じる
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}
//# sourceMappingURL=automator.js.map