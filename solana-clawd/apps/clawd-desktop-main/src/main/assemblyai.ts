import { ipcMain } from 'electron'

const AAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY ?? ''
const AAI_STREAMING_BASE = 'https://streaming.assemblyai.com'
const AAI_AGENTS_BASE = 'https://agents.assemblyai.com'
const AAI_LLM_BASE = 'https://llm-gateway.assemblyai.com/v1'

// ── Streaming token ──────────────────────────────────────────────────────────

async function getStreamingToken(
  expiresInSeconds = 60,
  maxSessionDurationSeconds = 10800
): Promise<{ token: string; expires_in_seconds: number }> {
  const url = new URL(`${AAI_STREAMING_BASE}/v3/token`)
  url.searchParams.set('expires_in_seconds', String(expiresInSeconds))
  url.searchParams.set('max_session_duration_seconds', String(maxSessionDurationSeconds))

  const res = await fetch(url.toString(), {
    headers: { Authorization: AAI_API_KEY },
  })
  if (!res.ok) throw new Error(`AssemblyAI streaming token error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<{ token: string; expires_in_seconds: number }>
}

// ── Voice Agent token ────────────────────────────────────────────────────────

async function getVoiceAgentToken(
  expiresInSeconds = 300,
  maxSessionDurationSeconds = 10800
): Promise<{ token: string; expires_in_seconds: number }> {
  const url = new URL(`${AAI_AGENTS_BASE}/v1/token`)
  url.searchParams.set('expires_in_seconds', String(expiresInSeconds))
  url.searchParams.set('max_session_duration_seconds', String(maxSessionDurationSeconds))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${AAI_API_KEY}` },
  })
  if (!res.ok) throw new Error(`AssemblyAI voice agent token error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<{ token: string; expires_in_seconds: number }>
}

// ── LLM Gateway chat ─────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

async function chat(
  model: string,
  messages: ChatMessage[],
  maxTokens = 1000,
  temperature = 0.7
): Promise<{ content: string; usage: { input_tokens: number; output_tokens: number } }> {
  const res = await fetch(`${AAI_LLM_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: AAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  })
  if (!res.ok) throw new Error(`AssemblyAI LLM Gateway error ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
    usage: { input_tokens: number; output_tokens: number; total_tokens: number }
  }
  return {
    content: json.choices[0]?.message?.content ?? '',
    usage: json.usage,
  }
}

// ── Speech-to-text (pre-recorded) ────────────────────────────────────────────

async function transcribeUrl(audioUrl: string): Promise<{ id: string; text: string; status: string }> {
  // Submit
  const submit = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { Authorization: AAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl, speech_model: 'universal-streaming-english' }),
  })
  const { id } = (await submit.json()) as { id: string }

  // Poll until done (max 60s)
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { Authorization: AAI_API_KEY },
    })
    const result = (await poll.json()) as { id: string; status: string; text?: string; error?: string }
    if (result.status === 'completed') return { id: result.id, text: result.text ?? '', status: 'completed' }
    if (result.status === 'error') throw new Error(result.error ?? 'Transcription failed')
  }
  throw new Error('Transcription timed out')
}

// ── IPC registration ─────────────────────────────────────────────────────────

export function registerAssemblyAIHandlers(): void {
  ipcMain.handle('assemblyai:getStreamingToken', (_e, expiresIn?: number, maxDuration?: number) =>
    getStreamingToken(expiresIn, maxDuration)
  )
  ipcMain.handle('assemblyai:getVoiceAgentToken', (_e, expiresIn?: number, maxDuration?: number) =>
    getVoiceAgentToken(expiresIn, maxDuration)
  )
  ipcMain.handle(
    'assemblyai:chat',
    (_e, model: string, messages: ChatMessage[], maxTokens?: number, temperature?: number) =>
      chat(model, messages, maxTokens, temperature)
  )
  ipcMain.handle('assemblyai:transcribeUrl', (_e, audioUrl: string) => transcribeUrl(audioUrl))
  ipcMain.handle('assemblyai:config', () => ({
    hasApiKey: Boolean(AAI_API_KEY),
    streamingBase: AAI_STREAMING_BASE,
    agentsBase: AAI_AGENTS_BASE,
    llmBase: AAI_LLM_BASE,
  }))
}
