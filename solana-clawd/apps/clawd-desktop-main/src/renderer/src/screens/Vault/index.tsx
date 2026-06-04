import { useEffect, useState } from 'react'
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Shield,
  AlertCircle,
} from 'lucide-react'
import '../../types/clawd.d'

type VaultStatus = { path: string; exists: boolean; osKeychainAvailable: boolean } | null

export function VaultScreen() {
  const [keys, setKeys] = useState<string[]>([])
  const [status, setStatus] = useState<VaultStatus>(null)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [revealed, setRevealed] = useState<Record<string, string>>({})
  const [showNew, setShowNew] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  async function refresh() {
    const [ks, st] = await Promise.all([
      window.clawdAPI.vault.list(),
      window.clawdAPI.vault.status(),
    ])
    setKeys(ks.filter((k) => k !== '__agent_wallet_index__'))
    setStatus(st)
  }

  useEffect(() => { refresh() }, [])

  async function reveal(k: string) {
    if (revealed[k]) {
      setRevealed((p) => { const n = { ...p }; delete n[k]; return n })
      return
    }
    const val = await window.clawdAPI.vault.get(k)
    if (val) setRevealed((p) => ({ ...p, [k]: val }))
  }

  async function copySecret(k: string) {
    const val = revealed[k] ?? await window.clawdAPI.vault.get(k)
    if (!val) return
    await navigator.clipboard.writeText(val)
    setCopied(k)
    setTimeout(() => setCopied(null), 1200)
  }

  async function remove(k: string) {
    await window.clawdAPI.vault.delete(k)
    setRevealed((p) => { const n = { ...p }; delete n[k]; return n })
    await refresh()
  }

  async function add() {
    if (!newKey.trim() || !newValue.trim()) return
    setAdding(true)
    setError(null)
    try {
      await window.clawdAPI.vault.set(newKey.trim(), newValue.trim())
      setNewKey('')
      setNewValue('')
      setShowNew(false)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setAdding(false)
    }
  }

  // Pre-fill commonly used Clawd keys
  const SUGGESTED_KEYS = [
    'HELIUS_API_KEY', 'BIRDEYE_API_KEY', 'MINIMAX_API_KEY',
    'ASSEMBLY_AI_API_KEY', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET',
    'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'X402_GATEWAY_URL',
  ]

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold">Secret Vault</h2>
        <button onClick={refresh} className="ml-auto text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status banner */}
      {status && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
          status.osKeychainAvailable
            ? 'bg-green-500/10 border-green-400/30 text-green-400'
            : 'bg-yellow-500/10 border-yellow-400/30 text-yellow-400'
        }`}>
          <Shield className="w-3 h-3 flex-shrink-0" />
          {status.osKeychainAvailable
            ? 'OS Keychain — vault key protected by macOS Keychain'
            : 'Fallback mode — vault key derived from machine ID'}
          <span className="ml-auto font-mono text-muted-foreground truncate">{status.path}</span>
        </div>
      )}

      {/* Add new secret */}
      {!showNew ? (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/50 text-muted-foreground hover:border-yellow-400/40 hover:text-yellow-400 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Add secret
        </button>
      ) : (
        <div className="rounded-lg border border-yellow-400/30 bg-secondary/30 p-3 space-y-2">
          <div className="flex gap-2">
            <input
              list="suggested-keys"
              className="flex-1 rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-yellow-400/60"
              placeholder="KEY_NAME"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <datalist id="suggested-keys">
              {SUGGESTED_KEYS.map((k) => <option key={k} value={k} />)}
            </datalist>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-yellow-400/60"
              placeholder="secret value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
          </div>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={adding || !newKey.trim() || !newValue.trim()}
              className="px-3 py-1.5 rounded bg-yellow-500/20 border border-yellow-400/40 text-yellow-400 text-xs hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
            >
              {adding ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewKey(''); setNewValue(''); setError(null) }}
              className="px-3 py-1.5 rounded border border-border/40 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Secrets list */}
      {keys.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center space-y-2">
            <Unlock className="w-10 h-10 opacity-20 mx-auto" />
            <p>Vault is empty — add your first secret above</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {keys.map((k) => (
            <li key={k} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/30 bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <Lock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="font-mono text-sm text-foreground flex-1 truncate">{k}</span>
              {revealed[k] && (
                <span className="font-mono text-xs text-muted-foreground max-w-32 truncate">
                  {revealed[k]}
                </span>
              )}
              <button onClick={() => reveal(k)} className="text-muted-foreground hover:text-foreground">
                {revealed[k] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => copySecret(k)} className="text-muted-foreground hover:text-foreground">
                <Copy className={`w-3.5 h-3.5 ${copied === k ? 'text-green-400' : ''}`} />
              </button>
              <button onClick={() => remove(k)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
