import { type SignalMode } from "../../signals/oi-core.js";
export declare function clawd_perps_oi_signal(input: {
    symbol?: string;
    mode?: SignalMode;
    lookback?: string;
    mock?: boolean;
}): Promise<import("../../signals/oi-core.js").ClawdOiCoreSignal>;
export declare function clawd_perps_oi_risk_gate(input: {
    symbol?: string;
    notionalUsdc?: number;
    side?: "long" | "short";
    mode?: SignalMode;
    mock?: boolean;
}): Promise<{
    ok: boolean;
    reason: string;
    maxNotionalUsdc: number;
    recommendedMode: SignalMode;
    signal: import("../../signals/oi-core.js").ClawdOiCoreSignal;
}>;
