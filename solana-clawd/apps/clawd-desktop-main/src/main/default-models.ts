/**
 * Default models seeded on first install.
 *
 * Provider keys: minimax, assemblyai, openrouter, anthropic, openai, custom
 * MiniMax M3 is the default Clawd OS model.
 */

export interface DefaultModel {
  name: string;
  provider: string;
  model: string;
  baseUrl: string;
}

const DEFAULT_MODELS: DefaultModel[] = [
  // ── MiniMax (default for Clawd OS) ───────────────────────────────────
  {
    name: "MiniMax M3",
    provider: "minimax",
    model: "minimax-m3",
    baseUrl: "https://api.minimax.chat/v1",
  },
  {
    name: "MiniMax M3 (OpenRouter)",
    provider: "openrouter",
    model: "minimax/minimax-m3",
    baseUrl: "",
  },

  // ── AssemblyAI LLM Gateway ───────────────────────────────────────────
  {
    name: "Claude Sonnet 4.6 (AssemblyAI Gateway)",
    provider: "assemblyai",
    model: "claude-sonnet-4-6",
    baseUrl: "https://llm-gateway.assemblyai.com/v1",
  },

  // ── OpenRouter (200+ models) ─────────────────────────────────────────
  {
    name: "Claude Sonnet 4",
    provider: "openrouter",
    model: "anthropic/claude-sonnet-4-20250514",
    baseUrl: "",
  },

  // ── Anthropic (direct) ───────────────────────────────────────────────
  {
    name: "Claude Sonnet 4",
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    baseUrl: "",
  },

  // ── OpenAI (direct) ──────────────────────────────────────────────────
  {
    name: "GPT-4.1",
    provider: "openai",
    model: "gpt-4.1",
    baseUrl: "",
  },
];

export default DEFAULT_MODELS;
