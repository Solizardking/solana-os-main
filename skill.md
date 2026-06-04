---
name: solana-clawd
description: >
  solana-clawd — an open-source Solana AI agent framework built from Clawd Code's
  leaked agentic engine and the SolanaOS operator runtime. TypeScript MCP server
  for Clawd Desktop, Cursor, VS Code, or headless node. 31+ tools for Solana trading,
  on-chain intelligence, wallet management, Pump.fun scanning, ClawdBot trading agents,
  Honcho v3 memory, Privy agentic wallets, and multi-venue perp execution
  (Hyperliquid + Aster). Use when asked about Solana trading, memecoin analysis,
  Pump.fun launches, ClawdBot operations, OODA loops, wallet management, token research,
  agentic wallets, or any SolanaOS/solana-clawd surface.
license: MIT
metadata:
  solana-clawd:
    version: 1.0.0
    author: 8BIT Labs / x402agent
    category: solana-crypto
    venues: [solana-spot, hyperliquid, aster]
    requires_bins: [node, npm]
    requires_env: [HELIUS_API_KEY]
---

# solana-clawd — Complete Agent Skill

> Give this file to any AI agent (Claude, Codex, GPT-4, DeepSolana, Hermes, etc.)
> to fully install, configure, and operate solana-clawd in one shot.

```text
   _____       __                        ________                    __
  / ___/____  / /___ _____  ____ _     / ____/ /___ __      ______/ /
  \__ \/ __ \/ / __ `/ __ \/ __ `/    / /   / / __ `/ | /| / / __  /
 ___/ / /_/ / / /_/ / / / / /_/ /    / /___/ / /_/ /| |/ |/ / /_/ /
/____/\____/_/\__,_/_/ /_/\__,_/     \____/_/\__,_/ |__/|__/\__,_/

                   ╔══════════════════════════╗
                   ║   POWERED BY xAI GROK  ║
                   ╚══════════════════════════╝
```

## What You Are Installing

**solana-clawd** — Grok-powered Solana AI agent framework by 8BIT Labs.

TypeScript modules that compile to a deployable MCP server with:
- **31+ MCP tools** — Helius RPC, DAS, WebSocket, Solana market data, Jupiter swaps
- **ClawdBot trading agent** — OODA loop for Solana spot, Pump.fun, memecoins
- **Honcho v3 memory** — persistent cross-session reasoning (KNOWN/LEARNED/INFERRED)
- **Privy agentic wallets** — policy-based guardrails, autonomous transactions
- **Multi-venue perps** — Hyperliquid + Aster perpetuals
- **x402 payments** — USDC-on-Solana facilitator for agent-to-agent commerce

### Links

| | |
| --- | --- |
| Repo | [github.com/x402agent/solana-clawd](https://github.com/x402agent/solana-clawd) |
| SolanaOS | [github.com/x402agent/SolanaOS](https://github.com/x402agent/SolanaOS) |
| Hub | [seeker.solanaos.net](https://seeker.solanaos.net) |
| Docs | [go.solanaos.net](https://go.solanaos.net) |
| Live | [solanaclawd.com](https://solanaclawd.com) |

---

## Install

```bash
git clone https://github.com/x402agent/solana-clawd
cd solana-clawd
npm install
npm run build
```

### Quick Start

```bash
npm run demo       # animated feature walkthrough
npm run birth      # hatch a blockchain buddy
npm run spinners   # preview all unicode spinners
```

### Minimum `.env`

```bash
HELIUS_API_KEY=your-helius-key
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your-key

# Optional
SOLANA_PRIVATE_KEY=your-base58-key     # For trading / wallet operations
XAI_API_KEY=your-xai-key              # For Grok vision, image, voice
PRIVY_APP_ID=your-privy-app-id       # For agentic wallet features
HONCHO_API_KEY=your-honcho-key       # For persistent memory
```

### Verify

```bash
npx solana-clawd --version
npx solana-clawd status
```

---

## ClawdBot Trading Agent

**ClawdBot** is the primary trading agent inside solana-clawd. It runs an OODA loop
for Solana spot trading with Pump.fun integration.

### Commands

```
/clawd status              # OODA loop state, watchlist, positions
/clawd sim                 # Switch to simulated trading mode
/clawd live                # Switch to live trading mode
/clawd scan                # Run Pump.fun scanner
/clawd buy <token> <sol>   # Buy via Jupiter
/clawd sell <token> <pct>  # Sell (supports "50%", "all")
/clawd watch <mint>        # Add to watchlist
/clawd unwatch <mint>      # Remove from watchlist
/clawd positions           # Open positions across venues
/clawd strategy             # Current strategy parameters
```

### OODA Loop

```
OBSERVE  → prices, volume, funding, OI, holders, dev-wallet
ORIENT   → RSI/EMA/ATR scoring, confidence model
DECIDE   → confidence ≥ 0.60 → size band
ACT      → Jupiter swap / Hyperliquid order / Aster order
LEARN    → persist to Honcho, feed auto-optimizer
```

### Drawdown Cascade

| Drawdown | Action |
|----------|--------|
| 5% | Reduce weakest, block Pump.fun |
| 8% | Close perps, spot-only |
| 12% | Full halt |

---

## Memory Tiers (SolanaOS Epistemology)

Three tiers: **KNOWN** (API data, expires), **LEARNED** (trade patterns, persistent), **INFERRED** (correlations, held loosely).

```
/memory                   Status + peer card
/recall <query>           AI-powered recall via dialectic
/remember <fact>          Save durable conclusion
/ask_memory <question>   Ask about yourself
/forget <query>           Delete matching memories
/dream                    Trigger memory consolidation
```

---

## Perps Trading

### Hyperliquid

```
/hl                       Account overview
/hl_positions             Open positions + PnL
/hl_open BTC long 0.01 5x    Open position
/hl_close BTC             Close position
```

### Aster (Solana-native)

```
/aster                    Account summary
/aster_positions          Open positions
/aster_open SOL long      Open position
/aster_close SOL           Close position
```

---

## MCP Tools

31 tools across 6 categories:

| Category | Tools |
|----------|-------|
| Helius RPC | account_info, balance, transactions, priority_fee |
| Solana Market | price, trending, token_info, wallet_pnl |
| Trading | pump_token_scan, pump_buy_quote, pump_sell_quote |
| Memory | memory_recall, memory_write |
| Wallet | balance, address, transfer |
| Agent | agent_spawn, agent_list, agent_stop |

---

## Key Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Agent identity and epistemology |
| `STRATEGY.md` | Multi-venue strategy (SolanaOS v2.0) |
| `TRADE.md` | Pump.fun trading agent skill |
| `mcp-server/` | MCP server implementation |
| `src/` | Core engine (58 subsystems, 400+ source files) |
| `animations/` | Unicode spinners, buddy birth ceremony |
| `buddy/` | Blockchain Buddy companion system |
| `metaplex/` | Agent minting via mpl-agent-registry |

---

## One-Shot Agent Prompt

```
Read SKILL.md in the solana-clawd project root.
Follow every step. My .env values are:
  HELIUS_API_KEY=...
  SOLANA_PRIVATE_KEY=...
  XAI_API_KEY=...
Complete the full installation.
After install: npx solana-clawd status && npx solana-clawd demo
```

---

*solana-clawd v1.0.0 · MIT · github.com/x402agent/solana-clawd*
*Powered by xAI Grok · Built on Solana · SolanaOS compatible*