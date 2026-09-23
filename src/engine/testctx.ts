// Test helper: build an EngineCtx from the canonical datasets in public/data.
import sitesJson from '../../public/data/sites.json'
import bizJson from '../../public/data/businesses.json'
import routesJson from '../../public/data/routes.json'
import crowdJson from '../../public/data/crowd.json'
import type { Business, CrowdModel, EngineCtx, PlanInput, RouteMatrix, Site } from './types'
import { istInstant } from './time'

export function testCtx(partial: Partial<EngineCtx> = {}): EngineCtx {
  return {
    sites: sitesJson.sites as unknown as Site[],
    businesses: bizJson.businesses as unknown as Business[],
    matrix: routesJson as unknown as RouteMatrix,
    crowd: crowdJson as unknown as CrowdModel,
    overrides: [],
    reports: [],
    ...partial,
  }
}

export function testInput(over: Partial<PlanInput> = {}): PlanInput {
  const sites = sitesJson.sites as unknown as Site[]
  const start = sites.find((s) => s.id === 'badami-caves')!
  return {
    start: { siteId: start.id, label: 'Badami', location: start.location },
    startAt: istInstant('2026-09-22', 8 * 60 + 30), // Tuesday 08:30 IST
    days: 1,
    dayStartMin: 8 * 60,
    dayEndMin: 18 * 60 + 30,
    budgetINR: 3000,
    party: 2,
    interests: ['architecture', 'history'],
    walking: 'moderate',
    crowdAversion: 0.7,
    localBoost: 0.6,
    mustSee: [],
    exclude: [],
    includeMeal: true,
    transportINRPerKm: 14,
    pace: 'balanced',
    ...over,
  }
}
