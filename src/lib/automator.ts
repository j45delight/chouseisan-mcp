import { chromium, Browser, Page } from 'playwright';
import type { ChouseiSanEventData, ChouseiSanResult } from '../types/index.js';

/**
 * 調整さん自動化クラス（ログイン対応版）
 * Playwrightを使用して調整さんへのログインとイベント作成を自動化
 */
export class ChouseiSanAutomator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private email: string;
  private password: string;

  constructor(email: string, password: string) {
    this.browser = null;
    this.page = null;
    this.email = email;
    this.password = password;
  }

  /**
   * ブラウザを初期化
   */
  async init(): Promise<boolean> {
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
    } catch (error) {
      console.error('ブラウザ初期化エラー:', error);
      console.error('エラー詳細:', error instanceof Error ? error.stack : error);
      
      // cleanup if failed
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (closeError) {
          console.error('ブラウザクローズエラー:', closeError);
        }
        this.browser = null;
        this.page = null;
      }
      return false;
    }
  }

  /**
   * 調整さんにログイン
   */
  async login(): Promise<boolean> {
    if (!this.page) {
      console.error('ページが初期化されていません');
      return false;
    }

    try {
      console.error('調整さんログイン開始...');
      
      // ログインページにアクセス
      await this.page.goto('https://chouseisan.com/auth/login', { timeout: 30000 });
      
      // メールアドレスを入力
      await this.page.getByRole('textbox', { name: 'メールアドレス' }).fill(this.email);
      
      // パスワードを入力
      await this.page.getByRole('textbox', { name: 'パスワード' }).fill(this.password);
      
      // ログイン状態を保持するチェックボックスをチェック
      await this.page.getByRole('checkbox', { name: 'ログイン状態を保持する' }).check();
      
      // ログインボタンをクリック
      await this.page.getByRole('button', { name: 'ログイン' }).click();
      
      // ログイン結果を待機
      await this.page.waitForTimeout(3000);
      
      // ログイン失敗のチェック（エラーメッセージの有無を確認）
      const errorAlert = this.page.locator('div[role="alert"]');
      const hasError = await errorAlert.count() > 0;
      
      if (hasError) {
        const errorText = await errorAlert.textContent();
        console.error('ログイン失敗:', errorText);
        return false;
      }
      
      // ログイン成功の確認（URLの変化またはページの内容で判定）
      const currentUrl = this.page.url();
      console.error('ログイン後URL:', currentUrl);
      
      // ログインに成功した場合、通常はリダイレクトが発生するかログインページから離れる
      if (currentUrl.includes('/auth/login')) {
        // ページが変わらない場合は再度エラーチェック
        await this.page.waitForTimeout(2000);
        const stillHasError = await errorAlert.count() > 0;
        if (stillHasError) {
          console.error('ログイン失敗: ログインページに留まっています');
          return false;
        }
      }
      
      console.error('ログイン成功');
      return true;
      
    } catch (error) {
      console.error('ログインエラー:', error);
      return false;
    }
  }

  /**
   * 調整さんイベントを作成（ログイン後）
   */
  async createEvent(eventData: ChouseiSanEventData): Promise<ChouseiSanResult> {
    if (!this.page) {
      return {
        success: false,
        message: 'ブラウザが初期化されていません',
        error: 'Browser not initialized'
      };
    }

    try {
      console.error('イベント作成開始...');
      
      // 調整さんのメインページへアクセス（ログイン状態を保持）
      await this.page.goto('https://chouseisan.com/', { timeout: 30000 });
      
      // ページが完全に読み込まれるまで待機
      await this.page.waitForLoadState('networkidle');
      
      // イベント名を入力
      console.error('イベント名入力:', eventData.title);
      const eventNameField = this.page.getByRole('textbox', { name: 'event_name' });
      await eventNameField.waitFor({ state: 'visible' });
      await eventNameField.fill(eventData.title);
      
      // メモがある場合は入力
      if (eventData.memo) {
        console.error('メモ入力:', eventData.memo);
        const memoField = this.page.locator('textarea[name="comment"]');
        await memoField.fill(eventData.memo);
      }
      
      // 時間設定を変更
      if (eventData.timeFormat) {
        console.error('時間フォーマット設定:', eventData.timeFormat);
        const timeField = this.page.getByRole('textbox', { name: 'calendar_time_suffix' });
        await timeField.fill(eventData.timeFormat);
      }
      
      // 日程候補を入力
      if (eventData.dateCandidates && eventData.dateCandidates.length > 0) {
        console.error('日程候補入力:', eventData.dateCandidates.length, '件');
        const dateField = this.page.getByRole('textbox', { name: 'event_kouho' });
        await dateField.fill(eventData.dateCandidates.join('\n'));
      }
      
      // 出欠表を作成ボタンをクリック
      console.error('作成ボタンクリック');
      const createButton = this.page.getByRole('button', { name: '出欠表をつくる' });
      await createButton.click();
      
      // 結果ページの読み込みを待つ
      console.error('結果ページ待機中...');
      await this.page.waitForURL('**/create_complete**', { timeout: 15000 });
      
      // 生成されたURLを取得
      console.error('生成URL取得中...');
      const urlElement = this.page.locator('input[type="text"]').first();
      await urlElement.waitFor({ state: 'visible' });
      const generatedUrl = await urlElement.inputValue();
      
      console.error('イベント作成成功:', generatedUrl);
      
      return {
        success: true,
        url: generatedUrl,
        message: 'ログイン後にイベントが正常に作成されました'
      };
      
    } catch (error) {
      console.error('イベント作成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'ログイン後のイベント作成に失敗しました'
      };
    }
  }

  /**
   * ログインしてイベントを作成する完全なフロー
   */
  async loginAndCreateEvent(eventData: ChouseiSanEventData): Promise<ChouseiSanResult> {
    try {
      // ログイン実行
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        return {
          success: false,
          message: 'ログインに失敗しました。メールアドレスとパスワードを確認してください。',
          error: 'Login failed'
        };
      }
      
      // ログイン成功後にイベント作成
      return await this.createEvent(eventData);
      
    } catch (error) {
      console.error('ログイン＆イベント作成エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'ログインまたはイベント作成に失敗しました'
      };
    }
  }

  /**
   * ブラウザを閉じる
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
