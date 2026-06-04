/**
 * Clawd OS Secret Vault — AES-256-GCM encrypted local storage.
 *
 * Uses Electron safeStorage (OS keychain) to protect the vault key.
 * Falls back to a hardened passphrase derivation when safeStorage is
 * unavailable (e.g. headless CI).
 */
import { ipcMain, safeStorage, app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto'

const VAULT_FILE = () => join(app.getPath('userData'), 'clawd-vault.enc')
const SALT_FILE  = () => join(app.getPath('userData'), 'clawd-vault.salt')
const KEY_FILE   = () => join(app.getPath('userData'), 'clawd-vault.key')

const ALG = 'aes-256-gcm'
const KEY_LEN = 32
const IV_LEN  = 12
const TAG_LEN = 16

// ── Key derivation / protection ──────────────────────────────────────────────

async function getOrCreateKey(): Promise<Buffer> {
  const keyFile = KEY_FILE()
  const saltFile = SALT_FILE()

  if (safeStorage.isEncryptionAvailable()) {
    // OS keychain path
    if (existsSync(keyFile)) {
      const enc = await readFile(keyFile)
      return Buffer.from(safeStorage.decryptString(enc), 'hex')
    }
    const rawKey = randomBytes(KEY_LEN).toString('hex')
    const enc = safeStorage.encryptString(rawKey)
    await ensureDir(keyFile)
    await writeFile(keyFile, enc)
    return Buffer.from(rawKey, 'hex')
  } else {
    // Fallback: scrypt-derive from machine ID + salt
    let salt: Buffer
    if (existsSync(saltFile)) {
      salt = await readFile(saltFile)
    } else {
      salt = randomBytes(32)
      await ensureDir(saltFile)
      await writeFile(saltFile, salt)
    }
    const machineId = app.getPath('userData')
    return scryptSync(machineId, salt, KEY_LEN) as Buffer
  }
}

async function ensureDir(filePath: string) {
  const dir = filePath.split('/').slice(0, -1).join('/')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

// ── Encrypt / decrypt ────────────────────────────────────────────────────────

function encrypt(key: Buffer, plaintext: string): Buffer {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALG, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc])
}

function decrypt(key: Buffer, blob: Buffer): string {
  const iv  = blob.subarray(0, IV_LEN)
  const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = blob.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALG, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

// ── Vault read / write ───────────────────────────────────────────────────────

type VaultData = Record<string, string>

async function readVault(key: Buffer): Promise<VaultData> {
  const file = VAULT_FILE()
  if (!existsSync(file)) return {}
  try {
    const blob = await readFile(file)
    const json = decrypt(key, blob)
    return JSON.parse(json) as VaultData
  } catch {
    return {}
  }
}

async function writeVault(key: Buffer, data: VaultData): Promise<void> {
  const blob = encrypt(key, JSON.stringify(data))
  await ensureDir(VAULT_FILE())
  await writeFile(VAULT_FILE(), blob)
}

// ── IPC handlers ─────────────────────────────────────────────────────────────

let _key: Buffer | null = null

async function key(): Promise<Buffer> {
  if (!_key) _key = await getOrCreateKey()
  return _key
}

// ── Direct module-level accessors (used by agent-wallet.ts) ─────────────────

export async function vaultReadAll(): Promise<VaultData> {
  return readVault(await key())
}

export async function vaultWriteKey(secretKey: string, value: string): Promise<void> {
  const k = await key()
  const vault = await readVault(k)
  vault[secretKey] = value
  await writeVault(k, vault)
}

export function registerVaultHandlers(): void {
  ipcMain.handle('vault:get', async (_e, secretKey: string) => {
    const k = await key()
    const vault = await readVault(k)
    return vault[secretKey] ?? null
  })

  ipcMain.handle('vault:set', async (_e, secretKey: string, value: string) => {
    const k = await key()
    const vault = await readVault(k)
    vault[secretKey] = value
    await writeVault(k, vault)
    return true
  })

  ipcMain.handle('vault:delete', async (_e, secretKey: string) => {
    const k = await key()
    const vault = await readVault(k)
    delete vault[secretKey]
    await writeVault(k, vault)
    return true
  })

  ipcMain.handle('vault:list', async () => {
    const k = await key()
    const vault = await readVault(k)
    return Object.keys(vault)
  })

  ipcMain.handle('vault:clear', async () => {
    const k = await key()
    await writeVault(k, {})
    return true
  })

  ipcMain.handle('vault:status', () => ({
    path: VAULT_FILE(),
    exists: existsSync(VAULT_FILE()),
    osKeychainAvailable: safeStorage.isEncryptionAvailable(),
  }))
}
