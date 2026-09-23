// Sanchara domain types. Mirror of data/*.json — see docs/SPEC.md §3 (data model).
export type Lang = 'en' | 'kn' | 'hi'
export type L10n = { en: string; kn?: string; hi?: string }
export type Instant = number // epoch milliseconds; all display is in IST (UTC+05:30)

export type SiteKind = 'heritage' | 'spiritual' | 'nature' | 'craft' | 'museum'
export type Walking = 'easy' | 'moderate' | 'strenuous'
export type Tier = 'anchor' | 'major' | 'hidden'
export type CrowdProfile = 'monument' | 'temple' | 'nature' | 'museum' | 'market'
export type CrowdLevel = 'low' | 'moderate' | 'high' | 'very_high'
export type LatLng = { lat: number; lng: number }

export interface SiteImage {
  src: string
  credit: string
  license: string
  sourceUrl: string
}

export interface Site {
  id: string
  name: L10n
  short: L10n
  kind: SiteKind
  tags: string[]
  cluster: string
  taluk: string
  district: string
  scope: 'district' | 'border' // 'border' = outside Bagalkot but listed by the district tourism portal (e.g. Almatti)
  plannable: boolean // false for sub-sites (e.g. Virupaksha inside Pattadakal)
  parentId?: string
  location: LatLng
  coordVerified: boolean
  geofenceM: number
  tier: Tier
  popularity: number // 0-100: typical peak-hour crowd level on an ordinary weekday
  crowdProfile: CrowdProfile
  experience: number // 0-100: curated experience quality
  visitMin: number
  walking: Walking
  hours: { open: string; close: string; closedWeekdays?: number[]; verified: boolean; note?: L10n }
  fee?: { indianINR: number; foreignINR?: number; verified: boolean; note?: string }
  recognition?: { tier: 'hero' | 'supported'; signature: string; confusableWith?: string[] }
  images?: SiteImage[]
}

export type BizCategory = 'artisan' | 'food' | 'stay' | 'shop' | 'experience'
export type Verification =
  | 'demo'
  | 'unverified'
  | 'map_listed'
  | 'partner_verified'
  | 'gov_listed'
  | 'gi_registered'

export interface Business {
  id: string
  name: L10n
  category: BizCategory
  subcategory?: string
  town: string
  cluster: string
  location: LatLng
  priceBand: 1 | 2 | 3
  typicalSpendINR: number // per person
  visitMin: number
  hours?: { open: string; close: string }
  offers: L10n[]
  verification: { status: Verification; by?: string; at?: string; evidence?: string }
  isDemo: boolean
  sourceIds?: string[]
  contact?: { phone?: string; whatsapp?: string; url?: string }
}

export interface RouteMatrix {
  method: 'estimate' | 'heigit'
  profile: string
  generatedAt: string
  ids: string[]
  durationsMin: number[][]
  distancesKm: number[][]
}

export interface CrowdEvent {
  id: string
  name: L10n
  siteIds: string[]
  from: string // MM-DD inclusive
  to: string // MM-DD inclusive (may wrap the year)
  factor: number
  verified: boolean
  note?: string
}

export interface CrowdScenario {
  id: string
  label: L10n
  at: string // local IST wall clock, e.g. "2026-09-27T12:30"
  overrides: Record<string, number>
}

export interface CrowdModel {
  version: string
  thresholds: { moderate: number; high: number; veryHigh: number }
  weekday: number[] // 0=Sun … 6=Sat
  month: number[] // Jan … Dec
  hourly: Record<CrowdProfile, number[]> // 24 values, 1.0 = typical peak
  events: CrowdEvent[]
  scenarios: CrowdScenario[]
}

export interface CrowdOverride {
  siteId: string
  score: number
  from: Instant
  until: Instant
  source: 'scenario' | 'surge'
}

export interface CrowdReport {
  siteId: string
  level: 'quiet' | 'normal' | 'busy' | 'packed'
  at: Instant
}

export interface CrowdEstimate {
  score: number
  level: CrowdLevel
  confidence: number
  source: 'model' | 'scenario' | 'surge' | 'reports'
}

export type Interest =
  | 'architecture'
  | 'history'
  | 'spiritual'
  | 'nature'
  | 'food'
  | 'handloom'
  | 'photography'
  | 'hidden'
  | 'family'

export interface PlanInput {
  start: { siteId?: string; label: string; location: LatLng }
  startAt: Instant
  days: number
  dayStartMin: number // minutes after midnight for day 2+
  dayEndMin: number // latest return time each day
  budgetINR: number // whole group, whole trip
  party: number
  interests: Interest[]
  walking: Walking
  crowdAversion: number // 0..1
  localBoost: number // 0..1
  mustSee: string[]
  exclude: string[]
  includeMeal: boolean
  transportINRPerKm: number
  pace: 'relaxed' | 'balanced' | 'packed' // max 4 / 5 / 7 sites per day
}

export interface ScoreBreakdown {
  interest: number
  crowdRelief: number
  novelty: number
  localImpact: number
  timeFit: number
  experience: number
  total: number
  weights: Weights
}

export interface Weights {
  interest: number
  crowdRelief: number
  novelty: number
  localImpact: number
  timeFit: number
  experience: number
}

export type ReasonCode =
  | 'interest_match'
  | 'quiet_now'
  | 'visited_early_to_beat_crowds'
  | 'hidden_gem'
  | 'unesco'
  | 'must_see'
  | 'local_partners_nearby'
  | 'short_detour'
  | 'local_lunch'
  | 'local_craft'

export interface Reason {
  code: ReasonCode
  params?: Record<string, string | number>
}

export interface PlannedStop {
  kind: 'site' | 'meal' | 'local'
  siteId?: string
  businessId?: string
  location: LatLng
  arrive: Instant
  start: Instant
  depart: Instant
  waitMin: number
  travelMin: number
  travelKm: number
  costINR: number
  crowd?: CrowdEstimate
  score?: ScoreBreakdown
  reasons: Reason[]
}

export interface DayPlan {
  index: number
  stops: PlannedStop[]
  returnMin: number
  endAt: Instant
  stayBusinessId?: string
}

export type TraceEvent =
  | { type: 'skipped'; siteId: string; why: 'closed' | 'walking' | 'budget' | 'time' | 'excluded' }
  | { type: 'crowd_timeshift'; siteId: string; crowdAtPeak: number; crowdAtVisit: number }
  | { type: 'rebalance'; removed: string[]; added: string[]; moved: string[] }

export interface ImpactMetrics {
  stops: number
  heritageStops: number
  lesserKnownStops: number
  lesserKnownShare: number // 0..1
  localTouchpoints: number
  verifiedLocalTouchpoints: number
  potentialLocalSpendINR: number
  avgCrowdExposure: number // 0..100, estimated crowd at the time of each visit
  distanceKm: number
  travelMin: number
  kindsCovered: number
}

export interface Plan {
  id: string
  version: 1
  createdAt: Instant
  input: PlanInput
  days: DayPlan[]
  totals: { costINR: number; transportINR: number; distanceKm: number; travelMin: number }
  metrics: ImpactMetrics
  trace: TraceEvent[]
  objective: number
}

export interface PlanDiff {
  removed: string[]
  added: string[]
  moved: string[] // same site, start time shifted >= 30 min
  kept: string[]
  strategy: 'retime' | 'replan' // same places in a new order, or places swapped
  exposureBefore: number // old plan's remaining stops, re-estimated under the current crowd context
  exposureAfter: number // new plan's remaining stops, same context
}

export interface EngineCtx {
  sites: Site[]
  businesses: Business[]
  matrix: RouteMatrix
  crowd: CrowdModel
  overrides: CrowdOverride[]
  reports: CrowdReport[]
}
