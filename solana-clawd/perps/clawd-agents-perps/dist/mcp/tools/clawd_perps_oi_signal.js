import { buildClawdOiCoreSignal, buildOiRiskGate } from "../../signals/oi-core.js";
export async function clawd_perps_oi_signal(input) {
    return buildClawdOiCoreSignal({
        symbol: input.symbol ?? "SOL-PERP",
        mode: input.mode ?? "paper",
        mock: input.mock,
    });
}
export async function clawd_perps_oi_risk_gate(input) {
    const signal = await clawd_perps_oi_signal({
        symbol: input.symbol,
        mode: input.mode ?? "paper",
        mock: input.mock,
    });
    return buildOiRiskGate({
        signal,
        notionalUsdc: input.notionalUsdc ?? 500,
        side: input.side ?? "long",
    });
}
//# sourceMappingURL=clawd_perps_oi_signal.js.map