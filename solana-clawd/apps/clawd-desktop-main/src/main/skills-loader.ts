/**
 * Clawd OS Skills Loader — reads the monorepo skills catalog and individual
 * skill markdown files, exposes them over IPC to the renderer.
 */
import { ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { app } from 'electron'

// In dev: resolve relative to the monorepo root (5 levels up from this file)
// In prod: bundled catalog is copied to resources/skills/
function skillsRoot(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'skills')
  }
  // dev: apps/clawd-desktop-main/src/main/skills-loader.ts → ../../../../skills
  return resolve(__dirname, '../../../../skills')
}

type SkillEntry = {
  slug: string
  name: string
  description?: string
  category?: string
  version?: string
  author?: string
  tags?: string[]
}

let _catalog: SkillEntry[] | null = null

async function loadCatalog(): Promise<SkillEntry[]> {
  if (_catalog) return _catalog
  const catalogPath = join(skillsRoot(), 'catalog.json')
  if (!existsSync(catalogPath)) return []
  try {
    const raw = await readFile(catalogPath, 'utf8')
    const parsed = JSON.parse(raw)
    _catalog = Array.isArray(parsed) ? parsed : (parsed.skills ?? [])
    return _catalog!
  } catch {
    return []
  }
}

async function loadSkillContent(slug: string): Promise<string | null> {
  const root = skillsRoot()
  // Skills are either a directory with skill.md or a standalone .md file
  const candidates = [
    join(root, slug, 'skill.md'),
    join(root, slug, 'README.md'),
    join(root, `${slug}.md`),
    join(root, slug, 'index.md'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      return readFile(p, 'utf8')
    }
  }
  return null
}

async function getSkillManifest(slug: string): Promise<unknown> {
  const root = skillsRoot()
  const candidates = [
    join(root, slug, 'skill.json'),
    join(root, slug, 'manifest.json'),
    join(root, slug, 'package.json'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        return JSON.parse(await readFile(p, 'utf8'))
      } catch {
        return null
      }
    }
  }
  return null
}

export function registerSkillsHandlers(): void {
  ipcMain.handle('skills:catalog', () => loadCatalog())

  ipcMain.handle('skills:content', (_e, slug: string) => loadSkillContent(slug))

  ipcMain.handle('skills:manifest', (_e, slug: string) => getSkillManifest(slug))

  ipcMain.handle('skills:search', async (_e, query: string) => {
    const catalog = await loadCatalog()
    if (!query.trim()) return catalog
    const q = query.toLowerCase()
    return catalog.filter(
      (s) =>
        s.slug.includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
    )
  })

  ipcMain.handle('skills:categories', async () => {
    const catalog = await loadCatalog()
    const cats = new Set(catalog.map((s) => s.category ?? 'Uncategorized'))
    return [...cats].sort()
  })

  ipcMain.handle('skills:config', () => ({
    root: skillsRoot(),
    exists: existsSync(skillsRoot()),
    isPackaged: app.isPackaged,
  }))
}
