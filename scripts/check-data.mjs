// Data integrity check for public/data — run before every commit that touches data:  npm run check-data
// Exits with code 1 on ERRORs. WARNs are things to fix before the demo.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)) // project root; works on Windows paths with spaces
const read = (f) => JSON.parse(readFileSync(join(ROOT, 'public', 'data', f), 'utf8'))
const exists = (webPath) => existsSync(join(ROOT, 'public', webPath.replace(/^\//, '')))

// Same rule as src/ai/guard.ts: Kannada/Devanagari digits count as the same number.
const INDIC = '೦೧೨೩೪೫೬೭೮೯०१२३४५६७८९'
const numbersIn = (t = '') =>
  new Set(
    (t.replace(/[೦-೯०-९]/g, (c) => String(INDIC.indexOf(c) % 10)).match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) =>
      n.replace(/,/g, '').replace(/\.0$/, '').replace(/^0+(?=\d)/, ''),
    ),
  )
const missing = (text, allowedTexts) => {
  const ok = new Set(allowedTexts.flatMap((t) => [...numbersIn(t)]))
  return [...numbersIn(text)].filter((n) => !ok.has(n))
}

const errors = []
const warns = []
const sites = read('sites.json').sites
const kb = read('knowledge.json')
const sources = new Map(read('sources.json').sources.map((s) => [s.id, s]))
const biz = read('businesses.json').businesses
const routes = read('routes.json')
const crowd = read('crowd.json')
const audio = existsSync(join(ROOT, 'public', 'data', 'audio.json')) ? read('audio.json') : { files: {} }
const ids = sites.map((s) => s.id)
const siteSet = new Set(ids)
const LANGS = ['en', 'kn', 'hi']

if (ids.length !== siteSet.size) errors.push('duplicate site ids')
for (const s of sites) {
  for (const l of LANGS) {
    if (!s.name?.[l]) warns.push(`${s.id}: missing name.${l}`)
    if (!s.short?.[l]) warns.push(`${s.id}: missing short.${l}`)
  }
  if (s.scope === 'district' && s.district !== 'Bagalkot') errors.push(`${s.id}: scope=district but district=${s.district}`)
  const { lat, lng } = s.location
  if (!(lat >= 15.6 && lat <= 16.9 && lng >= 74.9 && lng <= 76.5)) errors.push(`${s.id}: coordinates outside the Bagalkot region`)
  if (!s.coordVerified) warns.push(`${s.id}: coordinates not verified`)
  if (s.parentId && !siteSet.has(s.parentId)) errors.push(`${s.id}: unknown parentId ${s.parentId}`)
  if (s.recognition && (s.recognition.signature ?? '').length < 40) warns.push(`${s.id}: recognition signature is thin`)
  if (!crowd.hourly[s.crowdProfile]) errors.push(`${s.id}: unknown crowdProfile ${s.crowdProfile}`)
  for (const img of s.images ?? []) {
    if (!(img.credit && img.license && img.sourceUrl)) errors.push(`${s.id}: image without credit/license/sourceUrl`)
    if (!exists(img.src)) warns.push(`${s.id}: image file missing ${img.src}`)
  }
}

const factById = new Map()
for (const [sid, facts] of Object.entries(kb.facts)) {
  if (!siteSet.has(sid)) errors.push(`knowledge: facts for unknown site ${sid}`)
  if (facts.length < 5) warns.push(`${sid}: only ${facts.length} facts (target 10–15 for hero sites)`)
  for (const f of facts) {
    if (factById.has(f.id)) errors.push(`duplicate fact id ${f.id}`)
    factById.set(f.id, f)
    if (!f.sourceIds?.length) errors.push(`${f.id}: fact without a source`)
    for (const src of f.sourceIds ?? []) {
      if (!sources.has(src)) errors.push(`${f.id}: unknown source ${src}`)
      else if (sources.get(src).tier === 'D' && f.sourceIds.length === 1) errors.push(`${f.id}: Tier D cannot be the only source`)
    }
    for (const l of ['kn', 'hi']) {
      if (!f.text[l]) warns.push(`${f.id}: missing ${l} translation`)
      else {
        const lost = missing(f.text.en, [f.text[l]])
        const added = missing(f.text[l], [f.text.en])
        if (lost.length || added.length) errors.push(`${f.id}: ${l} translation changes numbers (lost ${lost.join(',') || '-'}; added ${added.join(',') || '-'})`)
      }
    }
  }
}
// Stories and FAQ answers are served without a model, so they must pass the same number guard as live answers.
for (const [sid, st] of Object.entries(kb.stories ?? {})) {
  const cited = (st.factIds ?? []).map((id) => factById.get(id))
  if (cited.some((f) => !f)) errors.push(`story ${sid}: unknown fact id`)
  for (const l of LANGS) {
    if (!st[l]) {
      warns.push(`story ${sid}: missing ${l}`)
      continue
    }
    const bad = missing(st[l], cited.filter(Boolean).flatMap((f) => Object.values(f.text)))
    if (bad.length) errors.push(`story ${sid}.${l}: numbers not in its cited facts: ${bad.join(', ')}`)
  }
}
for (const items of Object.values(kb.faq ?? {})) {
  for (const q of items) {
    const cited = q.factIds.map((id) => factById.get(id))
    if (cited.some((f) => !f)) errors.push(`faq ${q.id}: unknown fact id`)
    for (const l of LANGS) {
      const bad = missing(q.a?.[l] ?? '', cited.filter(Boolean).flatMap((f) => Object.values(f.text)))
      if (bad.length) errors.push(`faq ${q.id}.${l}: numbers not in its cited facts: ${bad.join(', ')}`)
    }
  }
}
for (const b of biz) {
  const st = b.verification.status
  if (b.isDemo && st !== 'demo') errors.push(`${b.id}: demo listing must have status 'demo'`)
  if (['partner_verified', 'gov_listed', 'gi_registered'].includes(st) && !b.verification.evidence) errors.push(`${b.id}: verified status without evidence`)
  if (!b.isDemo && b.name.en.toLowerCase().includes('demo')) errors.push(`${b.id}: real listing still named 'Demo'`)
}
if (JSON.stringify(routes.ids) !== JSON.stringify(ids)) warns.push('routes.json ids differ from sites.json — rebuild the route matrix')
if (routes.method === 'estimate') warns.push('routes.json is a straight-line estimate (labelled in the app)')
for (const sc of crowd.scenarios) for (const sid of Object.keys(sc.overrides)) if (!siteSet.has(sid)) errors.push(`scenario ${sc.id}: unknown site ${sid}`)
for (const [key, file] of Object.entries(audio.files ?? {})) {
  const [sid, lang] = key.split('.')
  if (!siteSet.has(sid) || !LANGS.includes(lang)) errors.push(`audio.json: bad key ${key}`)
  if (!exists(file)) errors.push(`audio.json: ${key} points to a missing file ${file}`)
}
if (existsSync(join(ROOT, 'public', 'demo', 'samples.json'))) {
  const { samples = [] } = JSON.parse(readFileSync(join(ROOT, 'public', 'demo', 'samples.json'), 'utf8'))
  for (const s of samples) {
    if (!siteSet.has(s.siteId)) errors.push(`samples.json: ${s.id} has unknown siteId ${s.siteId}`)
    if (!exists(s.src)) errors.push(`samples.json: ${s.id} photo missing ${s.src}`)
    if (!s.credit) errors.push(`samples.json: ${s.id} needs a credit line`)
  }
}

console.log(`sites=${ids.length} facts=${factById.size} sources=${sources.size} businesses=${biz.length} (demo=${biz.filter((b) => b.isDemo).length}) audio=${Object.keys(audio.files ?? {}).length}`)
for (const w of warns) console.log('WARN ', w)
for (const e of errors) console.log('ERROR', e)
console.log(errors.length ? `✗ ${errors.length} error(s)` : '✓ data OK')
process.exit(errors.length ? 1 : 0)
