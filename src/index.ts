#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ChouseiSanAutomator } from "./lib/automator.js";
import { DateCalculator } from "./lib/date-calculator.js";
import { fileURLToPath } from "url";
import path from "path";
/**
 * 調整さん自動化MCP Server
 * 自然言語による日程指定で調整さんのイベントを自動作成
 */
class ChouseiSanMCPServer {
    server;
    constructor() {
        this.server = new McpServer({
            name: "chouseisan-mcp-server",
            version: "1.0.0"
        });
        this.setupTools();
    }
    /**
     * MCPツールを設定
     */
    setupTools() {
        // 調整さんイベント作成ツール
        this.server.registerTool("create_chouseisan_event", {
            title: "調整さんイベント作成",
            description: "自然言語による日程指定で調整さんのイベントを自動作成します。例: '毎週金曜日 19:30から の会議' または '1月15日、1月22日、1月29日 の打ち合わせ'",
            inputSchema: {
                title: z.string().describe("イベントのタイトル"),
                schedule: z
                    .string()
                    .describe("日程の指定（自然言語）。例: '毎週金曜日', '1月15日、1月22日、1月29日', '毎週月水金', '1月から3月まで毎週火曜日'"),
                timeFormat: z
                    .string()
                    .optional()
                    .default("19:30〜")
                    .describe("時間帯の表記（例: '19:30〜', '10:00～12:00'）"),
                memo: z.string().optional().describe("メモや説明文")
            }
        }, async (request) => {
            try {
                const { title, schedule, timeFormat = "19:30〜", memo } = request;
                // 自然言語による日程解析
                //console.error(`日程解析開始: ${schedule}`);
                const dateCandidates = DateCalculator.parseSchedule(schedule, {
                    timeFormat
                });
                if (dateCandidates.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 日程の解析に失敗しました。\n指定された日程: "${schedule}"\n\n有効な形式例:\n- "毎週金曜日"\n- "1月15日、1月22日、1月29日"\n- "毎週月水金"\n- "1月から3月まで毎週火曜日"`
                            }
                        ]
                    };
                }
                //console.error(`日程候補生成完了: ${dateCandidates.length}件`);
                const dateStrings = DateCalculator.formatDatesForChouseisan(dateCandidates);
                // 調整さん自動化実行
                const automator = new ChouseiSanAutomator();
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
                const result = await automator.createEvent({
                    title,
                    memo,
                    timeFormat,
                    dateCandidates: dateStrings
                });
                await automator.close();
                //console.error(`調整さん作成完了: ${result.success}`);
                if (result.success && result.url) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `✅ 調整さんイベントを作成しました！\n\n📅 **${title}**\n🔗 **URL**: ${result.url}\n\n📋 **日程候補** (${dateCandidates.length}件):\n${dateStrings
                                    .slice(0, 5)
                                    .map(d => `• ${d}`)
                                    .join("\n")}${dateStrings.length > 5 ? `\n... 他${dateStrings.length - 5}件` : ""}\n\n💡 このURLを参加者に共有してください。`
                            }
                        ]
                    };
                }
                else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 調整さんの作成に失敗しました。\n\nエラー: ${result.error || result.message}\n\n再度お試しいただくか、手動で https://chouseisan.com/ にアクセスして作成してください。`
                            }
                        ]
                    };
                }
            }
            catch (error) {
                //console.error("調整さん作成エラー:", error);
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ 予期しないエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        });
        // 日程候補のプレビューツール
        this.server.registerTool("preview_schedule_candidates", {
            title: "日程候補プレビュー",
            description: "自然言語による日程指定を解析し、生成される日程候補をプレビューします",
            inputSchema: {
                schedule: z.string().describe("日程の指定（自然言語）"),
                timeFormat: z
                    .string()
                    .optional()
                    .default("19:30〜")
                    .describe("時間帯の表記"),
                maxDates: z
                    .number()
                    .optional()
                    .default(10)
                    .describe("表示する最大日程数")
            }
        }, async (request) => {
            try {
                const { schedule, timeFormat = "19:30〜", maxDates = 10 } = request;
                const dateCandidates = DateCalculator.parseSchedule(schedule, {
                    timeFormat
                });
                if (dateCandidates.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ 日程の解析に失敗しました。\n指定された日程: "${schedule}"\n\n有効な形式例:\n- "毎週金曜日"\n- "1月15日、1月22日、1月29日"\n- "毎週月水金"`
                            }
                        ]
                    };
                }
                const dateStrings = DateCalculator.formatDatesForChouseisan(dateCandidates);
                const displayDates = dateStrings.slice(0, maxDates);
                return {
                    content: [
                        {
                            type: "text",
                            text: `📅 **日程候補プレビュー**\n\n🔍 **解析した日程**: "${schedule}"\n⏰ **時間**: ${timeFormat}\n📊 **生成された候補数**: ${dateCandidates.length}件\n\n📋 **日程一覧** (最初の${displayDates.length}件):\n${displayDates
                                .map((d, i) => `${i + 1}. ${d}`)
                                .join("\n")}${dateCandidates.length > maxDates ? `\n\n... 他${dateCandidates.length - maxDates}件の候補があります` : ""}`
                        }
                    ]
                };
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `❌ 日程候補の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`
                        }
                    ]
                };
            }
        });
    }
    /**
     * サーバーを開始
     */
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        //console.error("調整さんMCP Serverが開始されました");
    }
}
/**
 * エントリーポイント
 */
async function main() {
    try {
        //console.error("調整さんMCP Server 開始中...");
        const server = new ChouseiSanMCPServer();
        // エラーハンドリング
        process.on("SIGINT", () => {
            //console.error("\nサーバーを終了します...");
            process.exit(0);
        });
        process.on("unhandledRejection", (reason, promise) => {
            //console.error("Unhandled Rejection at:", promise, "reason:", reason);
            // プロセスを終了させない
        });
        process.on("uncaughtException", error => {
            //console.error("Uncaught Exception:", error);
            // プロセスを終了させない
        });
        await server.start();
    }
    catch (error) {
        //console.error("サーバー開始エラー:", error);
        //console.error("エラー詳細:", error instanceof Error ? error.stack : error);
        process.exit(1);
    }
}
//console.log("DEBUG: main() 関数呼び出し前");
// ------------------- エントリーポイント判定 -------------------
const currentPath = fileURLToPath(import.meta.url);
const entryPath = path.resolve(process.argv[1]);
if (currentPath === entryPath) {
    main().catch(console.error);
}
// ----------------------------------------------------------------
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map