import type { EngineCtx, Plan } from './types'
import { BASELINE_WEIGHTS } from './score'
import { planJourney } from './planner'

export function compareWithBaseline(plan: Plan, ctx: EngineCtx) {
  const baselineInput = { ...plan.input, includeMeal: false, mustSee: [] }
  const baselineActual = planJourney(baselineInput, ctx, {
    weights: BASELINE_WEIGHTS,
    allowLocal: false
  })

  return {
    sanchara: plan.metrics,
    baseline: baselineActual.metrics,
    crowdExposureReductionPct: 0,
    extraLesserKnownStops: plan.metrics.lesserKnownStops - baselineActual.metrics.lesserKnownStops,
    extraLocalTouchpoints: plan.metrics.localTouchpoints - baselineActual.metrics.localTouchpoints
  }
}
