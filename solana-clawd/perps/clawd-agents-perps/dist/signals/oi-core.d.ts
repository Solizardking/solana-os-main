import { type OiTick } from "../adapters/phoenix-rise.js";
export type ClawdOiRegime = "LONG_CONTINUATION" | "SHORT_CONTINUATION" | "SHORTS_CLOSING" | "LONGS_CLOSING" | "CROWDED_LONG_RISK" | "CROWDED_SHORT_RISK" | "NEUTRAL" | "DATA_INVALID";
export type SignalMode = "observe" | "paper" | "dry-run" | "confirm-each" | "auto-execute";
export type ClawdOiCoreSignal = {
    symbol: string;
    ts: number;
    regime: ClawdOiRegime;
    side: "long" | "short" | "flat";
    score: number;
    confidence: number;
    market: {
        markPrice: number;
        indexPrice?: number;
        priceDeltaPct: number;
        openInterestUsd: number;
        openInterestDeltaPct: number;
        fundingRate?: number;
        spreadBps?: number;
        depthUsd?: number;
        longOiUsd?: number;
        shortOiUsd?: number;
        skew?: number;
        markIndexBasisBps?: number;
    };
    gates: {
        dataFresh: boolean;
        oiPresent: boolean;
        spreadOk: boolean;
        fundingOk: boolean;
        liquidityOk: boolean;
        riskOk: boolean;
        executable: boolean;
        reason?: string;
    };
    action: {
        mode: SignalMode;
        suggestedRoute?: "phoenix" | "imperial" | "vulcan" | "none";
        maxNotionalUsdc?: number;
        stopReason?: string;
    };
};
export type BuildOiSignalArgs = {
    symbol: string;
    apiUrl?: string;
    rpcUrl?: string;
    previous?: OiTick;
    mode?: SignalMode;
    maxSpreadBps?: number;
    maxFundingAbs?: number;
    minDepthUsd?: number;
    maxMarkIndexBasisBps?: number;
    mock?: boolean;
};
export declare function classifyRegime(args: {
    priceDeltaPct: number;
    oiDeltaPct: number;
    fundingRate?: number;
    skew?: number;
}): Exclude<ClawdOiRegime, "DATA_INVALID">;
export declare function scoreSignal(args: {
    regime: ClawdOiRegime;
    priceDeltaPct: number;
    oiDeltaPct: number;
    fundingRate?: number;
    spreadBps?: number;
    skew?: number;
}): number;
export declare function buildClawdOiCoreSignal(args: BuildOiSignalArgs): Promise<ClawdOiCoreSignal>;
export declare function buildOiRiskGate(args: {
    signal: ClawdOiCoreSignal;
    notionalUsdc: number;
    side: "long" | "short";
}): {
    ok: boolean;
    reason: string;
    maxNotionalUsdc: number;
    recommendedMode: SignalMode;
    signal: ClawdOiCoreSignal;
};
