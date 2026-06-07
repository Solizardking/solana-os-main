/**
 * Imperial Perps Bot — natural language Telegram interface for the Imperial agent.
 *
 * Features:
 * - Persistent session: JWT, positions, last signals, conversation context
 * - Natural language NLP: regex + Claude fallback
 * - Full order lifecycle: scan, long, short, close, cancel, update, collateral
 * - Live market data: funding rates, mark prices, depth, route recommendation
 * - Account: balances, positions, orders, deposit/withdraw
 * - Browser-use Clawd capabilities (external research via fetch)
 * - WebSocket subscription for live market push to Telegram
 *
 * Environment (beyond ImperialConfig):
 *   TELEGRAM_BOT_TOKEN       — required
 *   TELEGRAM_ALLOWED_CHATS   — comma-separated chat IDs (empty = open)
 *   CLAWD_CLAUDE_API_KEY     — optional: Claude API key for NLP fallback
 *   IMPERIAL_STATE_FILE      — path to persist state JSON (default ./imperial-state.json)
 */
import { type ImperialConfig, type AgentSignal, type ExecutionRecord } from "./imperialAgent.js";
export interface BotState {
    jwt: string;
    jwtExpiresAt: string;
    lastSignals: AgentSignal[];
    lastScanTs: number;
    executionHistory: ExecutionRecord[];
    conversationCtx: Record<string, string[]>;
}
export type BotIntent = {
    kind: "scan";
    symbols?: string[];
} | {
    kind: "long";
    symbol: string;
    sizeUsd?: number;
    venue?: number;
    tpPrice?: number;
    slPrice?: number;
} | {
    kind: "short";
    symbol: string;
    sizeUsd?: number;
    venue?: number;
} | {
    kind: "close";
    symbol: string;
    sizeUsd?: number;
} | {
    kind: "cancel";
    orderPda: string;
} | {
    kind: "positions";
} | {
    kind: "balances";
} | {
    kind: "funding";
    symbol?: string;
} | {
    kind: "marks";
    symbol?: string;
} | {
    kind: "depth";
    symbol: string;
} | {
    kind: "route";
    symbol: string;
    side: "long" | "short";
    notional: number;
} | {
    kind: "health";
} | {
    kind: "orders";
} | {
    kind: "history";
} | {
    kind: "deposit";
    amount: number;
} | {
    kind: "withdraw";
    amount: number;
} | {
    kind: "help";
} | {
    kind: "unknown";
    raw: string;
};
export declare function parseIntent(text: string): BotIntent;
export declare class ImperialBot {
    private client;
    private token;
    private allowedChats;
    private claudeApiKey;
    private stateFile;
    private state;
    private updateOffset;
    private running;
    constructor(opts?: {
        imperialConfig?: Partial<ImperialConfig>;
        telegramToken?: string;
        allowedChats?: string[];
        claudeApiKey?: string;
        stateFile?: string;
    });
    private isAllowed;
    private addCtx;
    private pushRecord;
    /** Parse intent: regex first, Claude fallback if available and unknown. */
    private parseIntent;
    /** Browser-use: fetch a URL and return text content (Clawd capability). */
    browse(url: string): Promise<string>;
    /** Handle a single incoming message. */
    handleMessage(chatId: string | number, text: string): Promise<string>;
    /** Poll Telegram for updates and dispatch. */
    poll(): Promise<void>;
    /** Subscribe to Imperial /ws/market and push updates to a Telegram chat. */
    subscribeMarketWs(chatId: string | number, symbols?: string[]): Promise<void>;
    stop(): void;
}
/** Quick start: create and run the bot. */
export declare function startImperialBot(opts?: ConstructorParameters<typeof ImperialBot>[0]): Promise<ImperialBot>;
