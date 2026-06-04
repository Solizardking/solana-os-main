import { ipcMain } from 'electron'

const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? ''
const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ??
  `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY ?? ''

// ── RPC helpers ─────────────────────────────────────────────────────────────

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

// ── Helius Enhanced API ──────────────────────────────────────────────────────

async function getBalances(address: string) {
  const res = await fetch(
    `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    }
  )
  const json = (await res.json()) as { result?: { value: number } }
  return { lamports: (json.result?.value ?? 0) as number }
}

async function getTokenAccounts(address: string) {
  return rpc('getTokenAccountsByOwner', [
    address,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ])
}

async function getTransactionHistory(address: string, limit = 10) {
  const sigs = (await rpc('getSignaturesForAddress', [
    address,
    { limit },
  ])) as Array<{ signature: string; blockTime: number; err: null | unknown }>
  return sigs
}

async function getAssets(address: string) {
  const res = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: address,
        page: 1,
        limit: 50,
        displayOptions: { showFungible: true, showNativeBalance: true },
      },
    }),
  })
  const json = (await res.json()) as { result?: unknown }
  return json.result
}

// ── Birdeye market data ──────────────────────────────────────────────────────

async function getTokenPrice(mintAddress: string) {
  if (!BIRDEYE_API_KEY) return null
  const res = await fetch(
    `https://public-api.birdeye.so/defi/price?address=${mintAddress}`,
    { headers: { 'X-API-KEY': BIRDEYE_API_KEY } }
  )
  const json = (await res.json()) as { data?: { value: number; updateUnixTime: number } }
  return json.data ?? null
}

async function getWalletPortfolio(address: string) {
  if (!BIRDEYE_API_KEY) return null
  const res = await fetch(
    `https://public-api.birdeye.so/v1/wallet/token_list?wallet=${address}`,
    { headers: { 'X-API-KEY': BIRDEYE_API_KEY, 'x-chain': 'solana' } }
  )
  const json = (await res.json()) as { data?: unknown }
  return json.data ?? null
}

// ── IPC registration ─────────────────────────────────────────────────────────

export function registerHelisHandlers(): void {
  ipcMain.handle('helius:getBalances', (_e, address: string) => getBalances(address))
  ipcMain.handle('helius:getTokenAccounts', (_e, address: string) => getTokenAccounts(address))
  ipcMain.handle('helius:getTransactionHistory', (_e, address: string, limit?: number) =>
    getTransactionHistory(address, limit)
  )
  ipcMain.handle('helius:getAssets', (_e, address: string) => getAssets(address))
  ipcMain.handle('helius:getTokenPrice', (_e, mint: string) => getTokenPrice(mint))
  ipcMain.handle('helius:getWalletPortfolio', (_e, address: string) => getWalletPortfolio(address))
  ipcMain.handle('helius:config', () => ({
    hasHelius: Boolean(HELIUS_API_KEY),
    hasBirdeye: Boolean(BIRDEYE_API_KEY),
    rpcUrl: HELIUS_RPC_URL.replace(/api-key=[^&]+/, 'api-key=***'),
  }))
}
