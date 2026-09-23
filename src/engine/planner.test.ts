// Step T3 — the journey planner and modelled impact. Run: npm test -- src/engine/planner.test.ts
import { describe, expect, it } from 'vitest'
import { compareWithBaseline } from './impact'
import { planJourney } from './planner'
import { crowdRelief } from './score'
import { istInstant, istParts } from './time'
import { testCtx, testInput } from './testctx'

const ctx = testCtx()
const siteById = new Map(ctx.sites.map((s) => [s.id, s]))

describe('journey planner', () => {
  const input = testInput()
  const plan = planJourney(input, ctx)
  const stops = plan.days[0].stops

  it('builds a feasible one-day plan with several stops', () => {
    expect(stops.filter((s) => s.kind === 'site').length).toBeGreaterThanOrEqual(3)
    const endLocal = istParts(plan.days[0].endAt).minuteOfDay
    expect(endLocal).toBeLessThanOrEqual(input.dayEndMin)
    expect(plan.totals.costINR).toBeLessThanOrEqual(input.budgetINR)
  })
  it('keeps times monotonic and respects opening hours', () => {
    for (let i = 1; i < stops.length; i++) expect(stops[i].arrive).toBeGreaterThanOrEqual(stops[i - 1].depart)
    for (const st of stops) {
      if (!st.siteId) continue
      const s = siteById.get(st.siteId)!
      const [oh, om] = s.hours.open.split(':').map(Number)
      const [ch, cm] = s.hours.close.split(':').map(Number)
      const startMin = istParts(st.start).minuteOfDay
      const endMin = istParts(st.depart).minuteOfDay
      expect(startMin).toBeGreaterThanOrEqual(oh * 60 + om)
      expect(endMin).toBeLessThanOrEqual(ch * 60 + cm)
    }
  })
  it('adds a local lunch between 12:15 and 14:30', () => {
    const meal = stops.find((s) => s.kind === 'meal')
    expect(meal).toBeTruthy()
    const m = istParts(meal!.start).minuteOfDay
    expect(m).toBeGreaterThanOrEqual(12 * 60 + 15)
    expect(m).toBeLessThanOrEqual(14 * 60 + 30)
  })
  it('never schedules strenuous sites for a moderate walker', () => {
    for (const st of stops) if (st.siteId) expect(siteById.get(st.siteId)!.walking).not.toBe('strenuous')
  })
  it('is deterministic', () => {
    expect(JSON.stringify(planJourney(input, ctx))).toBe(JSON.stringify(plan))
  })
  it('honours a must-see site', () => {
    const p = planJourney(testInput({ mustSee: ['kudalasangama'] }), ctx)
    expect(p.days[0].stops.some((s) => s.siteId === 'kudalasangama')).toBe(true)
  })
  it('penalises very busy slots more than linearly', () => {
    expect(crowdRelief(40)).toBe(60)
    expect(crowdRelief(80)).toBeLessThan(0)
    expect(crowdRelief(92)).toBeLessThan(crowdRelief(80))
  })
})

describe('modelled impact vs popular-first baseline', () => {
  it('visits more lesser-known places with lower crowd exposure', () => {
    const plan = planJourney(testInput({ startAt: istInstant('2026-09-27', 9 * 60) }), ctx)
    const cmp = compareWithBaseline(plan, ctx)
    expect(cmp.sanchara.lesserKnownShare).toBeGreaterThanOrEqual(cmp.baseline.lesserKnownShare)
    expect(cmp.sanchara.avgCrowdExposure).toBeLessThanOrEqual(cmp.baseline.avgCrowdExposure)
    expect(cmp.sanchara.localTouchpoints).toBeGreaterThan(cmp.baseline.localTouchpoints)
  })
})
