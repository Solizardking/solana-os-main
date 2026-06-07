export type TradingMode = "observe" | "paper" | "live";
export interface PerpsRiskLimits {
    allowedSymbols: string[];
    maxNotionalUsd: number;
    maxLeverage: number;
    maxSpreadBps: number;
    requireWallet: boolean;
}
export interface PerpsRuntimeConfig {
    rpcUrl: string;
    apiUrl: string;
    heliusApiKey?: string;
    wallet?: string;
    traderPdaIndex: number;
    traderSubaccountIndex: number;
    liveTrading: boolean;
    operatorConfirmed: boolean;
    simOnly: boolean;
    telegramBotToken?: string;
    telegramAllowedChats: string[];
    risk: PerpsRiskLimits;
}
export interface PreflightRequest {
    symbol: string;
    notionalUsd: number;
    leverage?: number;
    expectedSpreadBps?: number;
    execution: "observe" | "paper" | "vulcan-live" | "rise-live";
}
export interface PreflightReport {
    ok: boolean;
    mode: TradingMode;
    blocking: string[];
    warnings: string[];
}
export declare function loadPerpsRuntimeConfig(env?: NodeJS.ProcessEnv): PerpsRuntimeConfig;
export declare function resolveTradingMode(config: PerpsRuntimeConfig): TradingMode;
export declare function buildPreflightReport(config: PerpsRuntimeConfig, request: PreflightRequest): PreflightReport;
export declare function assertLiveTradingAllowed(config: PerpsRuntimeConfig, request: Omit<PreflightRequest, "execution">): PreflightReport;
