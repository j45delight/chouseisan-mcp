#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ChouseiSanAutomator } from "./lib/automator.js";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

/**
 * 調整さん自動化MCP Server with Claude direct date parsing
 * Gemini APIを使わず、MCPクライアント（Claude）が直接日程候補を生成
 */
class ChouseiSanMCPServer {
  server;

  constructor() {
    this.server = new McpServer({
      name: "chouseisan-mcp-server-claude",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {
          listChanged: true
        }
      }
    });

    this.setupTools();
  }

  /**
   * MCPツールを設定
   */
  setupTools() {
    // 調整さんイベント作成ツール（Claude直接解析版）
    this.server.registerTool(
      "create_chouseisan_event",
      {
        title: "調整さんイベント作成（Claude解析）",
        description: "具体的な日程候補リストから調整さんのイベントを自動作成します。MCPクライアント（Claude）が自然言語の日程指定を解析して、具体的な日程候補配列を生成してください。",
        inputSchema: {
          title: z.string().describe("イベントのタイトル"),
          dateCandidates: z.array(z.string()).describe(
            "日程候補のリスト。YYYY年MM月DD日(曜日) 形式で指定してください。例: ['2024年7月5日(金)', '2024年7月12日(金)', '2024年7月19日(金)']。MCPクライアント（Claude）が自然言語指定を解析してこの配列を生成します。"
          ),
          dateExclusions: z.array(z.string()).optional().describe(
            "除外する日程のリスト。dateCandidatesと同じ形式で指定してください。例: ['2024年7月11日(木)', '2024年7月21日(月)']。MCPクライアント（Claude）が除外条件（祝日、お盆、指定日など）を解析してこの配列を生成します。"
          ),
          timeFormat: z
            .string()
            .optional()
            .default("19:30〜")
            .describe("時間帯の表記（例: '19:30〜', '10:00～12:00'）"),
          memo: z.string().optional().describe("メモや説明文")
        }
      },
      async (request) => {
        try {
          const { title, dateCandidates, dateExclusions = [], timeFormat = "19:30〜", memo } = request;

          // 入力検証
          if (!Array.isArray(dateCandidates) || dateCandidates.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ 日程候補が指定されていません。\n\nMCPクライアント（Claude）が自然言語の日程指定を解析して、以下の形式で日程候補配列を生成してください：\n\n例: ['2024年7月5日(金)', '2024年7月12日(金)', '2024年7月19日(金)']\n\n日程候補数: 最低1件以上必要`
                }
              ]
            };
          }

          //console.error(`Claude解析による日程候補受信: ${dateCandidates.length}件`);
          //console.error(`候補一覧: ${dateCandidates.slice(0, 3).join(", ")}${dateCandidates.length > 3 ? "..." : ""}`);
          // 新しい変数でフィルタリング結果を保持
          let filteredDateCandidates = dateCandidates; // 初期値として元の候補を設定
          // 除外処理実行
          if (Array.isArray(request.dateExclusions) && request.dateExclusions.length > 0) {
            //console.error(`除外日程候補: ${request.excludeData.join(", ")}`);
            filteredDateCandidates = dateCandidates.filter(date => !dateExclusions.includes(date));
          }
          
          // 調整さん自動化実行
          const email = process.env.CHOUSEISAN_EMAIL || "";
          const password = process.env.CHOUSEISAN_PASSWORD || "";
          const automator = new ChouseiSanAutomator(email, password);
          //console.error("ブラウザ初期化開始");
          const initialized = await automator.init();
          if (!initialized) {
            return {
              content: [
                {
                  type: "text",
                  text: "❌ ブラウザの初期化に失敗しました。システム管理者にお問い合わせください。"
                }
              ]
            };
          }

          //console.error("調整さん作成開始");
          // 調整さんログイン
          await automator.login();
          const result = await automator.createEvent({
            title,
            memo,
            timeFormat,
            dateCandidates: filteredDateCandidates,
            excludeDates: dateExclusions,
          });
          await automator.close();
          //console.error(`調整さん作成完了: ${result.success}`);

          if (result.success && result.url) {
            return {
              content: [
                {
                  type: "text",
                  text: `✅ 調整さんイベントを作成しました！\n\n📅 **${title}**\n🔗 **URL**: ${result.url}\n\n📋 **日程候補** (${dateCandidates.length}件):\n${dateCandidates
                    .slice(0, 5)
                    .map(d => `• ${d}`)
                    .join(
                      "\n"
                    )}${dateCandidates.length > 5 ? `\n... 他${dateCandidates.length - 5}件` : ""}\n\n💡 このURLを参加者に共有してください。\n\n🤖 **Powered by Claude** で日程解析しました。`
                }
              ]
            };
          } else {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ 調整さんの作成に失敗しました。\n\nエラー: ${result.error || result.message}\n\n再度お試しいただくか、手動で https://chouseisan.com/ にアクセスして作成してください。`
                }
              ]
            };
          }
        } catch (error) {
          //console.error("調整さん作成エラー:", error);
          return {
            content: [
              {
                type: "text",
                text: `❌ 予期しないエラーが発生しました: ${
                  error instanceof Error ? error.message : String(error)
                }`
              }
            ]
          };
        }
      }
    );

    // 日程候補のバリデーションツール（Claude解析版）
    this.server.registerTool(
      "validate_schedule_candidates",
      {
        title: "日程候補バリデーション",
        description: "Claudeが生成した日程候補リストの形式をバリデーションし、調整さん作成前に確認します",
        inputSchema: {
          dateCandidates: z.array(z.string()).describe("バリデーションする日程候補のリスト"),
          timeFormat: z
            .string()
            .optional()
            .default("19:30〜")
            .describe("時間帯の表記")
        }
      },
      async (request) => {
        try {
          const { dateCandidates, timeFormat = "19:30〜" } = request;

          if (!Array.isArray(dateCandidates) || dateCandidates.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `❌ 日程候補が指定されていません。\n\n正しい形式: ['2024年7月5日(金)', '2024年7月12日(金)']`
                }
              ]
            };
          }

          // 簡単な形式チェック
          const invalidCandidates = dateCandidates.filter(date => {
            // YYYY年MM月DD日(曜日) の基本形式チェック
            return !/^\d{4}年\d{1,2}月\d{1,2}日\(.+\)$/.test(date);
          });

          if (invalidCandidates.length > 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `⚠️ 不正な形式の日程候補が見つかりました：\n\n${invalidCandidates.map(d => `• ${d}`).join('\n')}\n\n**正しい形式**: YYYY年MM月DD日(曜日)\n**例**: 2024年7月5日(金)`
                }
              ]
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `✅ **日程候補バリデーション完了**\n\n📊 **総候補数**: ${dateCandidates.length}件\n⏰ **時間**: ${timeFormat}\n\n📋 **全候補一覧**:\n${dateCandidates
                  .map((d, i) => `${i + 1}. ${d}`)
                  .join('\n')}\n\n✅ **形式チェック**: すべて正常\n💡 **次のステップ**: \`create_chouseisan_event\` ツールでイベントを作成できます。\n\n🤖 **Claude解析による日程生成が完了しました！**`
              }
            ]
          };
        } catch (error) {
          //console.error("バリデーションエラー:", error);
          return {
            content: [
              {
                type: "text",
                text: `❌ バリデーション処理でエラーが発生しました: ${
                  error instanceof Error ? error.message : String(error)
                }`
              }
            ]
          };
        }
      }
    );
  }

  /**
   * サーバーを開始
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    //console.error("調整さんMCP Server（Claude解析版）が開始されました");
  }
}

/**
 * エントリーポイント
 */
async function main() {
  try {
    //console.error("調整さんMCP Server（Claude解析版）開始中...");

    const server = new ChouseiSanMCPServer();

    // エラーハンドリング
    process.on("SIGINT", () => {
      //console.error("\nサーバーを終了します...");
      process.exit(0);
    });
    process.on("unhandledRejection", (reason, promise) => {
      //console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
    process.on("uncaughtException", error => {
      //console.error("Uncaught Exception:", error);
    });

    await server.start();
  } catch (error) {
    //console.error("サーバー開始エラー:", error);
    //console.error("エラー詳細:", error instanceof Error ? error.stack : error);
    process.exit(1);
  }
}

// ------------------- エントリーポイント判定 -------------------
const currentPath = fileURLToPath(import.meta.url);
const entryPath = path.resolve(process.argv[1]);

if (currentPath === entryPath) {
  main().catch(console.error);
}
