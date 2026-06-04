import { useEffect, useState } from 'react'
import {
  Wallet,
  RefreshCw,
  Loader2,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Coins,
  Activity,
} from 'lucide-react'
import '../../types/clawd.d'

const CLAWD_TOKEN = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump'

type Asset = {
  id: string
  content?: { metadata?: { name?: string; symbol?: string }; links?: { image?: string } }
  token_info?: { balance?: number; decimals?: number; price_info?: { price_per_token?: number; currency?: string } }
  interface?: string
}

type PortfolioItem = {
  address: string
  symbol: string
  name: string
  logoURI?: string
  balance: number
  uiAmount: number
  priceUsd: number
  valueUsd: number
}

function shortAddr(addr: string, n = 6) {
  if (!addr || addr.length <= n * 2) return addr
  return `${addr.slice(0, n)}…${addr.slice(-n)}`
}

function formatAge(ts: number) {
  const secs = Math.max(1, Math.floor(Date.now() / 1000) - ts)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export function SolanaScreen() {
  const [address, setAddress] = useState('')
  const [input, setInput] = useState('')
  const [sol, setSol] = useState<number | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [txHistory, setTxHistory] = useState<Array<{ signature: string; blockTime: number; err: null | unknown }>>([])
  const [clawdPrice, setClawdPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cfg, setCfg] = useState<{ hasHelius: boolean; hasBirdeye: boolean } | null>(null)

  useEffect(() => {
    window.clawdAPI?.helius.config().then(setCfg).catch(() => {})
    window.clawdAPI?.helius.getTokenPrice(CLAWD_TOKEN).then((p) => setClawdPrice(p?.value ?? null)).catch(() => {})
  }, [])

  async function load(addr: string) {
    if (!addr.trim()) return
    setLoading(true)
    setAddress(addr.trim())
    try {
      const [bal, assetsData, txs, port] = await Promise.allSettled([
        window.clawdAPI.helius.getBalances(addr),
        window.clawdAPI.helius.getAssets(addr),
        window.clawdAPI.helius.getTransactionHistory(addr, 15),
        window.clawdAPI.helius.getWalletPortfolio(addr),
      ])

      if (bal.status === 'fulfilled') setSol(bal.value.lamports / 1e9)

      if (assetsData.status === 'fulfilled') {
        const result = assetsData.value as { items?: Asset[] }
        setAssets(result?.items ?? [])
      }

      if (txs.status === 'fulfilled') setTxHistory(txs.value)

      if (port.status === 'fulfilled' && port.value) {
        const portResult = port.value as { data?: { items?: PortfolioItem[] } }
        setPortfolio(portResult?.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const totalValueUsd = portfolio.reduce((sum, t) => sum + (t.valueUsd ?? 0), 0)

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Wallet className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold">Solana Explorer</h2>
        {cfg && (
          <div className="ml-auto flex gap-2 text-xs text-muted-foreground">
            <span className={cfg.hasHelius ? 'text-green-400' : 'text-red-400'}>
              {cfg.hasHelius ? '● Helius' : '○ Helius'}
            </span>
            <span className={cfg.hasBirdeye ? 'text-green-400' : 'text-yellow-400'}>
              {cfg.hasBirdeye ? '● Birdeye' : '○ Birdeye'}
            </span>
          </div>
        )}
      </div>

      {/* $CLAWD ticker */}
      {clawdPrice !== null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 border border-border/40 text-sm">
          <Coins className="w-4 h-4 text-purple-400" />
          <span className="text-muted-foreground">$CLAWD</span>
          <span className="font-mono font-semibold text-foreground">
            ${clawdPrice < 0.01 ? clawdPrice.toFixed(8) : clawdPrice.toFixed(4)}
          </span>
          <a
            href={`https://dexscreener.com/solana/${CLAWD_TOKEN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            DexScreener <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Address input */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border/50 bg-secondary/40 px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:border-green-400/60"
          placeholder="Paste Solana wallet address…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(input)}
        />
        <button
          onClick={() => load(input)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-400/40 text-green-400 text-sm hover:bg-green-500/30 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Load
        </button>
      </div>

      {address && (
        <>
          {/* Wallet summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">SOL Balance</p>
              <p className="text-xl font-mono font-semibold text-green-400">
                {sol !== null ? sol.toFixed(4) : '—'}
              </p>
              <p className="text-xs text-muted-foreground">≈ ${sol ? (sol * 150).toFixed(2) : '—'}</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">Tokens</p>
              <p className="text-xl font-mono font-semibold">{assets.length}</p>
              <p className="text-xs text-muted-foreground">NFTs + fungible</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">Portfolio Value</p>
              <p className="text-xl font-mono font-semibold text-blue-400">
                ${totalValueUsd.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">via Birdeye</p>
            </div>
          </div>

          {/* Address row */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/20 border border-border/30 text-xs font-mono">
            <span className="text-muted-foreground">address</span>
            <span className="text-foreground truncate">{address}</span>
            <button onClick={() => copy(address)} className="ml-auto text-muted-foreground hover:text-foreground">
              <Copy className={`w-3 h-3 ${copied ? 'text-green-400' : ''}`} />
            </button>
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Portfolio tokens */}
          {portfolio.length > 0 && (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3 h-3" /> Token Portfolio
              </div>
              <div className="divide-y divide-border/30 max-h-48 overflow-auto">
                {portfolio.map((tok) => (
                  <div key={tok.address} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary/20">
                    {tok.logoURI && (
                      <img src={tok.logoURI} alt={tok.symbol} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tok.symbol || tok.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{shortAddr(tok.address)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs">{tok.uiAmount?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">${tok.valueUsd?.toFixed(2)}</p>
                    </div>
                    {tok.priceUsd > 0 && (
                      <div className="text-xs text-muted-foreground flex items-center">
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction history */}
          {txHistory.length > 0 && (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="px-3 py-2 bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Transactions
              </div>
              <div className="divide-y divide-border/30 max-h-56 overflow-auto">
                {txHistory.map((tx) => (
                  <div key={tx.signature} className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-secondary/20">
                    {tx.err ? (
                      <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-foreground truncate flex-1">{shortAddr(tx.signature, 8)}</span>
                    <span className="text-muted-foreground flex-shrink-0">{formatAge(tx.blockTime)}</span>
                    <a
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!address && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Enter a Solana address above to explore wallet data via Helius + Birdeye
        </div>
      )}
    </div>
  )
}
