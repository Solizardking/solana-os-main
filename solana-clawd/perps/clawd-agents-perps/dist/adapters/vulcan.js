export function mapToVulcanCommand(repoRoot, input) {
    const symbol = input.symbol?.trim().toUpperCase() ?? "SOL";
    const notional = String(input.notionalUsd ?? 100);
    const base = {
        command: "cargo",
        cwd: `${repoRoot}/vulcan-cli-master`,
        env: {
            NO_COLOR: "1",
        },
    };
    switch (input.action) {
        case "market-list":
            return { ...base, args: ["run", "-p", "vulcan", "--", "market", "list", "-o", "json"] };
        case "ticker":
            return { ...base, args: ["run", "-p", "vulcan", "--", "market", "ticker", symbol, "-o", "json"] };
        case "positions":
            return { ...base, args: ["run", "-p", "vulcan", "--", "position", "list", "-o", "json"] };
        case "paper-buy":
            return {
                ...base,
                args: [
                    "run",
                    "-p",
                    "vulcan",
                    "--",
                    "paper",
                    "buy",
                    symbol,
                    "--notional-usdc",
                    notional,
                    "--type",
                    "market",
                    "-o",
                    "json",
                ],
            };
        case "paper-sell":
            return {
                ...base,
                args: [
                    "run",
                    "-p",
                    "vulcan",
                    "--",
                    "paper",
                    "sell",
                    symbol,
                    "--notional-usdc",
                    notional,
                    "--type",
                    "market",
                    "-o",
                    "json",
                ],
            };
        case "live-buy":
            return {
                ...base,
                args: [
                    "run",
                    "-p",
                    "vulcan",
                    "--",
                    "trade",
                    "buy",
                    symbol,
                    "--notional-usdc",
                    notional,
                    "--type",
                    "market",
                    "-o",
                    "json",
                ],
            };
        case "live-sell":
            return {
                ...base,
                args: [
                    "run",
                    "-p",
                    "vulcan",
                    "--",
                    "trade",
                    "sell",
                    symbol,
                    "--notional-usdc",
                    notional,
                    "--type",
                    "market",
                    "-o",
                    "json",
                ],
            };
    }
}
export function buildVulcanExecutionPlan(repoRoot, input, preflight) {
    const mode = input.action.startsWith("live")
        ? "live"
        : input.action.startsWith("paper")
            ? "paper"
            : "observe";
    return {
        transport: "cli",
        mode,
        preflight,
        command: mapToVulcanCommand(repoRoot, input),
    };
}
//# sourceMappingURL=vulcan.js.map