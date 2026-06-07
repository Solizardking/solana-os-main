#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  Clawd OS — One-Shot Installer                                          ║
# ║  github.com/Solizardking/solana-clawd  ·  x402.wtf                      ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   bash install.sh                  # default: Go binary + Python agent
#   bash install.sh --full           # everything (Go + Python + Node.js + Desktop)
#   bash install.sh --desktop        # macOS: build + install Clawd OS.app
#   bash install.sh --gateway        # Node.js gateway (Telegram + HTTP)
#   bash install.sh --agent-only     # Python agent gateway only
#
# Environment:
#   XAI_API_KEY              xAI / Grok API key (chat + voice)
#   HELIUS_API_KEY           Helius RPC key (Solana on-chain data)
#   OPENROUTER_API_KEY       OpenRouter API key (model fallback)
#   SOLANAOS_REPO_URL        Override repo URL
#   CLAWD_HOME               Override ~/.clawd path
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Banner colours ─────────────────────────────────────────────────────────
BOLD="\033[1m"
GREEN="\033[38;2;20;241;149m"
PURPLE="\033[38;2;153;69;255m"
AMBER="\033[38;2;255;170;0m"
CYAN="\033[38;2;0;212;255m"
DIM="\033[38;2;85;102;128m"
RED="\033[31m"
RESET="\033[0m"

info()  { printf "${GREEN}▸${RESET} %s\n" "$*"; }
warn()  { printf "${AMBER}▸${RESET} %s\n" "$*"; }
dim()   { printf "${DIM}  %s${RESET}\n" "$*"; }
fail()  { printf "${RED}✖ %s${RESET}\n" "$*" >&2; exit 1; }
step()  { printf "\n${BOLD}${PURPLE}▶  %s${RESET}\n" "$*"; }
check_cmd() { command -v "$1" >/dev/null 2>&1 || fail "$1 is required but not found. Install it first."; }

# ── Paths ─────────────────────────────────────────────────────────────────
export PATH="/opt/homebrew/bin:/usr/local/bin:/opt/homebrew/sbin:$PATH"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"
LOCAL_SOURCE=false

REPO_URL="${SOLANAOS_REPO_URL:-https://github.com/Solizardking/solana-os-go.git}"
CLAMD_HOME="${CLAWD_HOME:-$HOME/.clawd}"
NANOSOLANA_HOME="$HOME/.nanosolana"
CLAMD_DESKTOP_DIR=""

# Find the clawd-desktop-main directory
if [ -d "$SCRIPT_DIR/solana-clawd/apps/clawd-desktop-main" ]; then
  CLAMD_DESKTOP_DIR="$SCRIPT_DIR/solana-clawd/apps/clawd-desktop-main"
elif [ -d "$HOME/solana-os-go/solana-clawd/apps/clawd-desktop-main" ]; then
  CLAMD_DESKTOP_DIR="$HOME/solana-os-go/solana-clawd/apps/clawd-desktop-main"
fi

# ── Flags ─────────────────────────────────────────────────────────────────
WITH_DESKTOP=false
WITH_GATEWAY=false
WITH_AGENT=true        # always install Python agent
WITH_FULL=false
WITH_WEB=false

for arg in "$@"; do
  case "$arg" in
    --full)     WITH_DESKTOP=true; WITH_GATEWAY=true; WITH_AGENT=true; WITH_FULL=true ;;
    --desktop)  WITH_DESKTOP=true ;;
    --gateway)  WITH_GATEWAY=true ;;
    --agent-only) WITH_AGENT=true; WITH_DESKTOP=false; WITH_GATEWAY=false ;;
    --with-web) WITH_WEB=true ;;
    --help|-h)
      printf "${BOLD}Clawd OS — One-Shot Installer${RESET}\n\n"
      printf "  ${GREEN}bash install.sh${RESET}              Default: Go binary + Python agent\n"
      printf "  ${GREEN}bash install.sh --full${RESET}         Everything (Go + Python + Node.js + Desktop)\n"
      printf "  ${GREEN}bash install.sh --desktop${RESET}      Build + install Clawd OS.app (macOS)\n"
      printf "  ${GREEN}bash install.sh --gateway${RESET}      Node.js gateway (Telegram + HTTP API)\n"
      printf "  ${GREEN}bash install.sh --agent-only${RESET}   Python agent gateway only\n"
      printf "  ${GREEN}bash install.sh --with-web${RESET}     Also build the web console\n\n"
      printf "  ${DIM}Env vars:${RESET} XAI_API_KEY HELIUS_API_KEY OPENROUTER_API_KEY\n"
      printf "  ${DIM}Repo:${RESET}    github.com/Solizardking/solana-os-go\n"
      printf "  ${DIM}Docs:${RESET}     x402.wtf/docs\n"
      exit 0 ;;
  esac
done

if [ -f "$SCRIPT_DIR/go.mod" ] && [ -f "$SCRIPT_DIR/main.go" ]; then
  LOCAL_SOURCE=true
fi

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██╔════╝${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║██║   ██║███████╗${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║██║   ██║╚════██║${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████║${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${GREEN}╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝${RESET}  ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}                                                                   ${PURPLE}║${RESET}"
echo -e "${PURPLE}║${RESET}  ${CYAN}⚡ One-Shot Installer  ·  Clawd OS  ·  x402.wtf${RESET}                    ${PURPLE}║${RESET}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 1 — Check prerequisites
# ═══════════════════════════════════════════════════════════════════════════
step "Checking prerequisites..."

MISSING=""
for cmd in git curl; do
  command -v "$cmd" >/dev/null 2>&1 || MISSING="$MISSING $cmd"
done
[ -n "$MISSING" ] && fail "Missing:$MISSING"

# Go
GO_BIN=""
if [ -x "/opt/homebrew/bin/go" ]; then GO_BIN="/opt/homebrew/bin/go"
elif [ -x "/usr/local/go/bin/go" ]; then GO_BIN="/usr/local/go/bin/go"
else GO_BIN="$(command -v go 2>/dev/null || true)"; fi

if [ -z "$GO_BIN" ] || [ ! -x "$GO_BIN" ]; then
  warn "go not found — skipping Go binary build"
  SKIP_GO=true
else
  SKIP_GO=false
  info "Go: $("$GO_BIN" version | awk '{print $3}')"
fi

# Node.js
if command -v node >/dev/null 2>&1; then
  info "Node: $(node --version)"
else
  warn "node not found — skipping desktop/JS builds"
  WITH_DESKTOP=false; WITH_GATEWAY=false
fi

# Python
if command -v python3 >/dev/null 2>&1; then
  info "Python: $(python3 --version)"
else
  warn "python3 not found — skipping agent gateway"
  WITH_AGENT=false
fi

# macOS-specific
if [[ "$(uname -s)" != "Darwin" ]]; then
  WITH_DESKTOP=false  # desktop build requires macOS for now
fi

dim "Target repo: $REPO_URL"
dim "CLAMD_HOME: $CLAMD_HOME"

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 2 — Clone or update repo
# ═══════════════════════════════════════════════════════════════════════════
step "Setting up source..."

if $LOCAL_SOURCE; then
  info "Using local source tree at $SCRIPT_DIR"
  cd "$SCRIPT_DIR"
elif [ -d "$SCRIPT_DIR/.git" ]; then
  info "Updating existing installation at $SCRIPT_DIR"
  cd "$SCRIPT_DIR"
  git pull --ff-only 2>/dev/null || warn "Git pull failed — using existing code"
else
  info "Cloning solana-os-go to $SCRIPT_DIR"
  git clone --depth 1 "$REPO_URL" "$SCRIPT_DIR" 2>/dev/null || warn "Clone failed — continuing with existing files"
  cd "$SCRIPT_DIR"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 3 — Build Go binary (SolanaOS)
# ═══════════════════════════════════════════════════════════════════════════
if ! $SKIP_GO; then
  step "Building SolanaOS Go binary..."

  export GOCACHE="${GOCACHE:-/tmp/go-build}"
  export GOTMPDIR="${GOTMPDIR:-/tmp}"
  mkdir -p build "$GOCACHE" "$GOTMPDIR"

  "$GO_BIN" build -ldflags="-s -w" -o build/solanaos . 2>&1 || warn "Go build failed — check go.sum"
  if [ -x build/solanaos ]; then
    SIZE=$(du -h build/solanaos | awk '{print $1}')
    info "Built: build/solanaos ($SIZE)"

    # Install CLI
    mkdir -p "$NANOSOLANA_HOME/bin"
    install -m 755 build/solanaos "$NANOSOLANA_HOME/bin/solanaos"
    ln -sf "$NANOSOLANA_HOME/bin/solanaos" "$NANOSOLANA_HOME/bin/nanosolana" 2>/dev/null || true
    info "CLI installed: $NANOSOLANA_HOME/bin/solanaos"

    # Generate setup code
    mkdir -p "$NANOSOLANA_HOME/connect"
    "$NANOSOLANA_HOME/bin/solanaos" gateway setup-code --host 127.0.0.1 --port 8642 >/dev/null 2>&1 || true

    # Build web backend if requested
    if $WITH_WEB && [ -d web/backend ]; then
      info "Building web backend..."
      "$GO_BIN" build -ldflags="-s -w" -o build/solanaos-web ./web/backend 2>&1 || warn "Web build failed"
      if [ -x build/solanaos-web ]; then
        install -m 755 build/solanaos-web "$NANOSOLANA_HOME/bin/solanaos-web"
        info "Web CLI: $NANOSOLANA_HOME/bin/solanaos-web"
      fi
    fi
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 4 — Python agent gateway
# ═══════════════════════════════════════════════════════════════════════════
if $WITH_AGENT; then
  step "Setting up Python agent gateway..."

  mkdir -p "$CLAMD_HOME/clawd-agent/.venv/bin"
  mkdir -p "$CLAMD_HOME/profiles/default"
  mkdir -p "$CLAMD_HOME/memories"
  mkdir -p "$CLAMD_HOME/cron"

  # Copy gateway script if it exists in the repo
  if [ -f "$SCRIPT_DIR/.clawd/clawd-agent/gateway.py" ]; then
    cp "$SCRIPT_DIR/.clawd/clawd-agent/gateway.py" "$CLAMD_HOME/clawd-agent/gateway.py"
  elif [ -f "$HOME/.clawd/clawd-agent/gateway.py" ]; then
    cp "$HOME/.clawd/clawd-agent/gateway.py" "$CLAMD_HOME/clawd-agent/gateway.py"
  else
    # Write gateway.py inline
    cat > "$CLAMD_HOME/clawd-agent/gateway.py" << 'PYEOF'
#!/usr/bin/env python3
"""Clawd Agent Gateway v2.0.0 — Python API server for Clawd OS.app"""
import os, json, time, logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

logging.basicConfig(level=logging.INFO, format="[clawd-gateway] %(message)s")
log = logging.getLogger("clawd-gateway")

GATEWAY_PORT = int(os.environ.get("GATEWAY_PORT", "8642"))
CLAMD_HOME = os.environ.get("CLAWD_HOME", os.path.expanduser("~/.clawd"))
XAI_API_KEY = os.environ.get("XAI_API_KEY", "")
XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("CLAWD_DEFAULT_MODEL", "grok-4.3")

def stream_xai_chat(messages, model=DEFAULT_MODEL):
    body = json.dumps({"model": model, "messages": messages, "stream": True, "temperature": 0.7}).encode()
    req = Request(XAI_CHAT_URL, data=body, headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"})
    try:
        resp = urlopen(req, timeout=120)
        for line in resp:
            line = line.decode().rstrip()
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]": yield "data: [DONE]\n\n"; break
                try:
                    chunk = json.loads(data)
                    delta = chunk.get("choices", [{}])[0].get("delta", {})
                    if delta.get("content"):
                        yield f"data: {json.dumps(chunk)}\n\n"
                except: continue
    except Exception as e:
        log.error(f"xAI error: {e}")
        yield f"data: {json.dumps({'error': {'message': str(e)}})}\n\n"
        yield "data: [DONE]\n\n"

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args): log.info(f"{self.client_address[0]} - {fmt % args}")
    def _json(self, data, code=200):
        body = json.dumps(data).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*"); self.end_headers(); self.wfile.write(body)
    def _sse(self, gen):
        self.send_response(200); self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache"); self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*"); self.end_headers()
        for chunk in gen:
            try: self.wfile.write(chunk.encode()); self.wfile.flush()
            except: break
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Clawd-Session-Id")
        self.end_headers()
    def do_GET(self):
        if self.path in ("/health", "/"):
            self._json({"status":"ok","gateway":"clawd-agent","version":"2.0.0","model":DEFAULT_MODEL,"xai":bool(XAI_API_KEY)})
        else: self._json({"error":"not found"}, 404)
    def do_POST(self):
        cl = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(cl) if cl > 0 else b"{}"
        if self.path == "/v1/chat/completions":
            data = json.loads(raw)
            if not XAI_API_KEY: self._json({"error":{"message":"XAI_API_KEY not configured"}}, 401); return
            if data.get("stream"):
                self._sse(stream_xai_chat(data.get("messages", []), data.get("model", DEFAULT_MODEL)))
            else:
                body = json.dumps({"model": data.get("model", DEFAULT_MODEL), "messages": data.get("messages",[]), "stream": False}).encode()
                req = Request(XAI_CHAT_URL, data=body, headers={"Authorization": f"Bearer {XAI_API_KEY}", "Content-Type": "application/json"})
                try:
                    resp = urlopen(req, timeout=120)
                    self._json(json.loads(resp.read().decode()))
                except HTTPError as e:
                    self._json({"error":{"message":f"xAI error {e.code}"}}, e.code)
        else: self._json({"error":"not found"}, 404)

def main():
    log.warning("XAI_API_KEY not set — chat disabled") if not XAI_API_KEY else None
    server = HTTPServer(("127.0.0.1", GATEWAY_PORT), Handler)
    log.info(f"Clawd Agent Gateway v2.0.0 on http://127.0.0.1:{GATEWAY_PORT}")
    log.info(f"Model: {DEFAULT_MODEL} | xAI: {'enabled' if XAI_API_KEY else 'disabled'}")
    try: server.serve_forever()
    except KeyboardInterrupt: log.info("Shutting down..."); server.shutdown()
if __name__ == "__main__": main()
PYEOF
  fi
  chmod +x "$CLAMD_HOME/clawd-agent/gateway.py"

  # Create config.env / .env if needed
  if [ ! -f "$CLAMD_HOME/.env" ]; then
    cat > "$CLAMD_HOME/.env" << 'ENVEOF'
# Clawd OS Configuration
# Fill in your API keys for full functionality

# xAI / Grok (chat + voice)
XAI_API_KEY=

# OpenRouter (model fallback)
OPENROUTER_API_KEY=

# Solana RPC (on-chain data)
HELIUS_API_KEY=
SOLANA_PRIVATE_KEY=
RPC_URL=

# Gateway
GATEWAY_PORT=8642
CLAWD_DEFAULT_MODEL=grok-4.3
ENVEOF
    info "Created $CLAMD_HOME/.env — add your API keys"
  fi

  # Create SOUL.md
  if [ ! -f "$CLAMD_HOME/SOUL.md" ]; then
    echo "# Clawd OS Soul\n\nYou are Clawd, a sovereign AI agent on Solana. Built by Solizardking.\nx402.wtf  ·  github.com/Solizardking/solana-clawd" > "$CLAMD_HOME/SOUL.md"
  fi

  # Create config.yaml
  if [ ! -f "$CLAMD_HOME/config.yaml" ]; then
    cat > "$CLAMD_HOME/config.yaml" << 'YAMLEOF'
# Clawd OS config
api_server:
  enabled: true
  extra:
    port: 8642
    host: "127.0.0.1"
YAMLEOF
  fi

  info "Python agent gateway installed at $CLAMD_HOME/clawd-agent/gateway.py"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 5 — Node.js Gateway (Telegram + HTTP API)
# ═══════════════════════════════════════════════════════════════════════════
if $WITH_GATEWAY; then
  step "Setting up Node.js gateway..."
  CLAWD_SRC="${CLAWD_SRC:-$HOME/Downloads/solana-clawd}"

  if [ -d "$CLAWD_SRC/gateway" ]; then
    info "Found gateway source at $CLAWD_SRC/gateway"
    cd "$CLAWD_SRC"

    # Install deps if needed
    if [ ! -d "$CLAWD_SRC/gateway/node_modules" ]; then
      info "Installing gateway dependencies..."
      cd "$CLAWD_SRC/gateway" && npm install --legacy-peer-deps 2>&1 | tail -3 || warn "Gateway npm install failed"
    fi

    # Symlink node_modules for monorepo resolution
    [ -d "$CLAWD_SRC/gateway/node_modules" ] && [ ! -d "$CLAWD_SRC/node_modules" ] && \
      ln -sf gateway/node_modules "$CLAWD_SRC/node_modules" 2>/dev/null || true

    # Build if needed
    if [ ! -d "$CLAWD_SRC/dist/gateway/src" ]; then
      info "Building gateway TypeScript..."
      cd "$CLAWD_SRC" && npx tsc 2>&1 | tail -3 || warn "Gateway tsc build failed"
    fi

    info "Node.js gateway ready — start with: cd $CLAWD_SRC && GATEWAY_PORT=8642 node dist/gateway/src/index.js"
  else
    warn "Gateway source not found at $CLAWD_SRC/gateway — skipping"
  fi
  cd "$SCRIPT_DIR"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 6 — Desktop app (macOS only)
# ═══════════════════════════════════════════════════════════════════════════
if $WITH_DESKTOP && [ -n "$CLAMD_DESKTOP_DIR" ]; then
  step "Building Clawd OS desktop app..."
  cd "$CLAMD_DESKTOP_DIR"

  if [ ! -d node_modules ]; then
    info "Installing desktop dependencies..."
    npm install --legacy-peer-deps 2>&1 | tail -5 || warn "Desktop npm install failed"
  fi

  if [ -d node_modules ]; then
    info "Building Electron app..."
    npx electron-vite build 2>&1 | tail -3 || warn "electron-vite build failed"

    if [ -d out ]; then
      # Create entitlements if missing
      mkdir -p build
      if [ ! -f build/entitlements.mac.plist ]; then
        cat > build/entitlements.mac.plist << 'PLEOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
<key>com.apple.security.cs.allow-jit</key><true/>
<key>com.apple.security.network.client</key><true/>
<key>com.apple.security.network.server</key><true/>
<key>com.apple.security.files.user-selected.read-write</key><true/>
<key>com.apple.security.files.downloads.read-write</key><true/>
</dict></plist>
PLEOF
        cp build/entitlements.mac.plist build/entitlements.mac.inherit.plist
      fi

      info "Packaging Clawd OS.app..."
      npx electron-builder --mac --dir 2>&1 | tail -5 || warn "electron-builder failed"

      if [ -d "dist/mac-arm64/Clawd OS.app" ]; then
        # Kill running instance and replace
        pkill -f "Clawd OS.app" 2>/dev/null || true
        rm -rf "/Applications/Clawd OS.app"
        cp -R "dist/mac-arm64/Clawd OS.app" "/Applications/Clawd OS.app"
        info "Clawd OS.app installed to /Applications"
      fi
    fi
  fi
  cd "$SCRIPT_DIR"
elif $WITH_DESKTOP; then
  warn "Desktop source not found — build Clawd OS.app from solana-clawd/apps/clawd-desktop-main first"
fi

# ═══════════════════════════════════════════════════════════════════════════
#  STEP 7 — Print summary
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${PURPLE}║${RESET}  ${CYAN}⚡ Clawd OS installed successfully!${RESET}                                  ${PURPLE}║${RESET}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
echo ""

[ -x "$NANOSOLANA_HOME/bin/solanaos" ] && echo -e "  ${DIM}Go CLI:${RESET}      $NANOSOLANA_HOME/bin/solanaos"
[ -x "$NANOSOLANA_HOME/bin/solanaos-web" ] && echo -e "  ${DIM}Web CLI:${RESET}     $NANOSOLANA_HOME/bin/solanaos-web"
[ -f "$CLAMD_HOME/clawd-agent/gateway.py" ] && echo -e "  ${DIM}Python Agent:${RESET} $CLAMD_HOME/clawd-agent/gateway.py"
[ -d "/Applications/Clawd OS.app" ] && echo -e "  ${DIM}Desktop:${RESET}      /Applications/Clawd OS.app"
echo -e "  ${DIM}Config:${RESET}       $CLAMD_HOME/.env"
echo -e "  ${DIM}Workspace:${RESET}    $NANOSOLANA_HOME"
echo ""

echo -e "  ${PURPLE}Quick Start:${RESET}"
echo -e "    ${GREEN}# Start the Python agent gateway${RESET}"
echo -e "    ${AMBER}XAI_API_KEY=xai-... python3 $CLAMD_HOME/clawd-agent/gateway.py${RESET}"
echo ""
echo -e "    ${GREEN}# Start the Go gateway bridge${RESET}"
echo -e "    ${AMBER}$NANOSOLANA_HOME/bin/solanaos gateway start --port 8642${RESET}"
echo ""
echo -e "    ${GREEN}# Launch the desktop app${RESET}"
echo -e "    ${AMBER}open /Applications/Clawd\ OS.app${RESET}"
echo ""

echo -e "  ${DIM}Add API keys to $CLAMD_HOME/.env for full features:${RESET}"
echo -e "    ${AMBER}XAI_API_KEY${RESET}=xai-...        ${DIM}# Chat + Voice (xAI Grok)${RESET}"
echo -e "    ${AMBER}HELIUS_API_KEY${RESET}=...          ${DIM}# Solana on-chain data${RESET}"
echo -e "    ${AMBER}OPENROUTER_API_KEY${RESET}=sk-or-... ${DIM}# Model fallback${RESET}"
echo ""

echo -e "  ${DIM}PATH:${RESET} add ${GREEN}$NANOSOLANA_HOME/bin${RESET} to your shell PATH"
echo -e "  ${DIM}Repo:${RESET}    ${GREEN}github.com/Solizardking/solana-clawd${RESET}"
echo -e "  ${DIM}Docs:${RESET}     ${GREEN}x402.wtf/docs${RESET}"
echo ""