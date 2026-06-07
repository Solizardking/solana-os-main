import { type PerpsRuntimeConfig, type PreflightReport } from "./config.js";
import { type PhoenixRiseAdapter } from "./adapters/phoenixRise.js";
import { type VulcanExecutionIntent, type VulcanExecutionPlan } from "./adapters/vulcan.js";
import { type TwammAutomationStatus, type TwammAutomationPlan } from "./twammAutomation.js";
import { type OnchainMarketMakerStatus, type OnchainMarketMakerPlan } from "./onchainMarketMaker.js";
export interface MarketMakerIntent {
    symbol: string;
    mode: "observe" | "quote" | "paper" | "live";
    maxNotionalUsd: number;
    maxSpreadBps: number;
}
export interface MarketMakerStatus {
    armed: boolean;
    mode: "observe" | "paper" | "live";
    symbol: string;
    notes: string[];
}
export interface TraderActionPreview {
    symbol: string;
    side: "buy" | "sell";
    notionalUsd: number;
    execution: "observe" | "paper" | "rise-live" | "vulcan-live";
    preflight: PreflightReport;
    route: {
        adapter: "rise" | "vulcan";
        action: string;
        payload: unknown;
    };
}
export declare class ClawdPerpsRuntime {
    readonly config: PerpsRuntimeConfig;
    readonly repoRoot: string;
    readonly rise: PhoenixRiseAdapter;
    constructor(config?: PerpsRuntimeConfig, repoRoot?: string);
    createStatus(intent: MarketMakerIntent): MarketMakerStatus;
    listMarkets(): Promise<import("./adapters/phoenixRise.js").PhoenixPerpMarketView[]>;
    getTicker(symbol?: string): Promise<unknown>;
    getPositions(authority?: string): Promise<unknown>;
    getPortfolio(authority?: string): Promise<unknown>;
    getRuntimeHealth(): Promise<{
        health: unknown;
        mode: import("./config.js").TradingMode;
        walletConfigured: boolean;
        trackedMarkets: number;
        allowedSymbols: string[];
        vulcan: import("./vulcanCatalog.js").VulcanCatalogSummary;
    }>;
    getVulcanCatalogSummary(): Promise<import("./vulcanCatalog.js").VulcanCatalogSummary>;
    listSkills(category?: "vulcan" | "clawd" | "other"): Promise<import("./vulcanCatalog.js").VulcanSkillEntry[]>;
    previewObserve(symbol: string, expectedSpreadBps?: number): TraderActionPreview;
    previewPaperTrade(symbol: string, side: "buy" | "sell", notionalUsd: number, expectedSpreadBps?: number): TraderActionPreview;
    previewLiveTrade(symbol: string, side: "buy" | "sell", notionalUsd: number, leverage?: number, expectedSpreadBps?: number): TraderActionPreview;
    buildVulcanPlan(intent: VulcanExecutionIntent, notionalUsd?: number, expectedSpreadBps?: number): VulcanExecutionPlan;
    getTwammStatus(): TwammAutomationStatus;
    buildTwammCrankPlan(opts?: {
        rpcUrl?: string;
        tokenAMint?: string;
        tokenBMint?: string;
        walletPath?: string;
        once?: boolean;
        yes?: boolean;
    }): TwammAutomationPlan;
    /**
     * Preview a TWAMM-scheduled execution for large orders.
     * TWAMM fills at the time-weighted oracle price over a configurable window,
     * eliminating market-impact slippage at the cost of deferred fills.
     * Use when notionalUsd exceeds ~$50k or when low-impact execution is required.
     */
    previewTwammExecution(symbol: string, side: "buy" | "sell", notionalUsd: number, tokenAMint?: string, tokenBMint?: string): TraderActionPreview & {
        twamm: TwammAutomationPlan;
    };
    getOnchainMmStatus(): OnchainMarketMakerStatus;
    buildOnchainMmPlan(opts?: {
        market?: string;
        ticker?: string;
        rpcUrl?: string;
        keypairPath?: string;
        quoteEdgeBps?: number;
        quoteSize?: number;
        refreshMs?: number;
        priceImprovement?: string;
        postOnly?: boolean;
        release?: boolean;
        yes?: boolean;
    }): OnchainMarketMakerPlan;
    /**
     * Preview a Phoenix on-chain market-maker run plan.
     * The mm binary places resting limit orders on the Phoenix CLOB, earning
     * maker rebates while tightening the book spread.
     */
    previewOnchainMm(market?: string, ticker?: string, quoteEdgeBps?: number): {
        status: OnchainMarketMakerStatus;
        plan: OnchainMarketMakerPlan;
    };
    /**
     * Build a Vulcan TWAP execution plan for large perps orders.
     * Uses `vulcan strategy twap start` — the runner owns the loop, tick display,
     * ledger, and report. Prefer this over manual slice execution.
     */
    buildVulcanTwapPlan(opts: {
        symbol: string;
        side: "buy" | "sell";
        notionalUsd: number;
        slices?: number;
        intervalSeconds?: number;
        mode?: "paper" | "dry_run" | "confirm_each" | "auto_execute";
        maxPriceDriftBps?: number;
    }): {
        command: string;
        args: string[];
        note: string;
    };
}
export declare function createMarketMakerStatus(config: PerpsRuntimeConfig, intent: MarketMakerIntent): MarketMakerStatus;
