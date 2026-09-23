import type { Business, CrowdEstimate, PlanInput, ScoreBreakdown, Site, Weights } from './types'
import { haversineKm } from './geo'

export const BASE_WEIGHTS: Weights = { interest: 0.30, crowdRelief: 0.20, novelty: 0.15, localImpact: 0.15, timeFit: 0.10, experience: 0.10 }
export const BASELINE_WEIGHTS: Weights = { interest: 0.45, crowdRelief: 0, novelty: 0, localImpact: 0, timeFit: 0.10, experience: 0.45 }

export function weightsFor(input: PlanInput, base: Weights = BASE_WEIGHTS): Weights {
  const w = { ...base }
  w.crowdRelief *= (0.5 + 1.5 * input.crowdAversion)
  w.localImpact *= (0.5 + 1.5 * input.localBoost)
  const sum = w.interest + w.crowdRelief + w.novelty + w.localImpact + w.timeFit + w.experience
  if (sum > 0) {
    w.interest /= sum; w.crowdRelief /= sum; w.novelty /= sum; w.localImpact /= sum; w.timeFit /= sum; w.experience /= sum;
  }
  return w
}

const INTEREST_TAGS: Record<string, Record<string, number>> = {
  architecture: { architecture: 1, 'rock-cut': 1, unesco: 0.8, temple: 0.7, fort: 0.6, jain: 0.5 },
  history: { history: 1, inscription: 1, museum: 0.9, unesco: 0.8, fort: 0.7, architecture: 0.5 },
  spiritual: { pilgrimage: 1, 'living-temple': 1, sharana: 1, temple: 0.7, jain: 0.6 },
  nature: { nature: 1, birds: 1, river: 0.8, lake: 0.8, viewpoint: 0.8, dam: 0.7, trek: 0.6 },
  food: { food: 1, market: 0.6 },
  handloom: { handloom: 1, craft: 1, gi: 0.8, market: 0.5 },
  photography: { photography: 1, sunset: 1, viewpoint: 1, lake: 0.6, architecture: 0.4 },
  hidden: { 'hidden-gem': 1 },
  family: { family: 1, garden: 1, dam: 0.6, easy: 0.5 },
}

export function interestMatch(site: Site, interests: string[]): number {
  if (!interests || interests.length === 0) return 60
  const matches: number[] = []
  for (const i of interests) {
    let best = 0
    if (i === 'hidden' && site.tier === 'hidden') best = 1
    const tags = INTEREST_TAGS[i] || {}
    for (const t of site.tags) {
      if (tags[t] > best) best = tags[t]
    }
    matches.push(best)
  }
  if (matches.length === 0) return 60
  const mean = matches.reduce((a, b) => a + b, 0) / matches.length
  const max = Math.max(...matches)
  return Math.round(100 * Math.min(1, 0.65 * mean + 0.35 * max))
}

export const NOVELTY: Record<string, number> = { hidden: 100, major: 60, anchor: 25 }

export function nearbyPartners(site: Site, businesses: Business[], radiusKm = 4) {
  let real = 0, demo = 0, list = 0
  for (const b of businesses) {
    if (b.category === 'stay') continue
    if (haversineKm(site.location, b.location) <= radiusKm) {
      const v = b.verification.status
      if (v === 'partner_verified' || v === 'gov_listed' || v === 'gi_registered') real++
      else if (b.isDemo) demo++
      else list++
    }
  }
  return { real, demo, list }
}

export function localImpactScore(site: Site, businesses: Business[]): number {
  const { real, demo } = nearbyPartners(site, businesses)
  return Math.min(100, 30 * real + 15 * demo + (site.kind === 'craft' ? 40 : 0))
}

export function timeFitScore(visitMin: number, remainingMin: number): number {
  if (remainingMin <= 0) return 0
  return Math.round(100 * Math.max(0, Math.min(1, 1 - (visitMin / remainingMin - 0.25) / 0.75)))
}

export function crowdRelief(score: number): number {
  return 100 - score - 1.5 * Math.max(0, score - 60)
}

export function scoreSite(site: Site, crowd: CrowdEstimate, input: PlanInput, businesses: Business[], remainingMin: number, weights: Weights): ScoreBreakdown {
  const sInterest = interestMatch(site, input.interests)
  const sCrowd = crowdRelief(crowd.score)
  const sNovel = NOVELTY[site.tier] ?? 0
  const sLocal = localImpactScore(site, businesses)
  const sTime = timeFitScore(site.visitMin, remainingMin)
  const sExp = site.experience
  const total = (
    sInterest * weights.interest +
    sCrowd * weights.crowdRelief +
    sNovel * weights.novelty +
    sLocal * weights.localImpact +
    sTime * weights.timeFit +
    sExp * weights.experience
  )
  return {
    interest: sInterest,
    crowdRelief: sCrowd,
    novelty: sNovel,
    localImpact: sLocal,
    timeFit: sTime,
    experience: sExp,
    total: Math.round(total * 10) / 10,
    weights
  }
}
