import { buildPreflightReport, loadPerpsRuntimeConfig, resolveTradingMode, } from "./config.js";
import { createPhoenixRiseAdapter } from "./adapters/phoenixRise.js";
import { buildVulcanExecutionPlan, } from "./adapters/vulcan.js";
import { summarizeVulcanCatalog } from "./vulcanCatalog.js";
import { getTwammAutomationStatus, buildTwammCrankPlan, } from "./twammAutomation.js";
import { getOnchainMarketMakerStatus, buildOnchainMarketMakerPlan, } from "./onchainMarketMaker.js";
export class ClawdPerpsRuntime {
    config;
    repoRoot;
    rise;
    constructor(config = loadPerpsRuntimeConfig(), repoRoot = process.cwd()) {
        this.config = config;
        this.repoRoot = repoRoot;
        this.rise = createPhoenixRiseAdapter(config);
    }
    createStatus(intent) {
        const mode = resolveTradingMode(this.config);
        return {
            armed: mode === "live",
            mode,
            symbol: intent.symbol.toUpperCase(),
            notes: [
                "Rise SDK is the source of truth for market reads and unsigned instruction building.",
                "Vulcan remains available for paper execution and CLI compatibility.",
                "Live routes are blocked unless preflight, operator confirmation, and non-sim mode all pass.",
            ],
        };
    }
    async listMarkets() {
        return this.rise.listMarkets();
    }
    async getTicker(symbol) {
        return this.rise.getTicker(symbol);
    }
    async getPositions(authority) {
        return this.rise.getPositions(authority);
    }
    async getPortfolio(authority) {
        return this.rise.getTraderSnapshot(authority);
    }
    async getRuntimeHealth() {
        const [health, markets, vulcan] = await Promise.all([
            this.rise.health(),
            this.rise.listMarkets(),
            summarizeVulcanCatalog(this.repoRoot),
        ]);
        return {
            health,
            mode: resolveTradingMode(this.config),
            walletConfigured: Boolean(this.config.wallet),
            trackedMarkets: markets.length,
            allowedSymbols: this.config.risk.allowedSymbols,
            vulcan,
        };
    }
    async getVulcanCatalogSummary() {
        return summarizeVulcanCatalog(this.repoRoot);
    }
    async listSkills(category) {
        const summary = await summarizeVulcanCatalog(this.repoRoot);
        return category ? summary.skills.filter((s) => s.category === category) : summary.skills;
    }
    previewObserve(symbol, expectedSpreadBps) {
        const preflight = buildPreflightReport(this.config, {
            symbol,
            notionalUsd: 1,
            expectedSpreadBps,
            execution: "observe",
        });
        return {
            symbol: symbol.toUpperCase(),
            side: "buy",
            notionalUsd: 1,
            execution: "observe",
            preflight,
            route: {
                adapter: "rise",
                action: "market.ticker",
                payload: { symbol: symbol.toUpperCase() },
            },
        };
    }
    previewPaperTrade(symbol, side, notionalUsd, expectedSpreadBps) {
        const preflight = buildPreflightReport(this.config, {
            symbol,
            notionalUsd,
            expectedSpreadBps,
            execution: "paper",
        });
        return {
            symbol: symbol.toUpperCase(),
            side,
            notionalUsd,
            execution: "paper",
            preflight,
            route: {
                adapter: "vulcan",
                action: side === "buy" ? "paper-buy" : "paper-sell",
                payload: buildVulcanExecutionPlan(this.repoRoot, {
                    action: side === "buy" ? "paper-buy" : "paper-sell",
                    symbol,
                    notionalUsd,
                }, preflight),
            },
        };
    }
    previewLiveTrade(symbol, side, notionalUsd, leverage, expectedSpreadBps) {
        const preflight = buildPreflightReport(this.config, {
            symbol,
            notionalUsd,
            leverage,
            expectedSpreadBps,
            execution: "rise-live",
        });
        return {
            symbol: symbol.toUpperCase(),
            side,
            notionalUsd,
            execution: "rise-live",
            preflight,
            route: {
                adapter: "rise",
                action: "order.place",
                payload: {
                    symbol: symbol.toUpperCase(),
                    side,
                    notionalUsd,
                    leverage,
                    expectedSpreadBps,
                    blocked: !preflight.ok,
                },
            },
        };
    }
    buildVulcanPlan(intent, notionalUsd = 1, expectedSpreadBps) {
        const preflight = buildPreflightReport(this.config, {
            symbol: intent.symbol ?? "SOL",
            notionalUsd,
            expectedSpreadBps,
            execution: intent.action.startsWith("live") ? "vulcan-live" : "paper",
        });
        return buildVulcanExecutionPlan(this.repoRoot, intent, preflight);
    }
    // ── TWAMM execution strategy ──────────────────────────────────────────────
    getTwammStatus() {
        return getTwammAutomationStatus();
    }
    buildTwammCrankPlan(opts = {}) {
        return buildTwammCrankPlan(opts);
    }
    /**
     * Preview a TWAMM-scheduled execution for large orders.
     * TWAMM fills at the time-weighted oracle price over a configurable window,
     * eliminating market-impact slippage at the cost of deferred fills.
     * Use when notionalUsd exceeds ~$50k or when low-impact execution is required.
     */
    previewTwammExecution(symbol, side, notionalUsd, tokenAMint, tokenBMint) {
        const preflight = buildPreflightReport(this.config, {
            symbol,
            notionalUsd,
            execution: "observe",
        });
        const twammStatus = getTwammAutomationStatus();
        const twammPlan = buildTwammCrankPlan({ tokenAMint, tokenBMint });
        return {
            symbol: symbol.toUpperCase(),
            side,
            notionalUsd,
            execution: "observe",
            preflight,
            route: {
                adapter: "rise",
                action: "twamm.schedule",
                payload: {
                    symbol: symbol.toUpperCase(),
                    side,
                    notionalUsd,
                    strategy: "twamm",
                    tokenAMint: tokenAMint ?? twammStatus.tokenAMint,
                    tokenBMint: tokenBMint ?? twammStatus.tokenBMint,
                    note: "TWAMM executes as time-weighted on-chain slices. Arm with CLAWD_TWAMM_LIVE=true.",
                    blocked: !preflight.ok || !twammStatus.exists,
                },
            },
            twamm: twammPlan,
        };
    }
    // ── Phoenix on-chain market-maker strategy ────────────────────────────────
    getOnchainMmStatus() {
        return getOnchainMarketMakerStatus();
    }
    buildOnchainMmPlan(opts = {}) {
        return buildOnchainMarketMakerPlan(opts);
    }
    /**
     * Preview a Phoenix on-chain market-maker run plan.
     * The mm binary places resting limit orders on the Phoenix CLOB, earning
     * maker rebates while tightening the book spread.
     */
    previewOnchainMm(market, ticker = "SOL-USD", quoteEdgeBps = 3) {
        const status = getOnchainMarketMakerStatus();
        const plan = buildOnchainMarketMakerPlan({
            market: market ?? status.defaultMarket,
            ticker,
            quoteEdgeBps,
        });
        return { status, plan };
    }
    // ── Vulcan TWAP strategy ──────────────────────────────────────────────────
    /**
     * Build a Vulcan TWAP execution plan for large perps orders.
     * Uses `vulcan strategy twap start` — the runner owns the loop, tick display,
     * ledger, and report. Prefer this over manual slice execution.
     */
    buildVulcanTwapPlan(opts) {
        const mode = opts.mode ?? "paper";
        const slices = opts.slices ?? 5;
        const intervalSeconds = opts.intervalSeconds ?? 60;
        const args = [
            "strategy", "twap", "start",
            "--symbol", opts.symbol.toUpperCase(),
            "--side", opts.side,
            "--notional-usdc", String(opts.notionalUsd),
            "--slices", String(slices),
            "--interval-seconds", String(intervalSeconds),
            "--mode", mode,
            "-o", "json",
        ];
        if (opts.maxPriceDriftBps != null) {
            args.push("--max-price-drift-bps", String(opts.maxPriceDriftBps));
        }
        return {
            command: "vulcan",
            args,
            note: `Vulcan TWAP: ${opts.symbol} ${opts.side} $${opts.notionalUsd} over ${slices} slices × ${intervalSeconds}s in ${mode} mode.`,
        };
    }
}
export function createMarketMakerStatus(config, intent) {
    return new ClawdPerpsRuntime(config).createStatus(intent);
}
//# sourceMappingURL=marketMaker.js.map