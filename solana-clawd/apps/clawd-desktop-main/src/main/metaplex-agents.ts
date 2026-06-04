import { ipcMain } from 'electron'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? ''
const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ??
  `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

const AGENT_REGISTRY_PROGRAM = 'McF3CGcFaXiSwujXBMJSScqQWAFmqHZqBLPPGAZCgm2'
const REGISTER_DISCRIMINATORS = new Set([
  'registerIdentityV1',
  'mintAndSubmitAgent',
  'register',
])

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = (await res.json()) as { result?: unknown; error?: { message: string } }
  if (json.error) throw new Error(json.error.message)
  return json.result
}

interface AgentSig {
  signature: string
  slot: number
  blockTime: number | null
  err: null | unknown
}

interface ParsedTransaction {
  transaction?: {
    message?: {
      instructions?: Array<{
        programId?: string
        parsed?: { type?: string; info?: Record<string, unknown> }
      }>
      accountKeys?: Array<{ pubkey: string; signer: boolean; writable: boolean }>
    }
  }
  meta?: {
    innerInstructions?: Array<{
      instructions?: Array<{ programId?: string; accounts?: string[] }>
    }>
  }
}

interface AgentDocumentJson {
  name?: string
  description?: string
  image?: string
  external_url?: string
  registrationUri?: string
  services?: Array<{ name?: string; endpoint?: string; version?: string }>
  supportedTrust?: string[]
  active?: boolean
}

async function fetchDocument(uri: string): Promise<AgentDocumentJson | null> {
  try {
    const res = await fetch(uri, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return (await res.json()) as AgentDocumentJson
  } catch {
    return null
  }
}

async function resolveAssetByOwner(wallet: string): Promise<string | null> {
  try {
    const res = (await rpc('getAssetsByOwner', [
      { ownerAddress: wallet, page: 1, limit: 5 },
    ])) as { items?: Array<{ id: string; interface?: string }> } | null
    const nft = res?.items?.find((a) => a.interface === 'V1_NFT' || a.interface === 'MplCoreAsset')
    return nft?.id ?? null
  } catch {
    return null
  }
}

interface RecentAgentsResult {
  items: Array<{
    assetAddress: string
    pda: string
    wallet: string
    signature: string
    slot: number
    blockTime: number | null
    network: string
    name: string | null
    image: string | null
    description: string | null
    registrationUri: string | null
    services: Array<{ name?: string; endpoint?: string; version?: string }>
    active: boolean | null
    supportedTrust: string[] | null
  }>
  network: string
}

async function getRecentAgents(limit = 12, shouldFetchDocument = true): Promise<RecentAgentsResult> {
  const sigs = (await rpc('getSignaturesForAddress', [
    AGENT_REGISTRY_PROGRAM,
    { limit: limit * 3 },
  ])) as AgentSig[]

  const validSigs = sigs.filter((s) => !s.err).slice(0, limit * 2)

  const items: RecentAgentsResult['items'] = []

  for (const sig of validSigs) {
    if (items.length >= limit) break
    try {
      const tx = (await rpc('getParsedTransaction', [
        sig.signature,
        { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
      ])) as ParsedTransaction | null

      if (!tx) continue

      // Find the instruction targeting the agent registry program
      const ix = tx.transaction?.message?.instructions?.find(
        (i) => i.programId === AGENT_REGISTRY_PROGRAM
      )
      if (!ix) continue

      // Determine discriminator name from parsed instruction type
      const ixType = ix.parsed?.type ?? ''
      const isRegistration = REGISTER_DISCRIMINATORS.has(ixType) || ixType === ''

      if (!isRegistration && !REGISTER_DISCRIMINATORS.has(ixType)) continue

      const keys = tx.transaction?.message?.accountKeys ?? []
      const wallet = keys.find((k) => k.signer && k.writable)?.pubkey ?? ''

      // Try to find the PDA from inner instructions (system create account)
      let pda = ''
      for (const inner of tx.meta?.innerInstructions ?? []) {
        for (const innerIx of inner.instructions ?? []) {
          if (innerIx.programId === '11111111111111111111111111111111') {
            pda = innerIx.accounts?.[1] ?? ''
            break
          }
        }
        if (pda) break
      }

      // Try to resolve the Core Asset address
      let assetAddress = ''
      if (wallet) {
        assetAddress = (await resolveAssetByOwner(wallet)) ?? ''
      }
      if (!assetAddress && pda) assetAddress = pda

      // Fetch the off-chain document
      let doc: AgentDocumentJson | null = null
      const registrationUri = (ix.parsed?.info as Record<string, string> | undefined)?.uri ?? null
      if (shouldFetchDocument && registrationUri) {
        doc = await fetchDocument(registrationUri)
      }

      items.push({
        assetAddress,
        pda,
        wallet,
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        network: 'solana-mainnet',
        name: doc?.name ?? null,
        image: doc?.image ?? null,
        description: doc?.description ?? null,
        registrationUri,
        services: doc?.services ?? [],
        active: doc?.active ?? null,
        supportedTrust: doc?.supportedTrust ?? null,
      })
    } catch {
      // skip failed tx
    }
  }

  return { items, network: 'solana-mainnet' }
}

async function getAgentByAddress(assetAddress: string): Promise<unknown> {
  try {
    return await rpc('getAsset', [assetAddress])
  } catch {
    return null
  }
}

// ── IPC registration ─────────────────────────────────────────────────────────

export function registerMetaplexHandlers(): void {
  ipcMain.handle(
    'metaplex:recentAgents',
    (_e, limit?: number, fetchDoc?: boolean) => getRecentAgents(limit, fetchDoc)
  )
  ipcMain.handle('metaplex:getAgent', (_e, address: string) => getAgentByAddress(address))
  ipcMain.handle('metaplex:config', () => ({
    program: AGENT_REGISTRY_PROGRAM,
    hasHelius: Boolean(HELIUS_API_KEY),
  }))
}
