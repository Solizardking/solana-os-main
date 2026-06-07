/**
 * Imperial WebSocket Client
 *
 * Two persistent connections:
 *   /ws        — wallet-scoped invalidation (positions_updated, orders_updated)
 *   /ws/market — public market data stream (funding, marks, depth)
 *
 * Typed event emitter with automatic ping/pong keepalive and exponential-backoff
 * reconnect. Works in both Node (ws package) and browser (native WebSocket).
 */
type Listener<T> = (data: T) => void;
export interface FundingUpdateEvent {
    type: "funding_rate_update";
    symbol: string;
    venue: string;
    source: string;
    longFundingRatePerHourPercent: number | null;
    shortFundingRatePerHourPercent: number | null;
    longBorrowRatePerHourPercent: number | null;
    shortBorrowRatePerHourPercent: number | null;
}
export interface MarkPriceUpdateEvent {
    type: "mark_price_update";
    symbol: string;
    venue: string;
    source: string;
    price: number;
    fetchedAtUnixMs: number;
}
export interface DepthUpdateEvent {
    type: "phoenix_depth_update";
    symbol: string;
    snapshot: {
        bids: [number, number][];
        asks: [number, number][];
    };
}
export interface WalletEvent {
    type: "positions_updated" | "orders_updated";
}
export type MarketEvent = FundingUpdateEvent | MarkPriceUpdateEvent | DepthUpdateEvent;
export interface MarketCache {
    funding: Map<string, FundingUpdateEvent>;
    markPrices: Map<string, MarkPriceUpdateEvent>;
    depth: Map<string, DepthUpdateEvent["snapshot"]>;
    lastUpdated: number;
}
export declare function createMarketCache(): MarketCache;
declare class TypedEmitter<Events extends object> {
    private listeners;
    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this;
    off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this;
    emit<K extends keyof Events>(event: K, data: Events[K]): void;
}
interface MarketWsEventMap {
    funding: FundingUpdateEvent;
    mark: MarkPriceUpdateEvent;
    depth: DepthUpdateEvent;
    connected: void;
    disconnected: {
        code: number;
        reason: string;
    };
    error: Error;
}
export declare class ImperialMarketWs extends TypedEmitter<MarketWsEventMap> {
    private readonly wsUrl;
    private readonly subscribeSymbols?;
    private ws;
    private stopped;
    private reconnectDelay;
    private pingTimer;
    readonly cache: MarketCache;
    constructor(wsUrl: string, subscribeSymbols?: string[] | undefined);
    connect(): Promise<void>;
    private subscribe;
    private handleMessage;
    private startPing;
    private stopPing;
    private scheduleReconnect;
    /** Get latest mark price for a symbol from cache. */
    getMarkPrice(symbol: string, venue?: string): number | null;
    /** Get latest funding for a symbol+venue from cache. */
    getFunding(symbol: string, venue?: string): FundingUpdateEvent | null;
    /** Get latest depth snapshot for a symbol. */
    getDepth(symbol: string): DepthUpdateEvent["snapshot"] | null;
    /** Best mid price from depth cache. */
    getMid(symbol: string): number | null;
    disconnect(): void;
}
interface WalletWsEventMap {
    positions_updated: void;
    orders_updated: void;
    connected: void;
    disconnected: {
        code: number;
        reason: string;
    };
    error: Error;
}
export declare class ImperialWalletWs extends TypedEmitter<WalletWsEventMap> {
    private readonly wsUrl;
    private readonly wallet;
    private ws;
    private stopped;
    private reconnectDelay;
    private pingTimer;
    constructor(wsUrl: string, wallet: string);
    connect(): Promise<void>;
    private scheduleReconnect;
    disconnect(): void;
}
export declare function createImperialMarketWs(base: string, symbols?: string[]): ImperialMarketWs;
export declare function createImperialWalletWs(base: string, wallet: string): ImperialWalletWs;
export {};
