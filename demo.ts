
import { testCtx, testInput } from './src/engine/testctx'
import { planJourney, rebalance } from './src/engine/planner'
import { istInstant } from './src/engine/time'

const ctx = testCtx();
const calm = planJourney(testInput({ startAt: istInstant('2026-09-27', 9 * 60 + 15), budgetINR: 2500 }), ctx);
const now = istInstant('2026-09-27', 10 * 60 + 45);
const pop = (id: any) => ctx.sites.find((x: any) => x.id === id)!.popularity;
const upcoming = calm.days[0].stops.filter(s => s.kind === 'site' && s.start > now);
const big = [...upcoming].sort((a,b) => pop(b.siteId) - pop(a.siteId))[0];

const surge = testCtx({ overrides: [{ siteId: big.siteId!, score: 92, from: now, until: now + 3*3600000, source: 'surge' }] });
const { plan, diff } = rebalance(calm, now, surge);

const hr = (inst: number) => {
  const d = new Date(inst);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

let movedStr = [];
for (const id of diff.moved) {
  const o = calm.days[0].stops.find(s => (s.siteId ?? s.businessId) === id)!;
  const n = plan.days[0].stops.find(s => (s.siteId ?? s.businessId) === id)!;
  const s = ctx.sites.find(x => x.id === id);
  const sName = s ? s.name.en : ctx.businesses.find(x => x.id === id)!.name.en;
  movedStr.push(`${sName} ${hr(o.start)} -> ${hr(n.start)} (est. ${o.crowd?.score ?? 0} -> ${n.crowd?.score ?? 0})`);
}

console.log(`strategy ${diff.strategy} · exposure ${diff.exposureBefore} -> ${diff.exposureAfter} · ${movedStr.join(' · ')}`);
