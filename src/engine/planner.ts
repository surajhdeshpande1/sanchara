import type { Business, DayPlan, EngineCtx, ImpactMetrics, LatLng, Plan, PlanInput, PlannedStop, Reason, ReasonCode, Site, TraceEvent, Weights } from './types'
import { TravelOracle } from './matrix'
import { estimateCrowd } from './crowd'
import { scoreSite, weightsFor, nearbyPartners } from './score'
import { hhmmToMin, istParts, addMin } from './time'
import { haversineKm } from './geo'

export const MAX_WAIT_MIN = 45
export const TRAVEL_PENALTY = 0.35
export const WAIT_PENALTY = 0.2
export const MEAL_MIN = 45
export const MAX_SITES_PER_DAY: Record<string, number> = { relaxed: 4, balanced: 5, packed: 7 }

export function prize(score: number, visitMin: number): number {
  return score * (0.5 + 0.5 * Math.min(2, visitMin / 45))
}

function canWalk(allowed: string, required: string) {
  if (allowed === 'strenuous') return true
  if (allowed === 'moderate') return required === 'easy' || required === 'moderate'
  return required === 'easy'
}

interface SimResult {
  ok: boolean
  stops: PlannedStop[]
  objective: number
  cost: number
  km: number
  travelMin: number
  endAt: number
  returnMin: number
}

function simulate(
  sequence: (Site | Business)[],
  input: PlanInput,
  ctx: EngineCtx,
  oracle: TravelOracle,
  startTime: number,
  weights: any,
  is1DayTrip: boolean,
  slackMin: number
): SimResult {
  let ok = true
  let t = startTime
  let cost = 0
  let km = 0
  let travelMin = 0
  let objective = 0
  let prevNode = { id: input.start.siteId, location: input.start.location }
  const stops: PlannedStop[] = []
  
  for (const item of sequence) {
    const isSite = 'kind' in item
    const site = isSite ? item as Site : undefined
    const biz = !isSite ? item as Business : undefined
    
    const leg = oracle.leg(prevNode, { id: item.id, location: item.location })
    const arrive = addMin(t, leg.min)
    
    let openMin = 8 * 60, closeMin = 21 * 60
    if (item.hours) {
      if (item.hours.open) openMin = hhmmToMin(item.hours.open)
      if (item.hours.close) closeMin = hhmmToMin(item.hours.close)
      if (site && site.hours.closedWeekdays) {
        if (site.hours.closedWeekdays.includes(istParts(arrive).weekday)) {
           return { ok: false, stops: [], objective: 0, cost: 0, km: 0, travelMin: 0, endAt: 0, returnMin: 0 }
        }
      }
    }
    
    const arriveParts = istParts(arrive)
    const dayStart = arrive - arriveParts.minuteOfDay * 60000
    const openInst = dayStart + openMin * 60000
    const closeInst = dayStart + closeMin * 60000
    
    const start = Math.max(arrive, openInst)
    const waitMin = Math.round((start - arrive) / 60000)
    if (waitMin > MAX_WAIT_MIN) return { ok: false, stops: [], objective: 0, cost: 0, km: 0, travelMin: 0, endAt: 0, returnMin: 0 }
    
    const vMin = isSite ? site!.visitMin : (biz!.category === 'food' ? MEAL_MIN : biz!.visitMin)
    const depart = addMin(start, vMin)
    if (depart > closeInst) return { ok: false, stops: [], objective: 0, cost: 0, km: 0, travelMin: 0, endAt: 0, returnMin: 0 }
    
    const stepCost = leg.km * input.transportINRPerKm + (isSite ? (site!.fee?.indianINR || 0) : (biz!.typicalSpendINR || 0) * input.party)
    cost += stepCost
    km += leg.km
    travelMin += leg.min
    
    let crowdEst, scoreB
    let stepObj = 0
    if (site) {
      crowdEst = estimateCrowd(site, start, ctx.crowd, ctx.overrides, ctx.reports)
      const remainingMin = Math.round((input.dayEndMin * 60000 - slackMin * 60000 - (depart - dayStart)) / 60000)
      scoreB = scoreSite(site, crowdEst, input, ctx.businesses, Math.max(0, remainingMin), weights)
      stepObj += prize(scoreB.total, vMin)
      if (input.mustSee.includes(site.id)) stepObj += 60
    } else {
      stepObj += 35 + 35 * input.localBoost
      const v = biz!.verification.status
      if (v === 'partner_verified' || v === 'gov_listed' || v === 'gi_registered') stepObj += 15
      if (!biz!.isDemo) stepObj += 8
    }
    
    objective += stepObj
    objective -= (leg.min * TRAVEL_PENALTY + waitMin * WAIT_PENALTY)
    
    stops.push({
      kind: isSite ? 'site' : biz!.category === 'food' ? 'meal' : 'local',
      siteId: site?.id,
      businessId: biz?.id,
      location: item.location,
      arrive, start, depart, waitMin, travelMin: leg.min, travelKm: leg.km, costINR: stepCost,
      crowd: crowdEst, score: scoreB, reasons: []
    })
    
    t = depart
    prevNode = { id: item.id, location: item.location }
  }
  
  let returnMin = 0
  if (is1DayTrip) {
    const leg = oracle.leg(prevNode, input.start)
    t = addMin(t, leg.min)
    cost += leg.km * input.transportINRPerKm
    km += leg.km
    travelMin += leg.min
    objective -= leg.min * TRAVEL_PENALTY
    returnMin = leg.min
  }
  
  const endParts = istParts(t)
  if (endParts.minuteOfDay > input.dayEndMin - slackMin) ok = false
  if (cost > input.budgetINR) ok = false
  
  return { ok, stops, objective, cost, km, travelMin, endAt: t, returnMin }
}

export interface PlanOptions {
  weights?: Weights
  allowLocal?: boolean
  exclude?: string[]
  startOverride?: { node: string | null; at: number }
}

export function planJourney(input: PlanInput, ctx: EngineCtx, opts: PlanOptions = {}): Plan {
  const allowLocal = opts.allowLocal ?? true
  const weights = opts.weights ?? weightsFor(input)
  const exclude = opts.exclude ?? []
  
  const oracle = new TravelOracle(ctx.matrix)
  const trace: TraceEvent[] = []
  
  let eligibleSites = ctx.sites.filter(s => {
    if (!s.plannable || exclude.includes(s.id) || input.exclude.includes(s.id)) return false
    if (s.scope !== 'district' && s.scope !== 'border') return false
    if (!canWalk(input.walking, s.walking) && !input.mustSee.includes(s.id)) {
      trace.push({ type: 'skipped', siteId: s.id, why: 'walking' })
      return false
    }
    if (s.kind === 'craft' && !input.interests.includes('handloom') && !input.mustSee.includes(s.id)) return false
    return true
  })
  
  let seq: (Site | Business)[] = []
  const maxSites = MAX_SITES_PER_DAY[input.pace] || 5
  const startTime = opts.startOverride ? opts.startOverride.at : input.startAt
  const is1DayTrip = input.days === 1
  
  // Reserve slack if allowLocal
  const slackForSiteSelection = allowLocal ? MEAL_MIN + 15 : 0

  // Seed must-see
  for (const id of input.mustSee) {
    const s = eligibleSites.find(x => x.id === id)
    if (s) {
      let bestPos = -1
      for (let i = 0; i <= seq.length; i++) {
        const testSeq = [...seq]
        testSeq.splice(i, 0, s)
        const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
        if (sim.ok) { bestPos = i; break }
      }
      if (bestPos >= 0) {
        seq.splice(bestPos, 0, s)
      } else {
        trace.push({ type: 'skipped', siteId: id, why: 'time' })
      }
    }
  }
  
  // Construct
  let currentSim = simulate(seq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
  while (seq.length < maxSites) {
    let bestSite: Site | null = null
    let bestPos = -1
    let bestRatio = 0
    let bestSim: SimResult | null = null
    
    for (const s of eligibleSites) {
      if (seq.some(x => x.id === s.id)) continue
      
      for (let i = 0; i <= seq.length; i++) {
        const testSeq = [...seq]
        testSeq.splice(i, 0, s)
        const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
        
        if (sim.ok) {
          const gain = sim.objective - currentSim.objective
          const extraMin = (sim.endAt - currentSim.endAt) / 60000
          if (gain > 0 && extraMin > 0) {
            const ratio = gain / extraMin
            if (ratio > bestRatio) {
              bestRatio = ratio
              bestPos = i
              bestSite = s
              bestSim = sim
            }
          }
        }
      }
    }
    
    if (bestSite && bestPos >= 0) {
      seq.splice(bestPos, 0, bestSite)
      currentSim = bestSim!
    } else {
      break
    }
  }
  
  // Improve
  for (let round = 0; round < 4; round++) {
    let improved = false
    
    for (let i = 0; i < seq.length - 1; i++) {
      for (let j = i + 1; j < seq.length; j++) {
        const testSeq = [...seq]
        for (let k = 0; k <= Math.floor((j - i) / 2); k++) {
          const temp = testSeq[i + k]
          testSeq[i + k] = testSeq[j - k]
          testSeq[j - k] = temp
        }
        const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
        if (sim.ok && sim.objective > currentSim.objective + 0.01) {
          seq = testSeq
          currentSim = sim
          improved = true
        }
      }
    }
    
    for (let i = 0; i < seq.length; i++) {
      if (input.mustSee.includes(seq[i].id)) continue
      for (const s of eligibleSites) {
        if (seq.some(x => x.id === s.id)) continue
        const testSeq = [...seq]
        testSeq[i] = s
        const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
        if (sim.ok && sim.objective > currentSim.objective + 0.01) {
          seq = testSeq
          currentSim = sim
          improved = true
        }
      }
    }
    
    if (seq.length < maxSites) {
      for (const s of eligibleSites) {
        if (seq.some(x => x.id === s.id)) continue
        for (let i = 0; i <= seq.length; i++) {
          const testSeq = [...seq]
          testSeq.splice(i, 0, s)
          const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, slackForSiteSelection)
          if (sim.ok && sim.objective > currentSim.objective + 0.01) {
            seq = testSeq
            currentSim = sim
            improved = true
          }
        }
      }
    }
    
    if (!improved) break
  }
  
  // Local insert
  if (allowLocal) {
    currentSim = simulate(seq, input, ctx, oracle, startTime, weights, is1DayTrip, 0) // No slack now
    
    if (input.includeMeal) {
      const startLoc = input.start.location
      const visitedLocs = seq.map(x => x.location)
      visitedLocs.push(startLoc)
      
      const foods = ctx.businesses.filter(b => {
        if (b.category !== 'food' || (b.visitMin || 0) < 40) return false
        return visitedLocs.some(loc => haversineKm(b.location, loc) <= 12)
      })
      
      let bestFood = null
      let bestFoodPos = -1
      let bestFoodVal = -9999
      let bestFoodSim = null
      
      for (const f of foods) {
        for (let i = 0; i <= seq.length; i++) {
          const testSeq = [...seq]
          testSeq.splice(i, 0, f)
          const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, 0)
          if (sim.ok) {
            const mealStop = sim.stops.find(s => s.businessId === f.id)
            if (mealStop) {
              const startOfDayMin = istParts(mealStop.start).minuteOfDay
              if (startOfDayMin >= 12 * 60 + 15 && startOfDayMin <= 14 * 60 + 30) {
                const extraTravel = sim.travelMin - currentSim.travelMin
                const val = 35 + 35 * input.localBoost + (f.verification.status !== 'unverified' && f.verification.status !== 'demo' && f.verification.status !== 'map_listed' ? 15 : 0) + (!f.isDemo ? 8 : 0) - 0.6 * extraTravel
                if (val > bestFoodVal) {
                  bestFoodVal = val
                  bestFood = f
                  bestFoodPos = i
                  bestFoodSim = sim
                }
              }
            }
          }
        }
      }
      
      if (bestFood) {
        seq.splice(bestFoodPos, 0, bestFood)
        currentSim = bestFoodSim!
      }
    }
    
    if (input.interests.includes('handloom') || input.localBoost >= 0.6) {
      const artisans = ctx.businesses.filter(b => b.category === 'artisan' || (b.category === 'shop' && (b.subcategory === 'handloom' || b.name.en.toLowerCase().includes('handloom') || b.name.en.toLowerCase().includes('ilkal'))))
      let bestArt = null
      let bestArtPos = -1
      let bestArtVal = -9999
      let bestArtSim = null
      
      for (const a of artisans) {
        for (let i = 0; i <= seq.length; i++) {
          const testSeq = [...seq]
          testSeq.splice(i, 0, a)
          const sim = simulate(testSeq, input, ctx, oracle, startTime, weights, is1DayTrip, 0)
          if (sim.ok) {
            const extraTravel = sim.travelMin - currentSim.travelMin
            if (extraTravel <= 30) {
              const val = sim.objective
              if (val > bestArtVal) {
                bestArtVal = val
                bestArt = a
                bestArtPos = i
                bestArtSim = sim
              }
            }
          }
        }
      }
      
      if (bestArt) {
        seq.splice(bestArtPos, 0, bestArt)
        currentSim = bestArtSim!
      }
    }
  }
  
  // Annotate reasons
  const stops = currentSim.stops.map(stop => {
    if (stop.siteId) {
      const site = ctx.sites.find(s => s.id === stop.siteId)!
      const reasons: Reason[] = []
      if (input.mustSee.includes(site.id)) reasons.push({ code: 'must_see' })
      if (stop.score && stop.score.interest >= 70) reasons.push({ code: 'interest_match', params: { score: stop.score.interest } })
      if (site.tier === 'hidden') reasons.push({ code: 'hidden_gem' })
      if (site.tags.includes('unesco')) reasons.push({ code: 'unesco' })
      
      // Peak comparison
      let peak = 0
      for (let m = 9 * 60; m <= 18 * 60; m += 30) {
        const at = stop.start - istParts(stop.start).minuteOfDay * 60000 + m * 60000
        const c = estimateCrowd(site, at, ctx.crowd, ctx.overrides, ctx.reports).score
        if (c > peak) peak = c
      }
      if (peak >= (stop.crowd?.score || 0) + 20 && site.tier !== 'hidden') {
        reasons.push({ code: 'visited_early_to_beat_crowds', params: { now: stop.crowd?.score || 0, peak } })
        trace.push({ type: 'crowd_timeshift', siteId: site.id, crowdAtPeak: peak, crowdAtVisit: stop.crowd?.score || 0 })
      } else if (stop.crowd?.level === 'low' && input.crowdAversion >= 0.4) {
        reasons.push({ code: 'quiet_now', params: { score: stop.crowd?.score || 0 } })
      }
      
      // local_partners_nearby
      const { real, demo } = nearbyPartners(site, ctx.businesses)
      if (real + demo > 0) reasons.push({ code: 'local_partners_nearby', params: { count: real + demo } })
      
      return { ...stop, reasons }
    } else if (stop.kind === 'meal') {
      return { ...stop, reasons: [{ code: 'local_lunch' as ReasonCode }] }
    } else {
      return { ...stop, reasons: [{ code: 'local_craft' as ReasonCode }] }
    }
  })
  
  const dayPlan: DayPlan = {
    index: 0,
    stops,
    returnMin: currentSim.returnMin,
    endAt: currentSim.endAt
  }
  
  const plan: Plan = {
    id: 'p_' + Math.abs(JSON.stringify(input).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16).slice(0,6),
    version: 1,
    createdAt: 0,
    input,
    days: [dayPlan],
    totals: {
      costINR: currentSim.cost,
      transportINR: currentSim.km * input.transportINRPerKm,
      distanceKm: Math.round(currentSim.km * 10) / 10,
      travelMin: currentSim.travelMin
    },
    metrics: {} as any,
    trace,
    objective: currentSim.objective
  }
  
  plan.metrics = computeMetrics(plan, ctx)
  return plan
}

export function computeMetrics(plan: Plan, ctx: EngineCtx): ImpactMetrics {
  const stops = plan.days.flatMap(d => d.stops)
  const siteStops = stops.filter(s => s.kind === 'site')
  const heritageStops = siteStops.length
  let lesserKnownStops = 0
  let avgCrowdSum = 0
  
  for (const s of siteStops) {
    const site = ctx.sites.find(x => x.id === s.siteId)!
    if (site.tier !== 'anchor') lesserKnownStops++
    if (s.crowd) avgCrowdSum += s.crowd.score
  }
  
  return {
    stops: stops.length,
    heritageStops,
    lesserKnownStops,
    lesserKnownShare: heritageStops > 0 ? lesserKnownStops / heritageStops : 0,
    localTouchpoints: stops.length - heritageStops,
    verifiedLocalTouchpoints: stops.filter(s => s.kind !== 'site' && ctx.businesses.find(b => b.id === s.businessId)?.verification.status !== 'unverified').length,
    potentialLocalSpendINR: stops.filter(s => s.kind !== 'site').reduce((acc, s) => acc + s.costINR, 0),
    avgCrowdExposure: heritageStops > 0 ? avgCrowdSum / heritageStops : 0,
    distanceKm: plan.totals.distanceKm,
    travelMin: plan.totals.travelMin,
    kindsCovered: new Set(siteStops.map(s => ctx.sites.find(x => x.id === s.siteId)?.kind)).size
  }
}
