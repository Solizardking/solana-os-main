import type { PerpsRuntimeConfig } from "../config.js";
export interface PhoenixPerpMarketView {
    symbol: string;
    markPrice?: number | null;
    spotPrice?: number | null;
    fundingRate?: number | null;
    openInterest?: number | null;
    status?: string | null;
}
export interface PhoenixRiseAdapter {
    listMarkets(): Promise<PhoenixPerpMarketView[]>;
    getTicker(symbol?: string): Promise<unknown>;
    getOrderbook(symbol: string, depth?: number): Promise<unknown>;
    getTraderSnapshot(authority?: string): Promise<unknown>;
    getPositions(authority?: string): Promise<unknown>;
    health(): Promise<unknown>;
}
export declare class ClawdPhoenixRiseAdapter implements PhoenixRiseAdapter {
    private readonly config;
    private readonly perps;
    constructor(config: PerpsRuntimeConfig);
    listMarkets(): Promise<PhoenixPerpMarketView[]>;
    getTicker(symbol?: string): Promise<unknown>;
    getOrderbook(symbol: string, depth?: number): Promise<unknown>;
    getTraderSnapshot(authority?: string): Promise<unknown>;
    getPositions(authority?: string): Promise<unknown>;
    health(): Promise<unknown>;
}
export declare function createPhoenixRiseAdapter(config: PerpsRuntimeConfig): PhoenixRiseAdapter;
