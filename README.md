# 調整さんMCP Server

調整さん（Chouseisan）の自動化を行うMCP（Model Context Protocol）サーバーです。MCPクライアント（Claude）が自然言語による日程指定を解析し、調整さんのイベントを自動作成できます。

## 機能

- 🤖 **Claude直接解析**: MCPクライアント（Claude）が自然言語の日程指定を直接解析
- 🎯 **柔軟な日程指定**: 「毎週金曜日（祝日除く）」「7,8月の金曜日」などの複雑な条件にも対応
- 🚀 **完全自動化**: Playwrightを使用して調整さんのイベント作成を完全自動化
- ✅ **バリデーション機能**: 日程候補の形式チェックとプレビュー
- 🔒 **外部API不要**: Gemini APIなどの外部依存なし、Claude Desktopで完全動作

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

### 4. プロジェクトのビルド

```bash
npm run build
```

### 5. MCPサーバーの設定

Claude DesktopなどのMCPクライアントの設定ファイルに以下を追加してください：

#### Claude Desktop の場合

`%APPDATA%\Claude\claude_desktop_config.json` (Windows) または `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) に以下を追加：

```json
{
  "mcpServers": {
    "chouseisan-mcp": {
      "command": "node",
      "args": ["path/to/chouseisan-mcp/build/index.js"]
    }
  }
}
```

## 使用方法

### 基本的な使い方

MCPクライアント（Claude Desktop等）で以下のようにリクエストしてください：

```
7,8月で飲み会を調整してください。候補日は金曜日で、7/11と日本の祝日は除いてください。
```

Claude（MCPクライアント）が自動的に：
1. 自然言語を解析
2. 具体的な日程候補を生成（祝日除外など）
3. 調整さんイベントを自動作成

### 利用可能なツール

#### 1. 調整さんイベント作成 (`create_chouseisan_event`)

**パラメータ:**
- `title` (必須): イベントのタイトル
- `dateCandidates` (必須): 日程候補の配列（YYYY年MM月DD日(曜日) 形式）
- `timeFormat` (オプション): 時間帯の表記（デフォルト: "19:30〜"）
- `memo` (オプション): メモや説明文

**日程候補の例:**
```json
{
  "title": "7-8月飲み会",
  "dateCandidates": [
    "2024年7月5日(金)",
    "2024年7月12日(金)",
    "2024年7月19日(金)",
    "2024年7月26日(金)",
    "2024年8月2日(金)",
    "2024年8月9日(金)",
    "2024年8月16日(金)",
    "2024年8月23日(金)",
    "2024年8月30日(金)"
  ],
  "timeFormat": "19:00〜"
}
```

#### 2. 日程候補バリデーション (`validate_schedule_candidates`)

**パラメータ:**
- `dateCandidates` (必須): バリデーションする日程候補のリスト
- `timeFormat` (オプション): 時間帯の表記

日程候補の形式をチェックし、調整さん作成前に確認できます。

### Claude解析の流れ

1. **ユーザー指示**: 「7,8月で飲み会を調整して。候補日は金曜日。ただし7/11と日本の祝日は除く」
2. **Claude解析**: 
   - 対象期間（7月、8月）を特定
   - 条件（金曜日、7/11除外、祝日除外）を解析
   - 具体的な日程候補を生成
3. **ツール実行**: 生成した日程候補で調整さんを自動作成

## 開発環境

### 必要な環境

- Node.js 18.0+
- npm または yarn
- Playwright（ブラウザ自動化）

### プロジェクト構造

```
chouseisan-mcp/
├── src/
│   ├── index.ts              # メインサーバーファイル（Claude解析版）
│   ├── lib/
│   │   └── automator.ts      # ブラウザ自動化クラス
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
  dateCandidates: string[]; // 日程候補の配列（YYYY年MM月DD日(曜日) 形式）
}
```

### 日程候補フォーマット

```typescript
// 正しい形式
const dateCandidates = [
  "2024年7月5日(金)",
  "2024年7月12日(金)",
  "2024年7月19日(金)"
];

// 不正な形式（エラーになります）
const invalidCandidates = [
  "2024/7/5",           // スラッシュ区切り
  "7月5日",             // 年なし
  "2024年7月5日"        // 曜日なし
];
```

## 技術的特徴

### Claude解析の利点

- **高精度**: 複雑な日程条件（祝日除外、特定日除外）も正確に処理
- **外部API不要**: Gemini APIなどの外部依存なし
- **リアルタイム**: APIレート制限やネットワーク遅延なし
- **柔軟性**: 自然な日本語表現に幅広く対応

### アーキテクチャ

```
ユーザー指示 → Claude解析 → 日程候補生成 → MCPツール → Playwright → 調整さん作成
```

## トラブルシューティング

### ブラウザの初期化に失敗する場合

Playwrightのブラウザが正しくインストールされていない可能性があります：

```bash
npx playwright install chromium
```

## 貢献

プルリクエストやイシューの投稿を歓迎します。

## サポート

質問やサポートが必要な場合は、GitHubのIssuesをご利用ください。