// Step T2 — crowd model and IST time. Run: npm test -- src/engine/crowd.test.ts
import { describe, expect, it } from 'vitest'
import { estimateCrowd, levelOf, modelScore, scenarioOverrides } from './crowd'
import { istInstant } from './time'
import { testCtx } from './testctx'

const ctx = testCtx()
const siteById = new Map(ctx.sites.map((s) => [s.id, s]))

describe('crowd model', () => {
  it('is busier on Sunday noon than Tuesday morning at Badami caves', () => {
    const s = siteById.get('badami-caves')!
    const sunday = modelScore(s, istInstant('2026-09-27', 12 * 60 + 30), ctx.crowd)
    const tuesday = modelScore(s, istInstant('2026-09-22', 8 * 60 + 30), ctx.crowd)
    expect(sunday).toBeGreaterThan(tuesday + 30)
    expect(levelOf(sunday, ctx.crowd)).not.toBe('low')
  })
  it('applies demo scenario overrides only around the scenario time', () => {
    const s = siteById.get('badami-caves')!
    const ov = scenarioOverrides(ctx.crowd.scenarios.find((x) => x.id === 'sunday-1230')!)
    const at = istInstant('2026-09-27', 12 * 60 + 30)
    expect(estimateCrowd(s, at, ctx.crowd, ov).score).toBe(88)
    expect(estimateCrowd(s, istInstant('2026-09-27', 8 * 60), ctx.crowd, ov).source).toBe('model')
  })
  it('lets fresh visitor reports pull the estimate', () => {
    const s = siteById.get('mahakuta')!
    const at = istInstant('2026-09-22', 11 * 60)
    const base = estimateCrowd(s, at, ctx.crowd).score
    const est = estimateCrowd(s, at, ctx.crowd, [], [
      { siteId: 'mahakuta', level: 'packed', at: at - 5 * 60_000 },
      { siteId: 'mahakuta', level: 'packed', at: at - 10 * 60_000 },
    ])
    expect(est.score).toBeGreaterThan(base)
    expect(est.source).toBe('reports')
  })
})
