#!/bin/bash
# SolanaOS Local — Run Claude Code with local MLX model on Apple Silicon
# Adapted from claude-code-local by SolanaOS

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
MLX_VENV="${HOME}/.local/mlx-server"
MLX_SERVER="${SCRIPT_DIR}/mlx-server.py"
MLX_PORT="${MLX_PORT:-4000}"
MLX_MODEL="${MLX_MODEL:-mlx-community/Qwen3.5-122B-A10B-4bit}"

echo "╔══════════════════════════════════════════════════╗"
echo "║  SolanaOS Local — MLX on Apple Silicon           ║"
echo "║  Model: ${MLX_MODEL}                             "
echo "║  Port:  ${MLX_PORT}                              "
echo "╚══════════════════════════════════════════════════╝"
echo ""

# 1. Check Python + venv
if [ ! -d "$MLX_VENV" ]; then
    echo "Setting up MLX virtual environment..."
    python3.12 -m venv "$MLX_VENV" 2>/dev/null || python3 -m venv "$MLX_VENV"
    "$MLX_VENV/bin/pip" install --upgrade pip
    "$MLX_VENV/bin/pip" install mlx-lm
    echo "MLX environment ready."
fi

# 2. Start MLX server in background
echo "Starting MLX server on port $MLX_PORT..."
MLX_MODEL="$MLX_MODEL" MLX_PORT="$MLX_PORT" "$MLX_VENV/bin/python3" "$MLX_SERVER" &
MLX_PID=$!

# Wait for server
echo "Waiting for model to load..."
for i in $(seq 1 120); do
    if curl -s "http://localhost:$MLX_PORT/health" >/dev/null 2>&1; then
        echo "MLX server ready!"
        break
    fi
    sleep 1
done

# 3. Launch Claude Code pointed at local server
echo ""
echo "Launching Claude Code with local model..."
echo "  ANTHROPIC_BASE_URL=http://localhost:$MLX_PORT"
echo ""

ANTHROPIC_BASE_URL="http://localhost:$MLX_PORT" \
ANTHROPIC_API_KEY=sk-local \
claude --model claude-sonnet-4-6

# Cleanup
echo "Stopping MLX server..."
kill $MLX_PID 2>/dev/null
echo "Done."
