import { ClawdPerpsRuntime } from "./marketMaker.js";
export interface PerpsFrontendCard {
    title: string;
    value: string;
    hint?: string;
    tone?: "live" | "safe" | "watch" | "infra";
}
export interface PerpsFrontendStatus {
    mode: string;
    modeLabel: string;
    headline: string;
    subheadline: string;
    walletConfigured: boolean;
    allowedSymbols: string[];
    trackedMarkets: unknown[];
    vulcan: unknown;
    cards: PerpsFrontendCard[];
}
export declare function buildPerpsFrontendCards(runtime: ClawdPerpsRuntime): PerpsFrontendCard[];
export declare function buildPerpsFrontendStatus(runtime: ClawdPerpsRuntime): Promise<PerpsFrontendStatus>;
