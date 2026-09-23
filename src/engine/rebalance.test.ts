// Step T4 — rebalancing around crowd pressure. Run: npm test -- src/engine/rebalance.test.ts
import { describe, expect, it } from 'vitest'
import { scenarioOverrides } from './crowd'
import { planJourney, rebalance } from './planner'
import { istInstant } from './time'
import { testCtx, testInput } from './testctx'

const ctx = testCtx()

describe('rebalance under crowd pressure', () => {
  it('re-plans around a surge at the next stop and keeps what was already visited', () => {
    const sundayInput = testInput({ startAt: istInstant('2026-09-27', 9 * 60) })
    const calm = planJourney(sundayInput, ctx)
    const now = istInstant('2026-09-27', 10 * 60 + 45)
    const next = calm.days[0].stops.find((s) => s.kind === 'site' && s.start > now)!
    const surge = testCtx({
      overrides: [{ siteId: next.siteId!, score: 92, from: now, until: now + 3 * 3600_000, source: 'surge' }],
    })
    const { plan, diff } = rebalance(calm, now, surge)
    const done = calm.days[0].stops.filter((s) => s.start <= now).map((s) => s.siteId ?? s.businessId)
    const kept = plan.days[0].stops.slice(0, done.length).map((s) => s.siteId ?? s.businessId)
    expect(kept).toEqual(done)
    expect(diff.removed.includes(next.siteId!) || diff.moved.includes(next.siteId!)).toBe(true)
    for (const st of plan.days[0].stops.filter((s) => s.kind === 'site' && s.start > now)) {
      expect(st.crowd!.score).toBeLessThan(92)
    }
  })
  it('tries the smallest change first: same places, new order, surged site moved out of the rush', () => {
    const calm = planJourney(testInput({ startAt: istInstant('2026-09-27', 9 * 60 + 15), budgetINR: 2500 }), ctx)
    const now = istInstant('2026-09-27', 10 * 60 + 45)
    const upcoming = calm.days[0].stops.filter((s) => s.kind === 'site' && s.start > now)
    const pop = (id?: string) => ctx.sites.find((x) => x.id === id)!.popularity
    const big = [...upcoming].sort((a, b) => pop(b.siteId) - pop(a.siteId))[0]
    const until = now + 3 * 3600_000
    const { plan, diff } = rebalance(calm, now, testCtx({ overrides: [{ siteId: big.siteId!, score: 92, from: now, until, source: 'surge' }] }))
    expect(diff.strategy).toBe('retime')
    expect(diff.removed).toEqual([])
    expect(diff.added).toEqual([])
    expect(diff.moved).toContain(big.siteId)
    const moved = plan.days[0].stops.find((s) => s.siteId === big.siteId)!
    expect(moved.start).toBeGreaterThanOrEqual(until)
    expect(moved.crowd!.score).toBeLessThan(70)
    expect(diff.exposureAfter).toBeLessThan(diff.exposureBefore)
    expect(plan.days[0].stops.some((s) => s.kind === 'meal')).toBe(true) // lunch survives the rebalance
  })
  it('applies the Sunday 12:30 scenario without breaking feasibility', () => {
    const calm = planJourney(testInput({ startAt: istInstant('2026-09-27', 9 * 60) }), ctx)
    const surge = testCtx({ overrides: scenarioOverrides(ctx.crowd.scenarios.find((x) => x.id === 'sunday-1230')!) })
    const { plan } = rebalance(calm, istInstant('2026-09-27', 12 * 60 + 30), surge)
    const stops = plan.days[0].stops
    for (let i = 1; i < stops.length; i++) expect(stops[i].arrive).toBeGreaterThanOrEqual(stops[i - 1].depart)
  })
})
