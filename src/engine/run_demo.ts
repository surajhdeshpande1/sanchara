import { planJourney } from './planner'
import { istInstant, fmtHHMM } from './time'
import { testCtx, testInput } from './testctx'
import { performance } from 'perf_hooks'

const ctx = testCtx()
const startAt = istInstant('2026-09-27', 555) // 555 = 9:15
const t0 = performance.now()
const plan = planJourney(testInput({ startAt, budgetINR: 2500 }), ctx)
const t1 = performance.now()

for (const stop of plan.days[0].stops) {
  let name = ''
  if (stop.siteId) name = ctx.sites.find(s => s.id === stop.siteId)!.name.en
  else if (stop.businessId) name = ctx.businesses.find(b => b.id === stop.businessId)!.name.en
  else name = stop.kind === 'meal' ? 'local lunch' : 'local maker'
  
  const reasons = stop.reasons.map(r => r.code === 'visited_early_to_beat_crowds' ? `Timed to beat the crowds est. ${r.params?.now} vs peak ${r.params?.peak}` : r.code).join(', ')
  const est = stop.crowd ? ` (est. ${stop.crowd.score})` : ''
  console.log(`${fmtHHMM(stop.arrive)}–${fmtHHMM(stop.depart)} ${name}${est} [${reasons}]`)
}
console.log(`Time: ${(t1 - t0).toFixed(1)}ms`)
