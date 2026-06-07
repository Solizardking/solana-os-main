import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const DEFAULT_SOL_MINT = "So11111111111111111111111111111111111111112";
const DEFAULT_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
function repoCandidates() {
    const explicit = process.env.CLAWD_TWAMM_ROOT;
    const cwd = process.cwd();
    return [
        ...(explicit ? [explicit] : []),
        resolve(cwd, "Perps", "twamm-master"),
        resolve(cwd, "..", "Perps", "twamm-master"),
        resolve(cwd, "..", "..", "Perps", "twamm-master"),
    ];
}
export function resolveTwammRoot() {
    for (const candidate of repoCandidates()) {
        if (existsSync(resolve(candidate, "Anchor.toml")) && existsSync(resolve(candidate, "app", "src", "crank.ts"))) {
            return candidate;
        }
    }
    return process.env.CLAWD_TWAMM_ROOT || resolve(process.cwd(), "Perps", "twamm-master");
}
function defaultRpcUrl() {
    return process.env.CLAWD_TWAMM_RPC_URL || process.env.SOLANA_RPC_URL || "local";
}
function defaultTokenAMint() {
    return process.env.CLAWD_TWAMM_TOKEN_A_MINT || DEFAULT_SOL_MINT;
}
function defaultTokenBMint() {
    return process.env.CLAWD_TWAMM_TOKEN_B_MINT || DEFAULT_USDC_MINT;
}
function baseWarnings() {
    const warnings = [
        "Reference TWAMM implementation is unaudited for this perps automation layer.",
        "The crank runner signs permissionless crank transactions while running.",
        "Use localnet/devnet first and require explicit operator confirmation for mainnet.",
    ];
    if (!process.env.CLAWD_TWAMM_TOKEN_A_MINT || !process.env.CLAWD_TWAMM_TOKEN_B_MINT) {
        warnings.push("CLAWD_TWAMM_TOKEN_A_MINT/B_MINT not set; defaulting to SOL/USDC mints.");
    }
    return warnings;
}
export function getTwammAutomationStatus() {
    const root = resolveTwammRoot();
    return {
        root,
        exists: existsSync(root),
        anchorToml: existsSync(resolve(root, "Anchor.toml")),
        cargoToml: existsSync(resolve(root, "Cargo.toml")),
        appPackage: existsSync(resolve(root, "app", "package.json")),
        crankScript: existsSync(resolve(root, "app", "src", "crank.ts")),
        programIdl: existsSync(resolve(root, "target", "idl", "twamm.json")),
        defaultRpcUrl: defaultRpcUrl(),
        tokenAMint: defaultTokenAMint(),
        tokenBMint: defaultTokenBMint(),
        liveEnabled: process.env.CLAWD_TWAMM_LIVE === "true",
        operatorConfirmed: process.env.OPERATOR_CONFIRMED === "true",
        warnings: baseWarnings(),
    };
}
export function buildTwammBuildPlan(options = {}) {
    const status = getTwammAutomationStatus();
    const warnings = [...status.warnings];
    if (!options.skipAppInstall && !existsSync(resolve(status.root, "node_modules"))) {
        warnings.push("Run npm install in the TWAMM root before anchor build, or use the build command to do it automatically.");
    }
    return {
        mode: "build",
        command: "anchor",
        cwd: status.root,
        args: ["build"],
        env: { RUST_BACKTRACE: process.env.RUST_BACKTRACE || "1" },
        warnings,
    };
}
export function buildTwammTestPlan(options = {}) {
    const status = getTwammAutomationStatus();
    const runAnchor = options.anchor ?? true;
    const runCargo = options.cargo ?? false;
    const args = runAnchor ? ["test", "--", "--features", "test"] : ["test", "--", "--nocapture"];
    return {
        mode: "test",
        command: runAnchor && !runCargo ? "anchor" : "cargo",
        cwd: status.root,
        args,
        env: { RUST_BACKTRACE: process.env.RUST_BACKTRACE || "1" },
        warnings: status.warnings,
    };
}
export function buildTwammCrankPlan(options = {}) {
    const status = getTwammAutomationStatus();
    const warnings = [...status.warnings];
    if (!status.liveEnabled || !status.operatorConfirmed || !options.yes) {
        warnings.push("Crank command is blocked until CLAWD_TWAMM_LIVE=true, OPERATOR_CONFIRMED=true, and --yes are all present.");
    }
    return {
        mode: "crank",
        command: "npx",
        cwd: status.root,
        args: [
            "ts-node",
            "-P",
            "tsconfig.json",
            "app/src/crank.ts",
            options.rpcUrl || status.defaultRpcUrl,
            options.tokenAMint || status.tokenAMint,
            options.tokenBMint || status.tokenBMint,
        ],
        env: {
            RUST_BACKTRACE: process.env.RUST_BACKTRACE || "1",
            ...(options.walletPath ? { ANCHOR_WALLET: options.walletPath } : {}),
            ...(options.once ? { CLAWD_TWAMM_CRANK_ONCE: "true" } : {}),
        },
        warnings,
    };
}
export function buildTwammAutomation(options = {}) {
    const status = getTwammAutomationStatus();
    if (!status.exists || !status.anchorToml) {
        return { ok: false, status, error: "TWAMM workspace not found. Set CLAWD_TWAMM_ROOT." };
    }
    mkdirSync(resolve(status.root, "target"), { recursive: true });
    if (!options.skipAppInstall && !existsSync(resolve(status.root, "node_modules"))) {
        const install = spawnSync("npm", ["install"], {
            cwd: status.root,
            env: process.env,
            stdio: "pipe",
            encoding: "utf8",
        });
        if (install.status !== 0) {
            return {
                ok: false,
                status: getTwammAutomationStatus(),
                step: "npm install",
                stdout: install.stdout,
                stderr: install.stderr,
                error: install.error?.message,
            };
        }
    }
    const result = spawnSync("anchor", ["build"], {
        cwd: status.root,
        env: process.env,
        stdio: "pipe",
        encoding: "utf8",
    });
    return {
        ok: result.status === 0,
        status: getTwammAutomationStatus(),
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error?.message,
    };
}
export function runTwammCrank(options = {}) {
    const status = getTwammAutomationStatus();
    if (!status.exists || !status.crankScript) {
        console.error("error: TWAMM workspace not found. Set CLAWD_TWAMM_ROOT.");
        process.exit(2);
    }
    if (!status.liveEnabled || !status.operatorConfirmed || !options.yes) {
        console.error("error: TWAMM crank is gated. Set CLAWD_TWAMM_LIVE=true, OPERATOR_CONFIRMED=true, and pass --yes.");
        process.exit(3);
    }
    const plan = buildTwammCrankPlan(options);
    const result = spawnSync(plan.command, plan.args, {
        cwd: plan.cwd,
        env: { ...process.env, ...plan.env },
        stdio: "inherit",
    });
    if (result.error) {
        console.error(`error: failed to run TWAMM crank: ${result.error.message}`);
        process.exit(127);
    }
    process.exit(typeof result.status === "number" ? result.status : 1);
}
//# sourceMappingURL=twammAutomation.js.map