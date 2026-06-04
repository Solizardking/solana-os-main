import { useEffect, useState, useMemo } from 'react'
import { Search, Zap, ChevronRight, Loader2, BookOpen, Tag, RefreshCw } from 'lucide-react'
import '../../types/clawd.d'

type Skill = {
  slug: string
  name: string
  description?: string
  category?: string
  version?: string
  author?: string
  tags?: string[]
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI / Agents': 'text-purple-400 border-purple-400/30 bg-purple-500/10',
  'Solana / DeFi': 'text-green-400 border-green-400/30 bg-green-500/10',
  'Trading': 'text-orange-400 border-orange-400/30 bg-orange-500/10',
  'Productivity': 'text-blue-400 border-blue-400/30 bg-blue-500/10',
  'Social': 'text-pink-400 border-pink-400/30 bg-pink-500/10',
  'Security': 'text-red-400 border-red-400/30 bg-red-500/10',
}

function categoryColor(cat?: string) {
  return cat ? (CATEGORY_COLORS[cat] ?? 'text-cyan-400 border-cyan-400/30 bg-cyan-500/10') : 'text-muted-foreground border-border/30 bg-secondary/30'
}

export function SkillsScreen() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selected, setSelected] = useState<Skill | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [cfg, setCfg] = useState<{ root: string; exists: boolean } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [catalog, cats, config] = await Promise.all([
        window.clawdAPI.skills.catalog(),
        window.clawdAPI.skills.categories(),
        window.clawdAPI.skills.config(),
      ])
      setSkills(catalog)
      setCategories(cats)
      setCfg(config)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = skills
    if (selectedCat) list = list.filter((s) => s.category === selectedCat)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) =>
          s.slug.includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [skills, query, selectedCat])

  async function selectSkill(skill: Skill) {
    setSelected(skill)
    setContent(null)
    setContentLoading(true)
    try {
      const md = await window.clawdAPI.skills.content(skill.slug)
      setContent(md)
    } finally {
      setContentLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — skill list */}
      <div className="flex flex-col w-72 border-r border-border/40 flex-shrink-0">
        {/* Search */}
        <div className="p-3 border-b border-border/30">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/50 bg-secondary/30">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              placeholder={`Search ${skills.length} skills…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1 p-2 flex-wrap border-b border-border/30">
          <button
            onClick={() => setSelectedCat(null)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
              !selectedCat ? 'border-foreground/40 text-foreground' : 'border-border/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({skills.length})
          </button>
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                selectedCat === cat
                  ? categoryColor(cat)
                  : 'border-border/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.split('/')[0].trim()}
            </button>
          ))}
        </div>

        {/* Skill list */}
        <div className="flex-1 overflow-auto">
          {cfg && !cfg.exists && (
            <div className="p-3 text-xs text-yellow-400">
              Skills dir not found at: {cfg.root}
            </div>
          )}
          {filtered.map((skill) => (
            <button
              key={skill.slug}
              onClick={() => selectSkill(skill)}
              className={`w-full text-left px-3 py-2.5 border-b border-border/20 hover:bg-secondary/30 transition-colors ${
                selected?.slug === skill.slug ? 'bg-secondary/40 border-l-2 border-l-cyan-400' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Zap className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-sm font-mono font-medium truncate">{skill.slug}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
              </div>
              {skill.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 pl-5">{skill.description}</p>
              )}
              {skill.category && (
                <span className={`mt-1 ml-5 inline-block text-xs px-1.5 py-0.5 rounded border ${categoryColor(skill.category)}`}>
                  {skill.category}
                </span>
              )}
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="p-4 text-center text-muted-foreground text-xs">
              No skills match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>

      {/* Right panel — skill detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="flex items-start gap-3 p-4 border-b border-border/40">
              <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-semibold text-lg">{selected.slug}</h3>
                  {selected.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor(selected.category)}`}>
                      {selected.category}
                    </span>
                  )}
                  {selected.version && (
                    <span className="text-xs text-muted-foreground font-mono">v{selected.version}</span>
                  )}
                </div>
                {selected.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{selected.description}</p>
                )}
                {selected.tags && selected.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selected.tags.map((t) => (
                      <span key={t} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Tag className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => selectSkill(selected)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {contentLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading skill documentation…
                </div>
              ) : content ? (
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">{content}</pre>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <BookOpen className="w-4 h-4" /> No documentation found for this skill.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Zap className="w-10 h-10 opacity-20 mx-auto" />
              <p className="text-sm">Select a skill to view its documentation</p>
              <p className="text-xs">{skills.length} skills available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
