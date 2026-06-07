import { type PerpsRuntimeConfig } from "../config.js";
export type OiTick = {
    ts: number;
    symbol: string;
    markPrice: number;
    indexPrice?: number;
    openInterestUsd: number;
    fundingRate?: number;
    bestBid?: number;
    bestAsk?: number;
    depthUsd?: number;
    longOiUsd?: number;
    shortOiUsd?: number;
};
export type ReadPhoenixOiTickArgs = {
    symbol: string;
    config?: PerpsRuntimeConfig;
    apiUrl?: string;
    rpcUrl?: string;
    mock?: boolean;
};
export declare function buildMockOiTick(symbol: string): OiTick;
export declare function readPhoenixOiTick(args: ReadPhoenixOiTickArgs): Promise<OiTick>;
