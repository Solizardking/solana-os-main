# Open Source Release Checklist

## Pre-Release Verification

### ✅ Documentation (Complete)
- [x] SOUL.md — solana-clawd identity with Clawd Code lineage
- [x] SKILL.md — solana-clawd MCP server with 31+ tools
- [x] STRATEGY.md — Multi-venue OODA strategy
- [x] TRADE.md — ClawdBot trading agent skill
- [x] README.md — Comprehensive SolanaOS documentation

### 🔧 Repository Cleanup (Required)

#### Remove Build Artifacts
```bash
# Go caches
rm -rf .gocache/

# Build output
rm -rf build/
rm -rf dist/

# Binary artifacts at root
rm -f /Solana-Os-Go
rm -f /solanaos
rm -f /clawdbot-tui
rm -f /gateway-api
rm -f /backend
```

#### Remove Large Data Files (Not Source Code)
```bash
# Trending/pool/token JSON data files (~100MB+)
rm -f trending*.json
rm -f pump*.json
rm -f all_*.json
rm -f classified*.json
rm -f dex*.json
rm -f gt_*.json
rm -f helius_*.json
rm -f scan_*.json
rm -f st_*.json
rm -f tokens_*.json
rm -f top*.json
rm -f bonding*.json
rm -f pf_*.json
rm -f latest.json
rm -f merged_tokens.json
rm -f processed_*.json
rm -f parsed_*.json
rm -f enriched_tokens.json
rm -f unique_*.json
rm -f parsed_pools.json
rm -f stats.json
rm -f summary.json
rm -f tokens_actions.json
```

#### Remove Local Dev Artifacts
```bash
# Agent/editor state
rm -rf .agents/
rm -rf .augment/
rm -rf .claude/
rm -rf .codebuddy/
rm -rf .commandcode/
rm -rf models/
rm -rf .cache/
rm -f skills-lock.json

# Environment files with secrets
rm -f .env
rm -f .env.local
rm -f .env.example  # Replace with clean template

# IDE state
rm -rf .vscode/
rm -f *.code-workspace

# OS artifacts
rm -f .DS_Store
rm -f Thumbs.db
```

#### Handle Nested Git Repos
```bash
# Check for nested .git directories
find . -name ".git" -type d

# For nanohub (has its own .git) - either:
# Option A: Remove entirely (separate project)
rm -rf nanohub/

# Option B: Convert to submodule reference
# (Requires manual setup)
```

#### Reference Repos (Safe to Keep or Remove)
```bash
# These are reference/study copies - review if needed
# solana-go-main/
# mawdbot-go/
# picoclaw/
# x402-go-main/
# hermes-agent-main/
# agent/
# acp_adapter/
# solanaos-memory/
# Claw3D-main/
# g0dm0d3-main/
# claude-code-main/
# claude-code-local-main/
# solana-tradingview-advanced-chart-example-main/
```

### 📋 .gitignore Verification
- [ ] All JSON data files excluded
- [ ] .gocache/ excluded
- [ ] build/, dist/ excluded
- [ ] .env files excluded (except examples)
- [ ] Binary artifacts excluded
- [ ] Agent/editor state excluded
- [ ] OS artifacts excluded

### 🔐 Secret Scanning
```bash
# Run TruffleHog to verify no secrets
trufflehog filesystem .

# Check for common secret patterns
grep -r "PRIVATE_KEY" --include="*.go" --include="*.ts" .
grep -r "API_KEY" --include="*.go" --include="*.ts" .
grep -r "0x[a-fA-F0-9]{64}" .
```

### 📦 Release Preparation
- [ ] Create GitHub Release with binary artifacts
- [ ] Verify npm packages publish cleanly: `npm run pack:npm`
- [ ] Test install from clean state: `npx solanaos-computer@latest install --with-web`
- [ ] Update public URLs in docs
- [ ] Verify links in README point to correct repos

### 📝 Files to Update Before Release
- [ ] LICENSE — Ensure correct copyright year and holder
- [ ] CONTRIBUTING.md — Contributor guidelines
- [ ] SECURITY.md — Security policy with contact info
- [ ] .env.example — Clean template with placeholder values

---

## Quick Cleanup Command

```bash
# Nuclear option - removes all non-essential files
rm -rf .gocache/ build/ dist/ .cache/ .agents/ .augment/ .claude/ .codebuddy/ .commandcode/ models/
rm -f .env .env.local *.png *.jpeg skills-lock.json
rm -f trending*.json pump*.json all_*.json classified*.json dex*.json gt_*.json helius*.json scan*.json st_*.json tokens*.json top*.json bonding*.json pf*.json latest.json merged*.json processed*.json parsed*.json enriched*.json unique*.json parsed_pools.json stats.json summary.json tokens_actions.json
```

## Verification Commands

```bash
# Check repo size
du -sh .

# Count files (should be <500 for clean repo)
find . -type f | wc -l

# List remaining large files
find . -type f -size +1M -exec ls -lh {} \;

# Verify no .env tracked
git status | grep "\.env"
```

---

*Last updated: 2026-04-20*
*Project: solana-clawd / SolanaOS*
