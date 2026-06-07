export interface TwammAutomationStatus {
    root: string;
    exists: boolean;
    anchorToml: boolean;
    cargoToml: boolean;
    appPackage: boolean;
    crankScript: boolean;
    programIdl: boolean;
    defaultRpcUrl: string;
    tokenAMint: string;
    tokenBMint: string;
    liveEnabled: boolean;
    operatorConfirmed: boolean;
    warnings: string[];
}
export interface TwammAutomationPlan {
    mode: "build" | "test" | "crank";
    command: string;
    cwd: string;
    args: string[];
    env: Record<string, string>;
    warnings: string[];
}
type BuildOptions = {
    skipAppInstall?: boolean;
};
type TestOptions = {
    anchor?: boolean;
    cargo?: boolean;
};
type CrankOptions = {
    rpcUrl?: string;
    tokenAMint?: string;
    tokenBMint?: string;
    walletPath?: string;
    once?: boolean;
    yes?: boolean;
};
export declare function resolveTwammRoot(): string;
export declare function getTwammAutomationStatus(): TwammAutomationStatus;
export declare function buildTwammBuildPlan(options?: BuildOptions): TwammAutomationPlan;
export declare function buildTwammTestPlan(options?: TestOptions): TwammAutomationPlan;
export declare function buildTwammCrankPlan(options?: CrankOptions): TwammAutomationPlan;
export declare function buildTwammAutomation(options?: BuildOptions): {
    ok: boolean;
    status: TwammAutomationStatus;
    error: string;
    step?: undefined;
    stdout?: undefined;
    stderr?: undefined;
} | {
    ok: boolean;
    status: TwammAutomationStatus;
    step: string;
    stdout: string;
    stderr: string;
    error: string | undefined;
} | {
    ok: boolean;
    status: TwammAutomationStatus;
    stdout: string;
    stderr: string;
    error: string | undefined;
    step?: undefined;
};
export declare function runTwammCrank(options?: CrankOptions): never;
export {};
