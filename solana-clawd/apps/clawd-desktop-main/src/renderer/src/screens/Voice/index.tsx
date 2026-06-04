import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Radio,
  Zap,
  AlertCircle,
} from 'lucide-react'
import '../../types/clawd.d'

const SAMPLE_RATE = 16000
const CHUNK_MS = 100

type TranscriptLine = { id: string; speaker: 'user' | 'agent'; text: string; final: boolean; ts: number }

type SessionStatus = 'idle' | 'connecting' | 'active' | 'error'

const VOICE_COMMANDS: Record<string, string> = {
  'check balance': 'navigate to solana screen to check wallet',
  'open solana': 'navigate to solana explorer',
  'open agents': 'navigate to agent explorer',
  'open settings': 'navigate to settings',
  'show models': 'navigate to models screen',
  'hey clawd': 'activate assistant mode',
}

function matchVoiceCommand(text: string): string | null {
  const lower = text.toLowerCase().trim()
  for (const [cmd, action] of Object.entries(VOICE_COMMANDS)) {
    if (lower.includes(cmd)) return action
  }
  return null
}

export function VoiceScreen() {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [currentPartial, setCurrentPartial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cfg, setCfg] = useState<{ hasApiKey: boolean } | null>(null)
  const [livekitCfg, setLivekitCfg] = useState<{ projectUrl: string } | null>(null)
  const [commandLog, setCommandLog] = useState<string[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    window.clawdAPI?.assemblyai.config().then(setCfg).catch(() => {})
    window.clawdAPI?.livekit.config().then(setLivekitCfg).catch(() => {})
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, currentPartial])

  const addLine = useCallback((speaker: 'user' | 'agent', text: string, final = true) => {
    setTranscript((prev) => [
      ...prev,
      { id: crypto.randomUUID(), speaker, text, final, ts: Date.now() },
    ])
  }, [])

  const stopSession = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    processorRef.current?.disconnect()
    processorRef.current = null
    mediaRef.current?.getTracks().forEach((t) => t.stop())
    mediaRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setStatus('idle')
    setCurrentPartial('')
  }, [])

  const startSession = useCallback(async () => {
    setError(null)
    setStatus('connecting')

    try {
      const { token } = await window.clawdAPI.assemblyai.getStreamingToken(60)

      const wsUrl = new URL('wss://streaming.assemblyai.com/v3/ws')
      wsUrl.searchParams.set('speech_model', 'universal-streaming-english')
      wsUrl.searchParams.set('token', token)
      wsUrl.searchParams.set('encoding', 'pcm_s16le')
      wsUrl.searchParams.set('sample_rate', String(SAMPLE_RATE))
      wsUrl.searchParams.set('format_turns', 'true')

      const ws = new WebSocket(wsUrl.toString())
      wsRef.current = ws

      ws.onopen = () => setStatus('active')
      ws.onerror = () => {
        setError('WebSocket connection failed')
        setStatus('error')
        stopSession()
      }
      ws.onclose = () => {
        if (status === 'active') setStatus('idle')
      }

      ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as {
            type?: string
            text?: string
            turn_is_formatted?: boolean
            end_of_turn?: boolean
          }

          if (msg.type === 'session_begins') return

          if (msg.type === 'turn' || msg.text) {
            const text = msg.text ?? ''
            if (!msg.end_of_turn) {
              setCurrentPartial(text)
            } else {
              setCurrentPartial('')
              if (text.trim()) {
                addLine('user', text)
                // Check for voice commands
                const cmd = matchVoiceCommand(text)
                if (cmd) {
                  setCommandLog((p) => [`[CMD] ${cmd}`, ...p.slice(0, 9)])
                  // Let the LLM respond
                  const reply = await window.clawdAPI.assemblyai.chat(
                    'claude-sonnet-4-6',
                    [
                      { role: 'system', content: 'You are Clawd, a Solana AI agent assistant. Be brief.' },
                      { role: 'user', content: text },
                    ],
                    200
                  )
                  addLine('agent', reply.content)
                }
              }
            }
          }
        } catch {
          // ignore malformed messages
        }
      }

      // Mic → PCM16 pipeline
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: SAMPLE_RATE, channelCount: 1 } })
      mediaRef.current = stream
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(SAMPLE_RATE * CHUNK_MS / 1000, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const float32 = e.inputBuffer.getChannelData(0)
        const int16 = new Int16Array(float32.length)
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768))
        }
        ws.send(int16.buffer)
      }

      source.connect(processor)
      processor.connect(ctx.destination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
      setStatus('error')
    }
  }, [addLine, status, stopSession])

  const isActive = status === 'active'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/40">
        <Radio className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">Voice Agent</h2>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {cfg && (
            <span className={cfg.hasApiKey ? 'text-green-400' : 'text-red-400'}>
              {cfg.hasApiKey ? '● AssemblyAI' : '○ AssemblyAI (no key)'}
            </span>
          )}
          {livekitCfg && (
            <span className="text-blue-400">● LiveKit</span>
          )}
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {transcript.length === 0 && status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Mic className="w-12 h-12 opacity-20" />
            <p className="text-sm">Press the button to start voice session</p>
            <div className="text-xs text-left max-w-xs space-y-1 mt-2">
              <p className="text-muted-foreground font-medium mb-1">Voice commands:</p>
              {Object.keys(VOICE_COMMANDS).map((cmd) => (
                <p key={cmd} className="font-mono text-xs">
                  <span className="text-purple-400">&quot;{cmd}&quot;</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {transcript.map((line) => (
          <div
            key={line.id}
            className={`flex gap-2 ${line.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {line.speaker === 'agent' && (
              <div className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="w-3 h-3 text-purple-400" />
              </div>
            )}
            <div
              className={`max-w-xs rounded-2xl px-3 py-2 text-sm leading-snug ${
                line.speaker === 'user'
                  ? 'bg-blue-500/20 border border-blue-400/30 text-foreground rounded-br-sm'
                  : 'bg-secondary/50 border border-border/40 text-foreground rounded-bl-sm'
              }`}
            >
              {line.text}
            </div>
            {line.speaker === 'user' && (
              <div className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Mic className="w-3 h-3 text-blue-400" />
              </div>
            )}
          </div>
        ))}

        {currentPartial && (
          <div className="flex gap-2 justify-end">
            <div className="max-w-xs rounded-2xl px-3 py-2 text-sm bg-blue-500/10 border border-blue-400/20 text-muted-foreground rounded-br-sm italic">
              {currentPartial}…
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 mt-1">
              <Mic className="w-3 h-3 text-blue-400 animate-pulse" />
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Command log */}
      {commandLog.length > 0 && (
        <div className="px-4 py-2 border-t border-border/30 bg-secondary/20">
          {commandLog.slice(0, 3).map((c, i) => (
            <p key={i} className="text-xs font-mono text-purple-400 truncate">{c}</p>
          ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-t border-border/40 flex items-center justify-center gap-4">
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={status === 'connecting'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isActive
              ? 'bg-red-500/20 border-2 border-red-400 text-red-400 hover:bg-red-500/30 animate-pulse'
              : status === 'connecting'
              ? 'bg-secondary/40 border-2 border-border/50 text-muted-foreground'
              : 'bg-blue-500/20 border-2 border-blue-400 text-blue-400 hover:bg-blue-500/30'
          }`}
        >
          {status === 'connecting' ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </button>

        {isActive && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        {isActive && (
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Volume2 className="w-3 h-3" />
            <span>Universal Streaming</span>
          </div>
        )}
      </div>
    </div>
  )
}
