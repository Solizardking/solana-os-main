import { ipcMain } from 'electron'

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? ''
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? ''
const LIVEKIT_PROJECT_URL = process.env.LIVEKIT_PROJECT_URL ?? 'wss://solanaos-zn3w8h4f.livekit.cloud'
const LIVEKIT_TOKEN_SERVER = process.env.LIVEKIT_TOKEN_SERVERURL ?? 'https://openclawd-286c1w.sandbox.livekit.io'

// ── Lightweight JWT token creation (no heavy SDK needed) ─────────────────────

function base64url(input: string | Uint8Array): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input)
  return buf.toString('base64url')
}

async function signHS256(header: object, payload: object, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`

  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(data))
  return `${data}.${Buffer.from(sig).toString('base64url')}`
}

async function createRoomToken(
  room: string,
  identity: string,
  ttlSeconds = 3600
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    // Fall back to sandbox token server if no credentials
    const res = await fetch(
      `${LIVEKIT_TOKEN_SERVER}/token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`
    )
    if (!res.ok) throw new Error(`Token server error ${res.status}`)
    const json = (await res.json()) as { token?: string; accessToken?: string }
    return json.token ?? json.accessToken ?? ''
  }

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    iss: LIVEKIT_API_KEY,
    sub: identity,
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
    jti: `${identity}-${now}`,
    video: {
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  }
  return signHS256(header, payload, LIVEKIT_API_SECRET)
}

async function createAgentToken(
  room: string,
  agentIdentity: string,
  ttlSeconds = 7200
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    iss: LIVEKIT_API_KEY || 'clawd-agent',
    sub: agentIdentity,
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
    jti: `agent-${agentIdentity}-${now}`,
    video: {
      roomJoin: true,
      room,
      agent: true,
      canPublish: true,
      canSubscribe: true,
    },
  }
  if (!LIVEKIT_API_SECRET) throw new Error('LIVEKIT_API_SECRET not set')
  return signHS256(header, payload, LIVEKIT_API_SECRET)
}

// ── IPC registration ─────────────────────────────────────────────────────────

export function registerLiveKitHandlers(): void {
  ipcMain.handle('livekit:createRoomToken', (_e, room: string, identity: string, ttl?: number) =>
    createRoomToken(room, identity, ttl)
  )
  ipcMain.handle('livekit:createAgentToken', (_e, room: string, agentIdentity: string, ttl?: number) =>
    createAgentToken(room, agentIdentity, ttl)
  )
  ipcMain.handle('livekit:config', () => ({
    projectUrl: LIVEKIT_PROJECT_URL,
    tokenServer: LIVEKIT_TOKEN_SERVER,
    hasCredentials: Boolean(LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
  }))
}
