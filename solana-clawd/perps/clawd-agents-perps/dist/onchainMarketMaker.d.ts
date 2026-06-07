export interface OnchainMarketMakerStatus {
    root: string;
    exists: boolean;
    cargoToml: boolean;
    mmManifest: boolean;
    binary: string;
    binaryBuilt: boolean;
    anchorToml: boolean;
    defaultMarket: string;
    defaultTicker: string;
    defaultRpcUrl: string;
    liveEnabled: boolean;
    operatorConfirmed: boolean;
    warnings: string[];
}
export interface OnchainMarketMakerPlan {
    mode: "observe" | "build" | "run";
    command: string;
    cwd: string;
    args: string[];
    env: Record<string, string>;
    warnings: string[];
}
type BuildOptions = {
    release?: boolean;
};
type RunOptions = {
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
};
export declare function resolveOnchainMarketMakerRoot(): string;
export declare function getOnchainMarketMakerStatus(): OnchainMarketMakerStatus;
export declare function buildOnchainMarketMakerPlan(options?: RunOptions): OnchainMarketMakerPlan;
export declare function buildOnchainMarketMaker(options?: BuildOptions): {
    ok: boolean;
    status: OnchainMarketMakerStatus;
    error: string;
    stdout?: undefined;
    stderr?: undefined;
} | {
    ok: boolean;
    status: OnchainMarketMakerStatus;
    stdout: string;
    stderr: string;
    error: string | undefined;
};
export declare function runOnchainMarketMaker(options?: RunOptions): never;
export {};
