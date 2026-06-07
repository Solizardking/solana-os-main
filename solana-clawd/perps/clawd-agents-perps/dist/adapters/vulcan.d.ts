import type { PreflightReport } from "../config.js";
export interface VulcanBridgeCommand {
    command: string;
    args: string[];
    cwd: string;
    env: Record<string, string>;
}
export interface VulcanExecutionIntent {
    action: "market-list" | "ticker" | "positions" | "paper-buy" | "paper-sell" | "live-buy" | "live-sell";
    symbol?: string;
    notionalUsd?: number;
}
export interface VulcanExecutionPlan {
    transport: "cli";
    mode: "observe" | "paper" | "live";
    preflight: PreflightReport;
    command: VulcanBridgeCommand;
}
export declare function mapToVulcanCommand(repoRoot: string, input: VulcanExecutionIntent): VulcanBridgeCommand;
export declare function buildVulcanExecutionPlan(repoRoot: string, input: VulcanExecutionIntent, preflight: PreflightReport): VulcanExecutionPlan;
