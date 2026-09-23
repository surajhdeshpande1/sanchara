import { createContext, useContext, useMemo } from 'react'
import type { Business, Site } from '../engine/types'
type MatrixRecord = any;
import { useStore } from '../state/store'

export interface Fact { id: string; siteId: string; text: any; order: number; tags: string[]; sources: string[] }
export interface Story { id: string; siteId: string; title: any; text: any; type: string }
export interface FaqItem { id: string; siteId: string; q: any; a: any }
export interface Source { id: string; publisher: any; title: any; url: string; tier: string }
export interface GlossaryTerm { id: string; term: any; def: any; audio?: string }
export interface Citation { factId: string; sourceId: string; publisher: any; url: string; tier: string }

export interface Datasets {
  sites: Site[]
  siteById: Map<string, Site>
  businesses: Business[]
  bizById: Map<string, Business>
  matrix: MatrixRecord[]
  crowd: Record<string, any>
  facts: Fact[]
  stories: Story[]
  faq: FaqItem[]
  sources: Source[]
  sourceById: Map<string, Source>
  audio: Record<string, string>
  glossary: GlossaryTerm[]
}

export interface RawData {
  sites: Site[]
  businesses: Business[]
  matrix: MatrixRecord[]
  crowd: Record<string, any>
  facts: Fact[]
  stories: Story[]
  faq: FaqItem[]
  sources: Source[]
  audio?: Record<string, string>
  glossary?: GlossaryTerm[]
}

export function buildDatasets(raw: RawData): Datasets {
  return {
    sites: raw.sites || [],
    siteById: new Map((raw.sites || []).map(s => [s.id, s])),
    businesses: raw.businesses || [],
    bizById: new Map((raw.businesses || []).map(b => [b.id, b])),
    matrix: raw.matrix || [],
    crowd: raw.crowd || {},
    facts: raw.facts || [],
    stories: raw.stories || [],
    faq: raw.faq || [],
    sources: raw.sources || [],
    sourceById: new Map((raw.sources || []).map(s => [s.id, s])),
    audio: raw.audio || {},
    glossary: raw.glossary || []
  }
}

export async function loadDatasets(): Promise<Datasets> {
  const fetchJson = async (p: string, opt = false) => {
    try {
      const r = await fetch(p)
      if (!r.ok) throw new Error(`Failed ${p}`)
      return await r.json()
    } catch (e) {
      if (opt) return null
      throw e
    }
  }
  const [sites, businesses, matrix, crowd, facts, stories, faq, sources, audio, glossary] = await Promise.all([
    fetchJson('/data/sites.json'),
    fetchJson('/data/businesses.json'),
    fetchJson('/data/matrix.json'),
    fetchJson('/data/crowd.json'),
    fetchJson('/data/facts.json'),
    fetchJson('/data/stories.json'),
    fetchJson('/data/faq.json'),
    fetchJson('/data/sources.json'),
    fetchJson('/data/audio.json', true),
    fetchJson('/data/glossary.json', true)
  ])
  return buildDatasets({ sites, businesses, matrix, crowd, facts, stories, faq, sources, audio: audio || {}, glossary: glossary || [] })
}

export const DataContext = createContext<Datasets | null>(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('Missing DataContext')
  return ctx
}

export function useReports() {
  return useStore(s => s.reports)
}

const NONE: any[] = []
export function useEngineCtx() {
  const data = useData()
  const overrides = useStore(s => s.overrides)
  const reports = useReports()
  return useMemo(() => ({
    sites: data.sites,
    businesses: data.businesses,
    matrix: data.matrix,
    crowd: data.crowd,
    overrides: overrides || NONE,
    reports: reports || NONE
  }), [data, overrides, reports])
}
