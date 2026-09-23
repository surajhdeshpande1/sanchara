import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CrowdOverride, CrowdReport, Plan, PlanDiff } from '../engine/types'
import type { Citation } from '../lib/data'
export interface PlanDraft {
  when: 'today' | 'tomorrow'
  days: number
  interests: string[]
  budgetINR: number
  party: number
  walking: string
  crowdAversion: number
  localBoost: number
  pace: string
  startSiteId: string
  startTime: string
  includeMeal: boolean
}


export type ChatRole = 'user' | 'sanchara'
export interface ChatMsg {
  id: string
  role: ChatRole
  text: string
  lang: string
  at: number
  citations?: Citation[]
  source?: string
  refusal?: boolean
}

export interface ScanRecord {
  id: string
  at: number
  siteId: string | null
  status: string
  confidence?: number
}

export interface AppState {
  lang: 'en' | 'kn' | 'hi'
  clientId: string
  simAt: number
  simSetAt: number
  scenarioId: string
  overrides: CrowdOverride[]
  reports: CrowdReport[]
  liveReports: CrowdReport[]
  stageRemoteAt: number
  forcedOffline: boolean
  stageEnabled: boolean
  draft: PlanDraft
  plan: Plan | null
  prevPlan: Plan | null
  lastDiff: PlanDiff | null
  scans: ScanRecord[]
  chats: Record<string, ChatMsg[]>
  
  setLang: (lang: 'en' | 'kn' | 'hi') => void
  setDraft: (draft: Partial<PlanDraft>) => void
  setPlan: (plan: Plan, prev?: Plan | null, diff?: PlanDiff | null) => void
  addScan: (scan: ScanRecord) => void
  pushChat: (siteKey: string, msg: ChatMsg) => void
  addReport: (report: CrowdReport) => void
  addOverride: (override: CrowdOverride) => void
  setLiveReports: (reports: CrowdReport[]) => void
  applyStage: (stage: { simAt: number; scenarioId: string; overrides: CrowdOverride[]; updatedAt: number }) => void
  setScenario: (id: string, overrides: CrowdOverride[], at: number) => void
  setSim: (at: number) => void
  setForcedOffline: (offline: boolean) => void
  enableStage: (enabled: boolean) => void
  resetDemo: () => void
}

export const DEFAULT_DRAFT: PlanDraft = {
  when: 'today',
  days: 1,
  interests: ['architecture', 'history'],
  budgetINR: 2500,
  party: 2,
  walking: 'moderate',
  crowdAversion: 0.7,
  localBoost: 0.6,
  pace: 'balanced',
  startSiteId: 'badami-caves',
  startTime: '08:30',
  includeMeal: true
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      lang: 'en',
      clientId: crypto.randomUUID(),
      simAt: 0,
      simSetAt: 0,
      scenarioId: '',
      overrides: [],
      reports: [],
      liveReports: [],
      stageRemoteAt: 0,
      forcedOffline: false,
      stageEnabled: false,
      draft: DEFAULT_DRAFT,
      plan: null,
      prevPlan: null,
      lastDiff: null,
      scans: [],
      chats: {},

      setLang: (lang) => {
        document.documentElement.lang = lang
        set({ lang })
      },
      setDraft: (d) => set((s) => ({ draft: { ...s.draft, ...d } })),
      setPlan: (plan, prev = null, diff = null) => set({ plan, prevPlan: prev, lastDiff: diff }),
      addScan: (scan) => set((s) => ({ scans: [scan, ...s.scans].slice(0, 30) })),
      pushChat: (siteKey, msg) => set((s) => ({ chats: { ...s.chats, [siteKey]: [...(s.chats[siteKey] || []), msg].slice(-40) } })),
      addReport: (report) => set((s) => ({ reports: [report, ...s.reports].slice(0, 60) })),
      addOverride: (ov) => set((s) => ({ overrides: [ov, ...s.overrides.filter(x => !(x.siteId === ov.siteId && x.source === ov.source))] })),
      setLiveReports: (liveReports) => set({ liveReports }),
      applyStage: (stage) => set({ simAt: stage.simAt, simSetAt: Date.now(), scenarioId: stage.scenarioId, overrides: stage.overrides, stageRemoteAt: stage.updatedAt }),
      setScenario: (scenarioId, overrides, at) => set({ scenarioId, overrides, simAt: at, simSetAt: Date.now() }),
      setSim: (at) => set({ simAt: at, simSetAt: Date.now() }),
      setForcedOffline: (forcedOffline) => set({ forcedOffline }),
      enableStage: (stageEnabled) => set({ stageEnabled }),
      resetDemo: () => set({ simAt: 0, simSetAt: 0, scenarioId: '', overrides: [], reports: [], plan: null, prevPlan: null, lastDiff: null, scans: [], chats: {}, draft: DEFAULT_DRAFT })
    }),
    {
      name: 'sanchara-v2',
      version: 1,
      partialize: (s) => ({
        lang: s.lang,
        clientId: s.clientId,
        simAt: s.simAt,
        simSetAt: s.simSetAt,
        scenarioId: s.scenarioId,
        overrides: s.overrides,
        reports: s.reports,
        stageEnabled: s.stageEnabled,
        draft: s.draft,
        plan: s.plan,
        prevPlan: s.prevPlan,
        lastDiff: s.lastDiff,
        scans: s.scans,
        chats: s.chats
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        draft: { ...DEFAULT_DRAFT, ...(persistedState?.draft || {}) }
      }),
      onRehydrateStorage: () => (state) => {
        if (state) document.documentElement.lang = state.lang
      }
    }
  )
)

export function nowFrom(state: AppState) {
  return state.simAt ? state.simAt + (Date.now() - state.simSetAt) : Date.now()
}

export function newId() {
  return crypto.randomUUID()
}
