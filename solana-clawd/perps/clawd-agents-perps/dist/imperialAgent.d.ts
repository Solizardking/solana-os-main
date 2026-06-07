/**
 * Imperial Perps Agent — real Imperial Trading API client
 *
 * Base: https://api.imperial.space/api/v1
 * Auth: JWT obtained via connect → exchange flow (or pre-set IMPERIAL_JWT env var)
 *
 * Environment:
 *   IMPERIAL_JWT             — pre-issued JWT (skip auth flow)
 *   IMPERIAL_WALLET          — operator wallet pubkey (base58, never private key)
 *   IMPERIAL_PROFILE_INDEX   — subaccount index 0..5 (default 0)
 *   IMPERIAL_LIVE            — "true" to enable live submission
 *   IMPERIAL_MAX_SIZE_USD    — hard cap per order in USD (default 100)
 *   IMPERIAL_ALLOWED_SYMS    — comma-separated allowlist (default SOL,ETH,BTC)
 *   IMPERIAL_SLIPPAGE_BPS    — default slippage (default 50)
 */
export declare const IMPERIAL_BASE = "https://api.imperial.space/api/v1";
export type Underwriter = 0 | 1 | 2 | 3;
export declare const Underwriter: {
    readonly Jupiter: Underwriter;
    readonly Flash: Underwriter;
    readonly Phoenix: Underwriter;
    readonly GMTrade: Underwriter;
};
export declare const UNDERWRITER_LABELS: Record<Underwriter, string>;
export type OrderType = 0 | 1 | 2 | 3 | 4 | 6 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
export declare const ORDER_TYPE_NAMES: Record<number, string>;
export interface ImperialConfig {
    jwt: string;
    wallet: string;
    profileIndex: number;
    live: boolean;
    maxSizeUsd: number;
    allowedSymbols: string[];
    slippageBps: number;
    base: string;
}
export declare function loadImperialConfig(env?: NodeJS.ProcessEnv): ImperialConfig;
/** sizeUsd in human dollars → 6-decimal fixed point (1_000_000 = $1) */
export declare function usdToFixed(usd: number): number;
/** 6-decimal fixed point → human dollars */
export declare function fixedToUsd(fixed: number): number;
export interface ConnectResponse {
    code: string;
}
export interface ExchangeResponse {
    jwt: string;
    expires_at: string;
}
export interface ExtraData {
    worstPrice?: number;
    ratchetSize?: number;
    waitPrice?: number;
    waitDuration?: number;
    dcaStartPrice?: number;
    dcaEndPrice?: number;
    dcaNumLegs?: number;
    dcaCloseStartPrice?: number;
    dcaCloseEndPrice?: number;
    dcaCloseNumLegs?: number;
    dcaCloseIntervalSeconds?: number;
    dcaCloseRatchetSize?: number;
    dcaIntervalSeconds?: number;
    dcaRatchetSize?: number;
}
export interface MobileCreateOrderRequest {
    wallet: string;
    profileIndex: number;
    action: 0 | 1;
    side: 0 | 1;
    underwriter: Underwriter;
    orderType: OrderType;
    sizeUsd: number;
    collateralAmount: number;
    slippageBps: number;
    fundingStatus: 0 | 1;
    priority: number;
    triggerPrice: number;
    triggerCondition: 0 | 1;
    symbol?: string | null;
    marketMint?: string | null;
    marketPrice?: number;
    parentOrderPda?: string | null;
    phoenixNative?: unknown | null;
    extraData?: ExtraData | null;
}
export interface MobileOrderResponse {
    success: boolean;
    error: string | null;
    orderPda: string | null;
    signature: string | null;
}
export interface MobileBatchRequest {
    entry: MobileCreateOrderRequest;
    closeOrders?: MobileCreateOrderRequest[];
}
export interface MobileBatchResponse {
    entry: MobileOrderResponse;
    closeOrders: MobileOrderResponse[];
}
export interface MobileCancelRequest {
    wallet: string;
    profileIndex: number;
    orderPda: string;
}
export interface MobileCollateralRequest {
    wallet: string;
    profileIndex: number;
    action: 0 | 1;
    marketMint: string;
    side: 0 | 1;
    underwriter: Underwriter;
    collateralAmount: number;
    price: number;
    slippageBps: number;
}
export interface MobileUpdateRequest {
    wallet: string;
    profileIndex: number;
    orderPda: string;
    sizeUsd?: number;
    triggerPrice?: number;
    slippageBps?: number;
    closeBps?: number;
    priority?: number;
    proOrderUpdate?: {
        type: string;
        worstPrice?: number;
        ratchetSize?: number;
        waitPrice?: number;
        waitDurationSeconds?: number;
    } | null;
}
export interface DepositBuildTxRequest {
    wallet: string;
    profileIndex: number;
    amount: number;
    mode: "deposit" | "withdraw";
}
export interface ProfileBalance {
    profileIndex: number;
    profilePda: string;
    usdc: number;
}
export interface BalancesResponse {
    wallet: string;
    profiles: ProfileBalance[];
}
export interface FundingRateEntry {
    symbol: string;
    venue: string;
    source: string;
    longFundingRatePerHourPercent: number | null;
    shortFundingRatePerHourPercent: number | null;
    longBorrowRatePerHourPercent: number | null;
    shortBorrowRatePerHourPercent: number | null;
}
export interface MarkPriceEntry {
    symbol: string;
    venue: string;
    source: string;
    price: number;
    fetchedAtUnixMs: number;
}
export interface RouteRecommendation {
    underwriter: Underwriter;
    venue: string;
    estimatedFee: number;
    reason: string;
}
export interface PhoenixDepthSnapshot {
    symbol: string;
    bids: [number, number][];
    asks: [number, number][];
}
export type AgentDecision = "buy" | "sell" | "watch";
export interface ImperialMarketSnapshot {
    symbol: string;
    markPrice: number | null;
    fundingRates: FundingRateEntry[];
    depth: PhoenixDepthSnapshot | null;
}
export interface AgentSignal {
    symbol: string;
    decision: AgentDecision;
    confidence: number;
    scores: {
        momentum: number;
        funding: number;
        liquidity: number;
    };
    rationale: string;
    snapshot: ImperialMarketSnapshot;
}
export declare function scoreImperialMarket(snap: ImperialMarketSnapshot): AgentSignal;
export type ExecutionStatus = "preview" | "submitted" | "failed" | "blocked";
export interface ExecutionRecord {
    id: string;
    ts: number;
    wallet: string;
    profileIndex: number;
    venue: string;
    underwriter: Underwriter;
    symbol: string;
    side: "long" | "short";
    action: "increase" | "decrease";
    orderType: string;
    sizeUsd: number;
    dryRun: boolean;
    request: unknown;
    response: unknown;
    status: ExecutionStatus;
    error?: string;
    txSignature?: string;
    orderPda?: string;
}
export declare class ImperialClient {
    config: ImperialConfig;
    constructor(config?: Partial<ImperialConfig>);
    get jwt(): string;
    get wallet(): string;
    /**
     * Exchange a pre-signed connect code for a JWT.
     * The caller must sign imperial:mobile-connect:{wallet}:{nonce} externally.
     */
    exchangeCode(code: string): Promise<ExchangeResponse>;
    /** Revoke the current JWT (call on bot shutdown). */
    revokeJwt(): Promise<void>;
    getStatus(): Promise<unknown>;
    getFundingRates(): Promise<FundingRateEntry[]>;
    getMarkPrices(): Promise<MarkPriceEntry[]>;
    getPhoenixMarkPrices(): Promise<MarkPriceEntry[]>;
    getPhoenixDepth(symbol?: string): Promise<PhoenixDepthSnapshot | PhoenixDepthSnapshot[]>;
    getPhoenixMarkets(): Promise<unknown>;
    getFlashMarkets(): Promise<unknown>;
    getGMTradeMarkets(): Promise<unknown>;
    getGMTradeFundingRates(): Promise<unknown>;
    getPositions(wallet?: string): Promise<unknown>;
    getOrders(wallet?: string): Promise<unknown>;
    getPassthroughOrders(wallet?: string): Promise<unknown>;
    getRoute(asset: string, side: 0 | 1, notional: number): Promise<RouteRecommendation>;
    getPriorityFee(): Promise<unknown>;
    getTrades(wallet?: string): Promise<unknown>;
    getBalances(): Promise<BalancesResponse>;
    private requireJwt;
    private requireLive;
    /** Build a baseline order request with all required fields. */
    buildOrderRequest(opts: {
        symbol: string;
        side: 0 | 1;
        action: 0 | 1;
        sizeUsd: number;
        underwriter?: Underwriter;
        orderType?: OrderType;
        collateralAmount?: number;
        slippageBps?: number;
        triggerPrice?: number;
        triggerCondition?: 0 | 1;
        fundingStatus?: 0 | 1;
        priority?: number;
        extraData?: ExtraData | null;
        parentOrderPda?: string | null;
    }): MobileCreateOrderRequest;
    /** Submit a single order. Dry-run when IMPERIAL_LIVE is not set. */
    placeOrder(req: MobileCreateOrderRequest, dryRun?: boolean): Promise<{
        response: MobileOrderResponse;
        record: ExecutionRecord;
    }>;
    /** Submit entry + TP/SL legs in one atomic batch request. */
    placeBatch(req: MobileBatchRequest, dryRun?: boolean): Promise<{
        response: MobileBatchResponse;
        records: ExecutionRecord[];
    }>;
    cancelOrder(req: MobileCancelRequest): Promise<MobileOrderResponse>;
    updateOrder(req: MobileUpdateRequest): Promise<MobileOrderResponse>;
    editCollateral(req: MobileCollateralRequest): Promise<MobileOrderResponse>;
    buildDepositTx(req: DepositBuildTxRequest): Promise<{
        transaction: string;
    }>;
    syncProfile(wallet?: string, index?: number): Promise<unknown>;
    registerPhoenix(wallet?: string, profileIndex?: number): Promise<unknown>;
    /** Fetch a full market snapshot for signal scoring. */
    fetchSnapshot(symbol: string): Promise<ImperialMarketSnapshot>;
    /** Full OODA cycle: observe → score → decide → optionally route. */
    runCycle(symbol: string, opts?: {
        sizeUsd?: number;
        autoRoute?: boolean;
    }): Promise<{
        signal: AgentSignal;
        record: ExecutionRecord | null;
    }>;
    /** Scan all allowed symbols and return ranked signals. */
    runScan(opts?: {
        sizeUsd?: number;
        autoRoute?: boolean;
    }): Promise<{
        signals: AgentSignal[];
        records: ExecutionRecord[];
    }>;
    /** Health summary. */
    healthCheck(): Promise<{
        configured: boolean;
        live: boolean;
        wallet: string;
        profileIndex: number;
        allowedSymbols: string[];
        maxSizeUsd: number;
        slippageBps: number;
        jwtPresent: boolean;
        apiStatus: unknown;
        warnings: string[];
    }>;
}
export declare function createImperialClient(config?: Partial<ImperialConfig>): ImperialClient;
