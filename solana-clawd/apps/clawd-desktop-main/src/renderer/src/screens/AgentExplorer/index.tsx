/**
 * Clawd Agent Explorer
 *
 * LM Studio-style browser for on-chain Solana agents registered via
 * Metaplex mpl-agent-registry. Four tabs:
 *   Explore   — browse & search recent on-chain agents
 *   My Agents — agents owned by a connected wallet
 *   Register  — registerIdentityV1 for an existing MPL Core asset
 *   Mint      — mintAndSubmitAgent (Core asset + identity in one tx)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  ChevronRight,
  Copy,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  Radar,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'
import '../../types/clawd.d'

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentItem = {
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
}

type Tab = 'explore' | 'mine' | 'register' | 'mint'
type SortKey = 'newest' | 'oldest' | 'active'

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortAddr(addr: string, n = 5) {
  if (!addr || addr.length <= n * 2 + 2) return addr
  return `${addr.slice(0, n)}…${addr.slice(-n)}`
}

function formatAge(blockTime: number | null): string {
  if (!blockTime) return 'just now'
  const secs = Math.max(1, Math.floor(Date.now() / 1000) - blockTime)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const PROMPT_NOISE = ['avatar for an ai agent', 'square composition', 'radar overlays']
function isNoisy(s: string | null | undefined): boolean {
  if (!s || s.length < 60) return false
  const l = s.toLowerCase()
  return PROMPT_NOISE.filter((h) => l.includes(h)).length >= 2
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

function AgentCard({
  item,
  selected,
  brokenSigs,
  onSelect,
  onMarkBroken,
  onCopy,
  copied,
}: {
  item: AgentItem
  selected: boolean
  brokenSigs: Set<string>
  onSelect: (item: AgentItem) => void
  onMarkBroken: (sig: string) => void
  onCopy: (v: string) => void
  copied: string | null
}) {
  const hasImg = item.image && !brokenSigs.has(item.signature)

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex flex-col rounded-xl border bg-card cursor-pointer transition-all duration-150 overflow-hidden
        ${selected
          ? 'border-[#14F195]/60 ring-1 ring-[#14F195]/30 bg-[#14F195]/5'
          : 'border-border/40 hover:border-[#14F195]/40 hover:bg-secondary/40'
        }`}
    >
      {/* Image strip */}
      <div className="relative h-24 bg-gradient-to-br from-[#9945FF]/20 via-[#14F195]/10 to-[#FF5F1F]/10 flex items-center justify-center">
        {hasImg ? (
          <img
            src={item.image!}
            alt={item.name ?? ''}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => onMarkBroken(item.signature)}
          />
        ) : (
          <Bot className="w-10 h-10 text-[#14F195]/40" />
        )}
        {/* Active badge */}
        {item.active === true && (
          <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#14F195]/20 border border-[#14F195]/40 text-[#14F195]">
            ACTIVE
          </span>
        )}
        {/* Solana rainbow bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#FF5F1F] opacity-60" />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="text-sm font-semibold text-foreground truncate">
          {item.name ?? 'Unnamed Agent'}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        {/* Address row */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground mt-0.5">
          <Bot className="w-3 h-3 text-[#14F195]/70 flex-shrink-0" />
          <span className="truncate">{shortAddr(item.assetAddress)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(item.assetAddress) }}
            className="ml-auto flex-shrink-0"
          >
            <Copy className={`w-3 h-3 ${copied === item.assetAddress ? 'text-[#14F195]' : 'text-muted-foreground hover:text-foreground'}`} />
          </button>
        </div>

        {/* Trust tags */}
        {item.supportedTrust && item.supportedTrust.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.supportedTrust.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#9945FF]/30 bg-[#9945FF]/5 text-[#9945FF]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" />
            {item.services.length} svc
          </span>
          <span>{formatAge(item.blockTime)}</span>
          <a
            href={`https://solscan.io/tx/${item.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:text-foreground flex items-center gap-0.5"
          >
            tx <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function AgentDetail({ item, brokenSigs, onClose, onCopy, copied }: {
  item: AgentItem
  brokenSigs: Set<string>
  onClose: () => void
  onCopy: (v: string) => void
  copied: string | null
}) {
  const hasImg = item.image && !brokenSigs.has(item.signature)

  const rows: Array<{ label: string; value: string; href?: string }> = [
    { label: 'Asset', value: item.assetAddress, href: `https://solscan.io/account/${item.assetAddress}` },
    { label: 'PDA', value: item.pda },
    { label: 'Signer Wallet', value: item.wallet, href: `https://solscan.io/account/${item.wallet}` },
    { label: 'Tx', value: item.signature, href: `https://solscan.io/tx/${item.signature}` },
    { label: 'Network', value: item.network },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-[#14F195]/30 bg-[#14F195]/5">
        {hasImg ? (
          <img src={item.image!} alt={item.name ?? ''} className="w-16 h-16 rounded-lg object-cover border border-border/40" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-[#14F195]/10 border border-border/40 flex items-center justify-center flex-shrink-0">
            <Bot className="w-8 h-8 text-[#14F195]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold truncate">{item.name ?? 'Unnamed Agent'}</h3>
            {item.active === true && (
              <span className="text-xs px-1.5 py-0.5 rounded-full border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]">ACTIVE</span>
            )}
            <button onClick={onClose} className="ml-auto text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>

      {/* Address table */}
      <div className="rounded-xl border border-border/40 overflow-hidden">
        <div className="px-3 py-2 bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-3 h-3" /> On-chain Identity
        </div>
        <div className="divide-y divide-border/30">
          {rows.filter((r) => r.value).map((r) => (
            <div key={r.label} className="flex items-center gap-2 px-3 py-2 text-xs font-mono hover:bg-secondary/20">
              <span className="text-muted-foreground w-24 flex-shrink-0">{r.label}</span>
              <span className="text-foreground truncate flex-1">{shortAddr(r.value, 8)}</span>
              <button onClick={() => onCopy(r.value)} className="flex-shrink-0">
                <Copy className={`w-3 h-3 ${copied === r.value ? 'text-[#14F195]' : 'text-muted-foreground hover:text-foreground'}`} />
              </button>
              {r.href && (
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      {item.services.length > 0 && (
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="px-3 py-2 bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3 h-3" /> Service Endpoints
          </div>
          <div className="divide-y divide-border/30">
            {item.services.map((svc, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/20">
                <span className="font-mono text-[#14F195] flex-shrink-0">{svc.name ?? 'service'}</span>
                {svc.version && <span className="text-muted-foreground font-mono">v{svc.version}</span>}
                {svc.endpoint && (
                  <a href={svc.endpoint} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground truncate flex-1 flex items-center gap-1 ml-2">
                    {svc.endpoint.length > 40 ? svc.endpoint.slice(0, 40) + '…' : svc.endpoint}
                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust */}
      {item.supportedTrust && item.supportedTrust.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.supportedTrust.map((t) => (
            <span key={t} className="text-xs font-mono px-2 py-1 rounded-lg border border-[#9945FF]/40 bg-[#9945FF]/10 text-[#9945FF]">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RegisterTab ───────────────────────────────────────────────────────────────

function RegisterTab() {
  const [assetAddr, setAssetAddr] = useState('')
  const [collectionAddr, setCollectionAddr] = useState('')
  const [registrationUri, setRegistrationUri] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  async function submit() {
    if (!assetAddr.trim() || !registrationUri.trim()) return
    setStatus('submitting')
    try {
      // Opens the Metaplex CLI docs / registration page in browser
      const url = `https://x402.wtf/agents/register?asset=${encodeURIComponent(assetAddr)}&uri=${encodeURIComponent(registrationUri)}`
      window.open(url, '_blank')
      setResult(`Registration page opened for asset ${shortAddr(assetAddr)}`)
      setStatus('done')
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed')
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="px-4 py-3 rounded-xl border border-[#9945FF]/30 bg-[#9945FF]/5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#9945FF]" />
          Register an Existing Agent
        </p>
        <p>Calls <code className="font-mono text-xs bg-secondary/60 px-1 rounded">registerIdentityV1</code> from Metaplex mpl-agent-registry to bind an EIP-8004 identity record to an MPL Core asset.</p>
      </div>

      <Field label="MPL Core Asset Address" required>
        <input
          className={inputCls}
          placeholder="e.g. 7GCi..."
          value={assetAddr}
          onChange={(e) => setAssetAddr(e.target.value)}
        />
      </Field>

      <Field label="Collection Address (optional)">
        <input
          className={inputCls}
          placeholder="Collection pubkey (if asset belongs to one)"
          value={collectionAddr}
          onChange={(e) => setCollectionAddr(e.target.value)}
        />
      </Field>

      <Field label="Agent Registration URI" required>
        <input
          className={inputCls}
          placeholder="https://arweave.net/…agent-registration.json"
          value={registrationUri}
          onChange={(e) => setRegistrationUri(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Permanent URL to your EIP-8004 JSON document. Upload to Arweave or IPFS first.
        </p>
      </Field>

      <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 text-xs font-mono space-y-1 text-muted-foreground">
        <p className="text-foreground font-semibold mb-2">CLI equivalent:</p>
        <p>mplx agents register \</p>
        <p className="pl-4">{assetAddr || '<ASSET_ADDRESS>'} \</p>
        {collectionAddr && <p className="pl-4">--collection {collectionAddr} \</p>}
        <p className="pl-4">--uri &quot;{registrationUri || '<REGISTRATION_URI>'}&quot;</p>
      </div>

      <button
        onClick={submit}
        disabled={status === 'submitting' || !assetAddr.trim() || !registrationUri.trim()}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#9945FF]/20 border border-[#9945FF]/50 text-[#9945FF] text-sm font-medium hover:bg-[#9945FF]/30 disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        Register Agent on Solana
      </button>

      {result && (
        <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${status === 'error' ? 'border-red-400/40 bg-red-500/10 text-red-400' : 'border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]'}`}>
          {result}
        </div>
      )}
    </div>
  )
}

// ── MintTab ───────────────────────────────────────────────────────────────────

function MintTab() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUri, setImageUri] = useState('')
  const [metadataUri, setMetadataUri] = useState('')
  const [collection, setCollection] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<string | null>(null)

  async function mint() {
    if (!name.trim() || !metadataUri.trim()) return
    setStatus('submitting')
    try {
      const params = new URLSearchParams({ name, uri: metadataUri })
      if (collection) params.set('collection', collection)
      window.open(`https://x402.wtf/agents/mint?${params}`, '_blank')
      setResult(`Mint page opened for "${name}"`)
      setStatus('done')
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed')
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="px-4 py-3 rounded-xl border border-[#FF5F1F]/30 bg-[#FF5F1F]/5 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF5F1F]" />
          Mint a New Agent
        </p>
        <p>Calls <code className="font-mono text-xs bg-secondary/60 px-1 rounded">mintAndSubmitAgent</code> — creates an MPL Core asset and registers its identity in a single transaction via the Clawd RPC + Helius.</p>
      </div>

      <Field label="Agent Name" required>
        <input className={inputCls} placeholder="e.g. HERMES-01" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Description">
        <textarea
          className={`${inputCls} resize-none h-16`}
          placeholder="What does this agent do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <Field label="Image URI">
        <input className={inputCls} placeholder="https://arweave.net/…image.png" value={imageUri} onChange={(e) => setImageUri(e.target.value)} />
      </Field>

      <Field label="Metadata URI" required>
        <input className={inputCls} placeholder="https://arweave.net/…metadata.json" value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">Arweave/IPFS URI for the off-chain EIP-8004 JSON document.</p>
      </Field>

      <Field label="Collection Address (optional)">
        <input className={inputCls} placeholder="MPL Core collection pubkey" value={collection} onChange={(e) => setCollection(e.target.value)} />
      </Field>

      <div className="rounded-xl border border-border/40 bg-secondary/20 p-3 text-xs font-mono space-y-1 text-muted-foreground">
        <p className="text-foreground font-semibold mb-2">CLI equivalent:</p>
        <p>mplx agents mint \</p>
        <p className="pl-4">--name &quot;{name || 'AGENT_NAME'}&quot; \</p>
        <p className="pl-4">--uri &quot;{metadataUri || 'METADATA_URI'}&quot; \</p>
        {collection && <p className="pl-4">--collection {collection} \</p>}
        <p className="pl-4">--register-identity</p>
      </div>

      <button
        onClick={mint}
        disabled={status === 'submitting' || !name.trim() || !metadataUri.trim()}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5F1F]/20 border border-[#FF5F1F]/50 text-[#FF5F1F] text-sm font-medium hover:bg-[#FF5F1F]/30 disabled:opacity-50 transition-colors"
      >
        {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Mint Agent on Solana
      </button>

      {result && (
        <div className={`text-xs font-mono px-3 py-2 rounded-lg border ${status === 'error' ? 'border-red-400/40 bg-red-500/10 text-red-400' : 'border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]'}`}>
          {result}
        </div>
      )}
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-[#14F195]/50"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-[#FF5F1F] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function AgentExplorerScreen() {
  const [tab, setTab] = useState<Tab>('explore')
  const [limit, setLimit] = useState(24)
  const [items, setItems] = useState<AgentItem[]>([])
  const [network, setNetwork] = useState('solana-mainnet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [brokenSigs, setBrokenSigs] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<AgentItem | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [showActive, setShowActive] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Filter + sort
  const filtered = useMemo(() => {
    let list = items.filter((item) => {
      if (brokenSigs.has(item.signature)) return false
      if (isNoisy(item.name) || isNoisy(item.description)) return false
      if (showActive && !item.active) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          item.name?.toLowerCase().includes(q) ||
          item.assetAddress.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
        )
      }
      return true
    })
    if (sortKey === 'newest') list = list.sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0))
    if (sortKey === 'oldest') list = list.sort((a, b) => (a.blockTime ?? 0) - (b.blockTime ?? 0))
    if (sortKey === 'active') list = list.sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
    return list
  }, [items, brokenSigs, search, sortKey, showActive])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.clawdAPI.metaplex.recentAgents(limit, true)
      setItems(result.items)
      setNetwork(result.network)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (tab === 'explore') {
      load()
      const id = setInterval(load, 30_000)
      return () => clearInterval(id)
    }
    return undefined
  }, [tab, load])

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(value)
    setTimeout(() => setCopied(null), 1200)
  }

  const markBroken = (sig: string) =>
    setBrokenSigs((prev) => {
      if (prev.has(sig)) return prev
      const n = new Set(prev); n.add(sig); return n
    })

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType; color: string }> = [
    { id: 'explore', label: 'Explore', icon: Radar, color: 'text-[#14F195]' },
    { id: 'mine', label: 'My Agents', icon: Wallet, color: 'text-[#9945FF]' },
    { id: 'register', label: 'Register', icon: Shield, color: 'text-[#9945FF]' },
    { id: 'mint', label: 'Mint', icon: Sparkles, color: 'text-[#FF5F1F]' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Radar className="w-5 h-5 text-[#14F195] animate-pulse flex-shrink-0" />
          <div>
            <h1 className="text-sm font-semibold">Clawd Agent Explorer</h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              Metaplex mpl-agent-registry · {network} · {filtered.length} agents
            </p>
          </div>

          {/* Tab bar */}
          <div className="ml-6 flex items-center gap-0.5 bg-secondary/40 rounded-lg p-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelected(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${tab === t.id ? `bg-background ${t.color} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {tab === 'explore' && (
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-secondary/40 border border-border/50 rounded-lg px-2 py-1.5 text-xs font-mono"
              >
                {[12, 24, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            )}
            {tab === 'explore' && (
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195] text-xs font-medium hover:bg-[#14F195]/20 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Refresh
              </button>
            )}
          </div>
        </div>

        {/* Search + filter bar (explore only) */}
        {tab === 'explore' && (
          <div className="flex items-center gap-2 px-4 pb-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                className="w-full rounded-lg border border-border/50 bg-secondary/30 pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:border-[#14F195]/50"
                placeholder="Search agents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-muted-foreground" />
              {(['newest', 'oldest', 'active'] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-2 py-1 rounded-md text-xs capitalize transition-colors
                    ${sortKey === k ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowActive((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${showActive ? 'bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/40' : 'text-muted-foreground hover:text-foreground border border-transparent'}`}
            >
              <Zap className="w-3 h-3" /> Active only
            </button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto">
        {tab === 'register' && (
          <div className="p-4"><RegisterTab /></div>
        )}
        {tab === 'mint' && (
          <div className="p-4"><MintTab /></div>
        )}
        {tab === 'mine' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-sm p-8 text-center">
            <Wallet className="w-10 h-10 text-[#9945FF]/40" />
            <p className="font-medium">Connect a Solana wallet to see your agents.</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Agents you own (via MPL Core) registered with mpl-agent-registry will appear here.
              Configure a wallet in Settings → Solana.
            </p>
            <button
              onClick={() => setTab('mint')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#9945FF]/40 bg-[#9945FF]/10 text-[#9945FF] text-xs hover:bg-[#9945FF]/20 transition-colors"
            >
              <Plus className="w-3 h-3" /> Mint your first agent
            </button>
          </div>
        )}

        {tab === 'explore' && (
          <div className="flex h-full">
            {/* Agent grid */}
            <div className={`flex-1 overflow-auto p-4 ${selected ? 'max-w-[60%]' : ''}`}>
              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg border border-red-400/40 bg-red-500/10 text-red-400 text-xs font-mono">
                  {error}
                </div>
              )}

              {loading && filtered.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-[#14F195]" />
                  Scanning Solana for registered agents…
                </div>
              )}

              {!loading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                  <Radar className="w-8 h-8 text-muted-foreground/40" />
                  No agents found{search ? ` matching "${search}"` : ''}.
                </div>
              )}

              <div className={`grid gap-3 ${selected ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                {filtered.map((item) => (
                  <AgentCard
                    key={item.signature}
                    item={item}
                    selected={selected?.signature === item.signature}
                    brokenSigs={brokenSigs}
                    onSelect={setSelected}
                    onMarkBroken={markBroken}
                    onCopy={copy}
                    copied={copied}
                  />
                ))}
              </div>

              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                  <button
                    onClick={() => { setLimit((l) => l + 24); load() }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-secondary/30 text-muted-foreground text-xs hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> Load more
                  </button>
                </div>
              )}
            </div>

            {/* Detail side panel */}
            {selected && (
              <div className="w-96 flex-shrink-0 border-l border-border/40 overflow-auto p-4">
                <AgentDetail
                  item={selected}
                  brokenSigs={brokenSigs}
                  onClose={() => setSelected(null)}
                  onCopy={copy}
                  copied={copied}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
