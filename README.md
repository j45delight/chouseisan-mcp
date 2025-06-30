# 調整さんMCP Server

調整さん（Chouseisan）の自動化を行うMCP（Model Context Protocol）サーバーです。自然言語による日程指定で、調整さんのイベントを自動作成できます。

## 機能

- 🎯 **自然言語による日程指定**: 「毎週金曜日」や「1月15日、1月22日、1月29日」などの自然な表現で日程を指定
- 🤖 **自動ブラウザ操作**: Playwrightを使用して調整さんのイベント作成を完全自動化
- 📅 **柔軟な日程生成**: 週次パターン、特定日付、期間指定など多様な日程パターンに対応
- 🔍 **プレビュー機能**: 作成前に生成される日程候補をプレビュー可能

## Quick Start

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/chouseisan-mcp.git
cd chouseisan-mcp
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Playwrightのインストール

Playwrightのブラウザをインストールします。

```bash
npx playwright install
```

### 4. Gemini APIキーの取得

Gemini APIキーを取得してください。APIキーは以下のリンクから取得できます：

**🔗 [Gemini API Key 取得ページ](https://aistudio.google.com/app/apikey?hl=ja)**

### 5. プロジェクトのビルド

chouseisan_mcpディレクトリで以下のコマンドを実行

```bash
npm run build
```

### 6. MCPサーバーの設定

Claude DesktopなどのMCPクライアントの設定ファイルに以下を追加してください：

#### Claude Desktop の場合

`%APPDATA%\Claude\claude_desktop_config.json` (Windows) または `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) に以下を追加：

```json
{
  "mcpServers": {
    "chouseisan-mcp": {
      "command": "node",
      "args": ["path/to/chouseisan-mcp/build/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here"
      }
    }
  }
}
```

## 使用方法

### 基本的な使い方

MCPクライアント（Claude Desktop等）で以下のようにリクエストしてください：

```
毎週金曜日19:30からの定例会議の調整さんを作成してください
```

### 利用可能なツール

#### 1. 調整さんイベント作成 (`create_chouseisan_event`)

**パラメータ:**
- `title` (必須): イベントのタイトル
- `schedule` (必須): 日程の指定（自然言語）
- `timeFormat` (オプション): 時間帯の表記（デフォルト: "19:30〜"）  
- `memo` (オプション): メモや説明文

**日程指定の例:**
- `"毎週金曜日"` - 毎週金曜日
- `"1月15日、1月22日、1月29日"` - 特定の日付
- `"毎週月水金"` - 毎週月・水・金曜日
- `"1月から3月まで毎週火曜日"` - 期間指定

#### 2. 日程候補プレビュー (`preview_schedule_candidates`)

**パラメータ:**
- `schedule` (必須): 日程の指定（自然言語）
- `timeFormat` (オプション): 時間帯の表記
- `maxDates` (オプション): 表示する最大日程数

## 開発環境

### 必要な環境

- Node.js 18.0+
- npm または yarn
- Gemini API キー

### プロジェクト構造

```
chouseisan-mcp/
├── src/
│   ├── index.ts              # メインサーバーファイル
│   ├── lib/
│   │   ├── automator.ts      # ブラウザ自動化クラス
│   │   └── gemini-date-calculator.ts # 日程計算ユーティリティ
│   └── types/
│       └── index.ts          # 型定義
├── build/                    # ビルド出力ディレクトリ
├── package.json
└── README.md
```

## API仕様

### ChouseiSanEventData

```typescript
interface ChouseiSanEventData {
  title: string;           // イベントタイトル
  memo?: string;           // メモ・説明文
  timeFormat?: string;     // 時間表記フォーマット
  dateCandidates: string[]; // 日程候補の配列
}
```

### DateParseOptions

```typescript
interface DateParseOptions {
  startDate?: Date;        // 開始日
  endDate?: Date;          // 終了日
  daysOfWeek?: number[];   // 対象曜日（0=日, 1=月, ..., 6=土）
  timeFormat?: string;     // 時間表記
}
```

## トラブルシューティング

### ブラウザの初期化に失敗する場合

Playwrightのブラウザが正しくインストールされていない可能性があります：

```bash
npx playwright install chromium
```

### 権限エラーが発生する場合

実行ファイルに適切な権限が設定されているか確認してください：

```bash
chmod +x build/index.js
```

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの投稿を歓迎します。

## サポート

質問やサポートが必要な場合は、GitHubのIssuesをご利用ください。
