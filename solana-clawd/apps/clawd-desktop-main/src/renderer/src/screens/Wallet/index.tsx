import { useEffect, useState } from 'react'
import {
  Wallet,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Download,
  Upload,
  CheckCircle,
} from 'lucide-react'
import '../../types/clawd.d'

type WalletEntry = { label: string; publicKey: string; createdAt: number; network: string }

export function WalletScreen() {
  const [wallets, setWallets] = useState<WalletEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'idle' | 'create' | 'import'>('idle')
  const [label, setLabel] = useState('')
  const [network, setNetwork] = useState<'mainnet' | 'devnet'>('mainnet')
  const [seedPhrase, setSeedPhrase] = useState('')
  const [importKey, setImportKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    try { setWallets(await window.clawdAPI.wallet.list()) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  async function create() {
    if (!label.trim()) return
    setError(null)
    try {
      const result = await window.clawdAPI.wallet.create(
        label.trim(), network, seedPhrase.trim() || undefined
      )
      setSuccess(`Created wallet "${result.label}" — ${result.publicKey.slice(0, 8)}…`)
      setMode('idle'); setLabel(''); setSeedPhrase('')
      await refresh()
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Create failed') }
  }

  async function importWallet() {
    if (!label.trim() || !importKey.trim()) return
    setError(null)
    try {
      const result = await window.clawdAPI.wallet.import(label.trim(), importKey.trim(), network)
      setSuccess(`Imported "${result.label}" — ${result.publicKey.slice(0, 8)}…`)
      setMode('idle'); setLabel(''); setImportKey('')
      await refresh()
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed') }
  }

  async function remove(l: string) {
    await window.clawdAPI.wallet.delete(l)
    setRevealedSecrets((p) => { const n = { ...p }; delete n[l]; return n })
    await refresh()
  }

  async function toggleSecret(l: string) {
    if (revealedSecrets[l]) {
      setRevealedSecrets((p) => { const n = { ...p }; delete n[l]; return n })
      return
    }
    try {
      const sk = await window.clawdAPI.wallet.exportSecret(l)
      setRevealedSecrets((p) => ({ ...p, [l]: sk }))
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed') }
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      <div className="flex items-center gap-3">
        <Wallet className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold">Agent Wallets</h2>
        <span className="text-xs text-muted-foreground">({wallets.length} wallet{wallets.length !== 1 ? 's' : ''})</span>
        <button onClick={refresh} disabled={loading} className="ml-auto text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-400/30 text-green-400 text-xs">
          <CheckCircle className="w-3 h-3" /> {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" /> {error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Action buttons */}
      {mode === 'idle' && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-400/40 bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Wallet
          </button>
          <button
            onClick={() => setMode('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 text-muted-foreground text-xs hover:text-foreground hover:border-border/70 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
        </div>
      )}

      {/* Create form */}
      {mode === 'create' && (
        <div className="rounded-lg border border-blue-400/30 bg-secondary/30 p-3 space-y-2">
          <p className="text-xs font-medium text-blue-400">New Agent Wallet</p>
          <input
            className="w-full rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-blue-400/60"
            placeholder="wallet-label (e.g. trader-1)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'devnet')}
            className="w-full rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm"
          >
            <option value="mainnet">Mainnet</option>
            <option value="devnet">Devnet</option>
          </select>
          <input
            type="password"
            className="w-full rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-blue-400/60"
            placeholder="Seed phrase (optional — leave empty for random)"
            value={seedPhrase}
            onChange={(e) => setSeedPhrase(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">⚠ Seed phrase uses SHA-256 derivation, not BIP39. For dev/agent use only.</p>
          <div className="flex gap-2">
            <button onClick={create} disabled={!label.trim()} className="px-3 py-1.5 rounded bg-blue-500/20 border border-blue-400/40 text-blue-400 text-xs hover:bg-blue-500/30 disabled:opacity-50">
              Generate
            </button>
            <button onClick={() => { setMode('idle'); setError(null) }} className="px-3 py-1.5 rounded border border-border/40 text-muted-foreground text-xs hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import form */}
      {mode === 'import' && (
        <div className="rounded-lg border border-purple-400/30 bg-secondary/30 p-3 space-y-2">
          <p className="text-xs font-medium text-purple-400">Import Keypair</p>
          <input
            className="w-full rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-purple-400/60"
            placeholder="wallet-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <textarea
            className="w-full rounded border border-border/50 bg-secondary/40 px-2 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-purple-400/60 resize-none"
            rows={2}
            placeholder="Base58 secret key"
            value={importKey}
            onChange={(e) => setImportKey(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={importWallet} disabled={!label.trim() || !importKey.trim()} className="px-3 py-1.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-400 text-xs hover:bg-purple-500/30 disabled:opacity-50">
              Import
            </button>
            <button onClick={() => { setMode('idle'); setError(null) }} className="px-3 py-1.5 rounded border border-border/40 text-muted-foreground text-xs hover:text-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Wallet list */}
      {wallets.length === 0 && mode === 'idle' ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center space-y-2">
            <Wallet className="w-10 h-10 opacity-20 mx-auto" />
            <p>No agent wallets yet — create one above</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {wallets.map((w) => (
            <li key={w.label} className="rounded-lg border border-border/30 bg-secondary/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="font-mono text-sm font-medium">{w.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded border ${w.network === 'devnet' ? 'border-yellow-400/30 text-yellow-400' : 'border-green-400/30 text-green-400'}`}>
                  {w.network}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(w.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="truncate flex-1">{w.publicKey}</span>
                <button onClick={() => copy(w.publicKey, `pub-${w.label}`)} className="flex-shrink-0 hover:text-foreground">
                  <Copy className={`w-3 h-3 ${copied === `pub-${w.label}` ? 'text-green-400' : ''}`} />
                </button>
                <a href={`https://solscan.io/account/${w.publicKey}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 hover:text-blue-400 text-xs">↗</a>
              </div>

              {revealedSecrets[w.label] && (
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-500/5 border border-red-400/20 rounded px-2 py-1">
                  <span className="truncate flex-1">{revealedSecrets[w.label]}</span>
                  <button onClick={() => copy(revealedSecrets[w.label], `sk-${w.label}`)} className="flex-shrink-0">
                    <Copy className={`w-3 h-3 ${copied === `sk-${w.label}` ? 'text-green-400' : ''}`} />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={() => toggleSecret(w.label)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  {revealedSecrets[w.label] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {revealedSecrets[w.label] ? 'Hide' : 'Export'} secret
                </button>
                <button
                  onClick={async () => {
                    const sk = await window.clawdAPI.wallet.exportSecret(w.label)
                    const blob = new Blob([sk], { type: 'text/plain' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `${w.label}-secret.txt`
                    a.click()
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-3 h-3" /> Backup
                </button>
                <button onClick={() => remove(w.label)} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
