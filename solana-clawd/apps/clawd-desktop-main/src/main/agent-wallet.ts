/**
 * Clawd OS Agent Wallet — local Solana keypair management.
 *
 * Keypairs are stored encrypted in the vault (see vault.ts).
 * Each "agent wallet" is an ed25519 keypair identified by a label.
 */
import { ipcMain } from 'electron'
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import { randomBytes } from 'node:crypto'
import { vaultReadAll, vaultWriteKey } from './vault'

const WALLET_INDEX_KEY = '__agent_wallet_index__'

type AgentWalletEntry = {
  label: string
  publicKey: string
  secretKeyB58: string
  createdAt: number
  network: 'mainnet' | 'devnet'
}

type WalletIndex = Record<string, AgentWalletEntry>

// ── Index helpers (backed by vault) ──────────────────────────────────────────

async function loadIndex(): Promise<WalletIndex> {
  const vault = await vaultReadAll()
  const raw = vault[WALLET_INDEX_KEY]
  if (!raw) return {}
  try { return JSON.parse(raw) as WalletIndex } catch { return {} }
}

async function saveIndex(index: WalletIndex): Promise<void> {
  await vaultWriteKey(WALLET_INDEX_KEY, JSON.stringify(index))
}

// ── Keypair helpers ──────────────────────────────────────────────────────────

function generateKeypair(seed?: Uint8Array): { publicKey: string; secretKeyB58: string } {
  const kp = seed ? nacl.sign.keyPair.fromSeed(seed) : nacl.sign.keyPair()
  return {
    publicKey: bs58.encode(kp.publicKey),
    secretKeyB58: bs58.encode(kp.secretKey),
  }
}

function publicKeyFromSecret(secretKeyB58: string): string {
  const sk = bs58.decode(secretKeyB58)
  const kp = nacl.sign.keyPair.fromSecretKey(sk)
  return bs58.encode(kp.publicKey)
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

export function registerAgentWalletHandlers(): void {
  // Create a new agent wallet
  ipcMain.handle(
    'wallet:create',
    async (
      _e,
      label: string,
      network: 'mainnet' | 'devnet' = 'mainnet',
      seedPhrase?: string
    ) => {
      const index = await loadIndex()
      if (index[label]) throw new Error(`Wallet "${label}" already exists`)

      let kp: { publicKey: string; secretKeyB58: string }
      if (seedPhrase) {
        // Derive seed from passphrase using simple hash (not BIP39 — use for dev only)
        const { createHash } = await import('node:crypto')
        const seed = createHash('sha256').update(seedPhrase).digest().subarray(0, 32)
        kp = generateKeypair(seed)
      } else {
        kp = generateKeypair()
      }

      const entry: AgentWalletEntry = {
        label,
        publicKey: kp.publicKey,
        secretKeyB58: kp.secretKeyB58,
        createdAt: Date.now(),
        network,
      }

      index[label] = entry
      await saveIndex(index)
      return { label, publicKey: kp.publicKey, network }
    }
  )

  // Import an existing keypair by base58 secret key
  ipcMain.handle(
    'wallet:import',
    async (_e, label: string, secretKeyB58: string, network: 'mainnet' | 'devnet' = 'mainnet') => {
      const index = await loadIndex()
      if (index[label]) throw new Error(`Wallet "${label}" already exists`)

      const publicKey = publicKeyFromSecret(secretKeyB58)
      const entry: AgentWalletEntry = {
        label,
        publicKey,
        secretKeyB58,
        createdAt: Date.now(),
        network,
      }

      index[label] = entry
      await saveIndex(index)
      return { label, publicKey, network }
    }
  )

  // List all wallets (public info only — no secret keys)
  ipcMain.handle('wallet:list', async () => {
    const index = await loadIndex()
    return Object.values(index).map(({ label, publicKey, createdAt, network }) => ({
      label,
      publicKey,
      createdAt,
      network,
    }))
  })

  // Get public key for a wallet
  ipcMain.handle('wallet:publicKey', async (_e, label: string) => {
    const index = await loadIndex()
    return index[label]?.publicKey ?? null
  })

  // Export secret key (requires explicit confirmation — only for export/backup)
  ipcMain.handle('wallet:exportSecret', async (_e, label: string) => {
    const index = await loadIndex()
    if (!index[label]) throw new Error(`Wallet "${label}" not found`)
    return index[label].secretKeyB58
  })

  // Delete a wallet
  ipcMain.handle('wallet:delete', async (_e, label: string) => {
    const index = await loadIndex()
    delete index[label]
    await saveIndex(index)
    return true
  })

  // Sign a message with a wallet
  ipcMain.handle('wallet:sign', async (_e, label: string, messageHex: string) => {
    const index = await loadIndex()
    if (!index[label]) throw new Error(`Wallet "${label}" not found`)
    const sk = bs58.decode(index[label].secretKeyB58)
    const kp = nacl.sign.keyPair.fromSecretKey(sk)
    const msg = Buffer.from(messageHex, 'hex')
    const sig = nacl.sign.detached(msg, kp.secretKey)
    return Buffer.from(sig).toString('hex')
  })

  // Generate a random nonce (utility)
  ipcMain.handle('wallet:nonce', () => randomBytes(32).toString('hex'))
}
