// Demo-morning preflight: checks the DEPLOYED app the way a judge's phone will meet it — in ~10 seconds.
//   npm run preflight -- https://your-app.vercel.app
// ✗ = fix before the demo · ! = worth a look · ✓ = fine. Exit code 1 if anything is ✗.
const BASE = (process.argv[2] ?? '').replace(/\/$/, '')
if (!BASE.startsWith('http')) {
  console.error('Usage: npm run preflight -- https://your-app.vercel.app')
  process.exit(1)
}
let fails = 0
const ok = (m) => console.log('✓ ' + m)
const warn = (m) => console.log('! ' + m)
const fail = (m) => {
  fails++
  console.log('✗ ' + m)
}
async function get(path, init) {
  const t0 = Date.now()
  const r = await fetch(BASE + path, { redirect: 'follow', ...init })
  return { r, ms: Date.now() - t0 }
}

const { r: home, ms } = await get('/')
const html = await home.text()
home.ok && html.includes('id="root"') ? ok(`home page ${home.status} in ${ms} ms`) : fail(`home page returned ${home.status}`)
for (const h of ['x-content-type-options', 'permissions-policy', 'referrer-policy']) home.headers.get(h) ? ok(`header ${h}`) : warn(`header ${h} missing (check vercel.json)`)

const deep = await get('/journey')
deep.r.ok && (await deep.r.text()).includes('id="root"') ? ok('deep link /journey serves the app (SPA rewrite works)') : fail('deep link /journey is not served — vercel.json rewrites?')

const sw = await get('/sw.js')
sw.r.ok ? ok('service worker /sw.js') : fail('service worker missing')
;/max-age=0|no-cache/.test(sw.r.headers.get('cache-control') ?? '') ? ok('sw.js is not cached long (updates reach phones)') : warn(`sw.js cache-control: ${sw.r.headers.get('cache-control')}`)
const mf = await get('/manifest.webmanifest')
mf.r.ok ? ok('web app manifest (installable)') : fail('manifest.webmanifest missing')

const expect = { 'sites.json': ['sites', 22], 'knowledge.json': ['facts', null], 'sources.json': ['sources', 51], 'businesses.json': ['businesses', 18] }
for (const f of ['sites.json', 'knowledge.json', 'sources.json', 'businesses.json', 'crowd.json', 'routes.json', 'glossary.json', 'audio.json']) {
  const { r } = await get('/data/' + f)
  if (!r.ok) {
    fail(`/data/${f} → ${r.status}`)
    continue
  }
  try {
    const j = await r.json()
    const [k, n] = expect[f] ?? []
    if (k === 'facts') ok(`/data/${f} (${Object.values(j.facts).flat().length} facts)`)
    else if (k) (Array.isArray(j[k]) && (!n || j[k].length === n) ? ok(`/data/${f} (${j[k].length} ${k})`) : fail(`/data/${f} has ${j[k]?.length} ${k}, expected ${n}`))
    else ok(`/data/${f}`)
    if (f === 'audio.json') {
      const files = Object.values(j.files ?? {})
      if (!files.length) warn('no narration MP3s listed yet (step T13)')
      for (const a of files) {
        const { r: ar } = await get(a, { method: 'HEAD' })
        ar.ok && (ar.headers.get('content-type') ?? '').includes('audio') ? ok(`narration ${a}`) : fail(`narration ${a} → ${ar.status} ${ar.headers.get('content-type')}`)
      }
    }
  } catch {
    fail(`/data/${f} is not valid JSON (did the SPA rewrite return HTML?)`)
  }
}

const samples = await get('/demo/samples.json')
if (samples.r.ok) {
  const { samples: list = [] } = await samples.r.json().catch(() => ({}))
  if (!list.length) warn('no scan demo photos yet (step S14)')
  for (const s of list) {
    const { r } = await get(s.src, { method: 'HEAD' })
    r.ok && (r.headers.get('content-type') ?? '').startsWith('image') ? ok(`demo photo ${s.src}`) : fail(`demo photo ${s.src} → ${r.status}`)
  }
}

// Walk the entry script and the chunks it references (lazy screens, Firebase) — up to 60 files.
const queue = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
const seen = new Set()
let configOk = false
while (queue.length && seen.size < 60) {
  const src = queue.shift()
  if (seen.has(src)) continue
  seen.add(src)
  const js = await (await get(src)).r.text()
  if (js.includes('PASTE_API_KEY') || js.includes('"PASTE"')) fail(`Firebase config still has placeholders (${src})`)
  if (/\.firebaseapp\.com/.test(js) && !js.includes('PASTE_PROJECT_ID')) configOk = true
  for (const m of js.matchAll(/["'`(/](?:\.\/|\/assets\/|assets\/)?([\w.-]+\.js)["'`)]/g)) {
    const next = '/assets/' + m[1]
    if (!seen.has(next) && /-[\w-]{6,}\.js$/.test(next)) queue.push(next)
  }
}
configOk ? ok(`Firebase config is filled in (scanned ${seen.size} scripts)`) : warn(`Firebase config not found in ${seen.size} scripts — normal until the app first loads Firebase (T10/S12); otherwise check src/firebase/config.ts`)

console.log(fails ? `\n${fails} problem(s) — fix before the demo.` : '\nAll clear. Go win it.')
process.exit(fails ? 1 : 0)
