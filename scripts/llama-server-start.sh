#!/usr/bin/env bash
# llama-server-start.sh — Start llama.cpp server with gemma4 (multimodal/vision)
# Provides an OpenAI-compatible API at http://127.0.0.1:8079/v1/chat/completions
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

# Paths
LLAMA_SERVER="${REPO_DIR}/llama-b8648/llama-server"
MODEL="${REPO_DIR}/models/gemma4.gguf"
PORT="${LLAMA_CPP_PORT:-8079}"
HOST="${LLAMA_CPP_HOST:-127.0.0.1}"
CTX="${LLAMA_CPP_CTX:-8192}"
GPU_LAYERS="${LLAMA_CPP_GPU_LAYERS:-99}"
THREADS="${LLAMA_CPP_THREADS:-$(sysctl -n hw.performancecores 2>/dev/null || echo 8)}"
PARALLEL="${LLAMA_CPP_PARALLEL:-2}"

# Validate
if [[ ! -x "$LLAMA_SERVER" ]]; then
  echo "❌ llama-server not found at $LLAMA_SERVER"
  exit 1
fi
if [[ ! -e "$MODEL" ]]; then
  echo "❌ Model not found at $MODEL"
  echo "   Run: ollama pull gemma4  (then symlink will resolve)"
  exit 1
fi

echo "🚀 Starting llama-server with gemma4"
echo "   Model:    $MODEL"
echo "   Port:     $PORT"
echo "   Context:  $CTX tokens"
echo "   GPU:      $GPU_LAYERS layers offloaded"
echo "   Threads:  $THREADS"
echo "   Parallel: $PARALLEL slots"
echo ""
echo "   API:      http://${HOST}:${PORT}/v1/chat/completions"
echo "   Web UI:   http://${HOST}:${PORT}"
echo ""

# Set DYLD_LIBRARY_PATH so llama-server finds its .dylib files
export DYLD_LIBRARY_PATH="${REPO_DIR}/llama-b8648:${DYLD_LIBRARY_PATH:-}"

exec "$LLAMA_SERVER" \
  -m "$MODEL" \
  --host "$HOST" \
  --port "$PORT" \
  -c "$CTX" \
  -ngl "$GPU_LAYERS" \
  -t "$THREADS" \
  -np "$PARALLEL" \
  --flash-attn auto \
  --metrics \
  --verbose
