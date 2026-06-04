#!/bin/bash
# Start Gemma 3 llama-server for SolanaOS Daemon
# OpenAI-compatible API server on port 8080

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LLAMA_DIR="$PROJECT_ROOT/llama-b8648"
MODEL_PATH="$PROJECT_ROOT/models/gemma-3-1b-it-Q4_K_M.gguf"

# Default port (can be overridden with environment variable)
PORT="${LLAMA_PORT:-8080}"

# Number of threads (default to CPU cores)
THREADS="${LLAMA_THREADS:-$(sysctl -n hw.ncpu)}"

# Context window size
CTX_SIZE="${LLAMA_CTX_SIZE:-8192}"

# GPU layers (use Metal on macOS)
GPU_LFX="${LLAMA_GPU_LAYERS:-99}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SolanaOS Daemon - Gemma 4 Local LLM Server                ║"
echo "║  llama.cpp b8648 • OpenAI-Compatible API                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Model: $MODEL_PATH"
echo "Port: $PORT"
echo "Threads: $THREADS"
echo "Context Size: $CTX_SIZE"
echo "GPU Layers: $GPU_LFX"
echo ""

# Check if model exists
if [ ! -f "$MODEL_PATH" ]; then
    echo "ERROR: Model not found at $MODEL_PATH"
    echo "Download with: llama-cli -hf ggml-org/gemma-3-1b-it-GGUF -o $MODEL_PATH"
    exit 1
fi

# Check if llama-server exists
if [ ! -x "$LLAMA_DIR/llama-server" ]; then
    echo "ERROR: llama-server not found at $LLAMA_DIR/llama-server"
    exit 1
fi

# Set library path for macOS
export DYLD_LIBRARY_PATH="$LLAMA_DIR:$DYLD_LIBRARY_PATH"

echo "Starting llama-server..."
echo "API endpoint: http://localhost:$PORT/v1/chat/completions"
echo "Web UI: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start llama-server with OpenAI-compatible API
exec "$LLAMA_DIR/llama-server" \
    --model "$MODEL_PATH" \
    --port "$PORT" \
    --host "127.0.0.1" \
    --threads "$THREADS" \
    --ctx-size "$CTX_SIZE" \
    --gpu-layers "$GPU_LFX" \
    --cont-batching \
    --metrics \
    --chat-template gemma \
    "$@"