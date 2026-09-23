// The Estimated Crowd Index (MODEL).
// Deterministic popularity model bumped by real-time reports.
import type { Site, Instant, CrowdModel, CrowdEvent, CrowdScenario, CrowdOverride, CrowdReport, CrowdEstimate, CrowdLevel } from './types'
import { istParts } from './time'

export const REPORT_SCORE = { quiet: 18, normal: 45, busy: 76, packed: 93 }

export function levelOf(score: number, model: CrowdModel): CrowdLevel {
  if (score >= model.thresholds.veryHigh) return 'very_high'
  if (score >= model.thresholds.high) return 'high'
  if (score >= model.thresholds.moderate) return 'moderate'
  return 'low'
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function eventFactor(site: Site, at: Instant, events: CrowdEvent[]): number {
  const p = istParts(at)
  const md = `${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
  let maxF = 1
  for (const e of events) {
    if (e.siteIds.includes(site.id)) {
      if (e.from <= e.to) {
        if (md >= e.from && md <= e.to) maxF = Math.max(maxF, e.factor)
      } else {
        // Wraps around new year
        if (md >= e.from || md <= e.to) maxF = Math.max(maxF, e.factor)
      }
    }
  }
  return maxF
}

export function modelScore(site: Site, at: Instant, model: CrowdModel): number {
  const p = istParts(at)
  const wd = model.weekday[p.weekday] ?? 1
  const mm = model.month[p.m - 1] ?? 1
  const ef = eventFactor(site, at, model.events)
  const curve = model.hourly[site.crowdProfile] ?? model.hourly['monument']
  const h0 = p.hour
  const h1 = (h0 + 1) % 24
  const v0 = curve[h0]
  const v1 = curve[h1]
  const hourly = v0 + (v1 - v0) * (p.minute / 60)
  return clamp(Math.round(site.popularity * wd * mm * hourly * ef), 0, 100)
}

export function scenarioOverrides(scenario: CrowdScenario, windowMin = 120): CrowdOverride[] {
  // scenario.at is like '2026-09-27T12:30'
  const [date, time] = scenario.at.split('T')
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  // IST offset subtraction
  const at = Date.UTC(y, m - 1, d) - 330 * 60_000 + (hh * 60 + mm) * 60_000
  
  const overrides: CrowdOverride[] = []
  for (const [siteId, score] of Object.entries(scenario.overrides)) {
    overrides.push({
      siteId,
      score,
      from: at - 15 * 60_000,
      until: at + windowMin * 60_000,
      source: 'scenario'
    })
  }
  return overrides
}

export function estimateCrowd(
  site: Site,
  at: Instant,
  model: CrowdModel,
  overrides: CrowdOverride[] = [],
  reports: CrowdReport[] = []
): CrowdEstimate {
  let score = modelScore(site, at, model)
  let source: CrowdEstimate['source'] = 'model'
  let confidence = 0.55

  // Most recent applicable override (surge beats scenario, fallback to latest)
  let bestOverride: CrowdOverride | null = null
  for (const o of overrides) {
    if (o.siteId === site.id && at >= o.from && at <= o.until) {
      if (!bestOverride || (o.source === 'surge' && bestOverride.source !== 'surge') || (o.source === bestOverride.source && o.from > bestOverride.from)) {
        bestOverride = o
      }
    }
  }

  if (bestOverride) {
    score = bestOverride.score
    source = bestOverride.source
    confidence = 0.6
  }

  // Visitor reports from the 90 minutes before `at`
  const applicableReports = reports.filter(r => r.siteId === site.id && r.at <= at && r.at >= at - 90 * 60_000)
  if (applicableReports.length > 0) {
    let sumW = 0
    let sumWScore = 0
    for (const r of applicableReports) {
      const ageMin = (at - r.at) / 60_000
      const w = Math.pow(0.5, ageMin / 30)
      sumW += w
      sumWScore += w * REPORT_SCORE[r.level]
    }
    const reportScore = sumWScore / sumW
    const blend = Math.min(0.7, 0.25 * sumW)
    score = Math.round(score * (1 - blend) + reportScore * blend)
    source = 'reports'
    confidence = Math.min(0.85, 0.55 + 0.08 * applicableReports.length)
  }

  return {
    score,
    level: levelOf(score, model),
    confidence,
    source
  }
}

export function dayCurve(site: Site, dayStart: Instant, model: CrowdModel, overrides: CrowdOverride[] = [], reports: CrowdReport[] = []): { at: Instant; score: number }[] {
  const curve: { at: Instant; score: number }[] = []
  // 06:00 to 20:00 every 30 minutes
  for (let min = 6 * 60; min <= 20 * 60; min += 30) {
    const at = dayStart + min * 60_000
    curve.push({ at, score: estimateCrowd(site, at, model, overrides, reports).score })
  }
  return curve
}
