# Sanchara.AI — agent rules (always on)

Multilingual (Kannada / Hindi / English), crowd-aware heritage companion for **Bagalkot district, Karnataka** — a phone web app (PWA). **Most people will use it on a phone: every screen is designed for a 360–430 px thumb first, desktop second.**
Loop: Plan → Scan → Understand → Rebalance → Support local → Show impact. Built in 4 days; judged live on phones on 25 September.
Judges weigh: innovation · working demo · social impact · technical depth (Google stack is a bonus). **A stable, honest demo beats feature count.**

## Architecture (no server of our own, ₹0)
- **Vercel** (Hobby, free) hosts the built PWA from GitHub: every push to `main` runs `npm run verify` (data check + tests + build) and deploys only if all pass. `vercel.json` holds the SPA rewrite and cache/security headers.
- **Firebase AI Logic** (`firebase/ai`, Gemini Developer API backend, Spark plan) — Gemini is called from the phone *through Firebase*; there is no API key in our code.
- **Cloud Firestore** — live shared state: `reports` (crowd reports), `plans` (plan summaries), `stage/live` (the presenter's demo stage). Offline cache on.
- **Firebase Auth** — every visitor is signed in anonymously (rules need `request.auth`); two staff Google accounts may write the stage.
- **App Check** (reCAPTCHA v3) — protects the AI quota. Optional until the site key is pasted in `src/firebase/config.ts`.

## Repo map
- `src/engine/` pure planning engine (crowd model, scoring, OPTW planner, rebalance, impact) + tests `crowd.test.ts`, `planner.test.ts`, `rebalance.test.ts`.
- `src/ai/` everything Gemini: `models.ts` (the ONLY place that calls a model: offline check, per-phone budget, model fallback), `prompts.ts` (system prompts + JSON schemas), `retrieve.ts` (multilingual BM25), `guard.ts` (number guard), `ask.ts` (grounded Q&A), `scan.ts` (monument recognition), `voice.ts` (speech → text), `explain.ts` (plan explanation), tests `core.test.ts`, `ask.test.ts`, `scan.test.ts` (a scripted fake model — tests never call Gemini).
- `src/firebase/` `config.ts` (project config, staff emails), `app.ts` (init), `live.ts` (Firestore reads/writes, staff sign-in).
- `src/features/<screen>/`, `src/components/`, `src/lib/` (data, i18n, planning, speech, format, hooks), `src/state/store.ts` (zustand, persisted), `src/i18n/{en,kn,hi}.json`.
- `public/data/` **single source of truth**: sites, knowledge (facts, stories, FAQ), sources, businesses, crowd, routes, glossary, audio. `public/audio/` narration MP3s, `public/demo/` sample photos + `samples.json`.
- `scripts/check-data.mjs` (data integrity) · `scripts/narrate.mjs` (Gemini TTS → MP3, laptop only).
- `vercel.json` (hosting), `firebase.json` + `firestore.rules` + `firestore.indexes.json` + `.firebaserc` (database rules only).
- `scripts/phone-shots.mjs` (every screen × 4 phone widths × 3 languages, auto-checked) · `scripts/preflight.mjs` (checks the deployed app on demo morning).

## Commands (Windows PowerShell or any shell)
- `npm install` · `npm run dev` (http://localhost:5173 and your LAN address for phones) · `npm test` · `npm run build` · `npm run check-data`
- `npm run verify` (check-data + tests + build — the same gate Vercel runs) · `npm run deploy:rules` (Firestore rules) · `git push` (Vercel deploys)
- `npm run narrate` (needs `.env.local` with `GEMINI_API_KEY`) · `npm run shots` (phone QA, needs `npm run preview`) · `npm run preflight -- https://<app>.vercel.app`

## Non-negotiable rules
1. **No secrets in the repo or the browser.** Never put a Gemini/AI Studio key in `src/`, in `VITE_*` variables or in any committed file. The only key lives in git-ignored `.env.local`, used only by `scripts/narrate.mjs`. The Firebase web config is not a secret, but App Check debug tokens are — never commit or print them.
2. **₹0: Firebase Spark + Vercel Hobby only.** Never suggest Blaze, Vercel Pro, a card, Cloud Functions, Cloud Storage, Vertex AI, serverless functions or any paid API. If something needs billing, stop and tell the human.
3. **Gemini only through `src/ai/models.ts`** (`generateJson` / `generateText`). Models: `gemini-3.8-flash` → `gemini-3.5-flash-lite` (free tier). Never `gemini-3.1-pro-preview` or image generation (not free). Always structured JSON output (`responseMimeType: 'application/json'` + `responseSchema` built with `Schema.*`), `thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }`, a timeout, and validation of what comes back. There is no `temperature` tuning — do not add one.
4. **The dataset is the source of truth; Gemini is the interpreter.** History/culture comes only from `public/data/knowledge.json` facts with `sourceIds`. Never write facts from model memory. Unknown → "I don't have a verified record for that yet." Never weaken `guard.ts` or the corrective-retry/fallback path in `ask.ts`.
5. **Honest labels.** Crowd = "Estimated" (never "live"). Impact = "Modelled". Travel times from a `routes.json` with `method: "estimate"` = estimates. Fees/hours with `verified:false` = "confirm locally". Demo businesses = "Demo listing". Offline scan replays = "Replayed recording". A presenter-set clock shows the "Demo clock" banner. Never remove these labels.
6. **District scope.** Only sites in `public/data/sites.json`. `scope:"border"` sites (Almatti, Vijayapura district) stay labelled as border sites.
7. **Businesses:** never show verified / registered / GI unless `verification.status` says so with `evidence`.
8. **Three languages, always.** Every UI string goes in `en.json`, `kn.json`, `hi.json` (same keys). Use `useT()`; no hard-coded user-facing English in components (the presenter StagePanel is exempt). Names via `p()` / `pick()`.
9. **Engine stays pure and deterministic** (`src/engine/*`): no React, no fetch, no `Date.now()` inside — time comes from inputs. Every engine change keeps `npm test` green; add a test for new behaviour.
10. **Offline first.** Plan, rebalance, stories, facts, FAQ answers, map pins and the crowd model work in aeroplane mode. Every network call has a timeout and a fallback.
11. **Firestore stays small and anonymous.** Only the three collections above, only the fields `firestore.rules` allows. No names, emails of visitors, photos or free text in Firestore. Keep staff emails identical in `src/firebase/config.ts` and `firestore.rules`.
12. **No scope creep.** No payments, native apps, custom ML models, vector databases, new backends or heavy dependencies. Ask before adding any package.
13. **Don't break what works.** Change only the files the task needs. No drive-by refactors or renames.

## Phone-first rules (most visitors are on a phone, often one-handed, often on weak 4G)
- Design at **360×780 first**, then 390, 412, 430; `/district` also at 1440×900. `npm run shots` must report 0 problems.
- Touch: primary controls ≥ 48 px tall, chips/segments ≥ 44 px, secondary ≥ 36 px; `touch-manipulation`, `active:scale-[0.97]` feedback, no hover-only UI.
- Thumb zone: primary actions in the lower half; bottom nav + safe areas (`env(safe-area-inset-*)`); `100dvh` not `100vh`.
- Keyboard: inputs ≥ 16 px (no iOS zoom), `enterKeyHint`, `useKeyboardOpen()` hides the bottom nav and lifts the composer.
- Maps never trap a thumb: one finger scrolls the page, two fingers zoom (`dragging={!L.Browser.mobile}`).
- Speed: first screen < 200 KB gzipped JS; heavy screens (map, Gemini, Firebase, QR) are lazy-loaded; Firebase is imported on demand.
- Every navigation starts at the top (`<ScrollRestoration/>`); back restores the scroll.
- Haptics (`haptic()`) only on real moments: rebalance, report sent, monument found.

## Visual rules
- Bold folk-art look. Tokens only (Tailwind theme names): `kempu` (Ilkal red, primary), `arishina` (turmeric), `hasiru` (green), `neeli` (indigo), `kallu` (stone text), `hatti` (cotton backgrounds), `maralu` (sandstone). No raw hex in components (use the tokens, or `var(--color-…)` in inline styles) — the one exception is Leaflet pin/route colours in MapView, which Leaflet writes as SVG attributes where CSS variables don't work; they mirror the tokens exactly. No neon, no generic AI gradients, no glassmorphism.
- Type: `.display` (+ `.display-caps` for Latin headlines), `.kicker`, body Anek. Kannada/Hindi line-height ≥ 1.6 — never clip Indic glyphs.
- Reuse `components/ui.tsx` (Button, Chip, Pill, Section, Sheet, Stat), `CrowdBadge`, `SourceChip`, `BusinessCard`, `SiteImage`, `MapView`, `Patterns`.
- Crowd is shown with text + bar + number, never colour alone. Motion via `motion/react`, subtle.
- Every async UI has loading, empty, error and offline states.

## Definition of done (every task)
1. `npm test` and `npm run build` pass with zero TypeScript errors. `npm run check-data` exits 0 if data changed.
2. Checked in the browser at 390 px with no console errors; Kannada and Hindi screens don't overflow.
3. New strings exist in all three language files.
4. Final message lists: files changed, how you verified (commands + results), anything left undone. Never claim a check you did not run.

## Working style
- One milestone per task; plan first, then edit. If a request conflicts with these rules, stop and ask.
- Explain what each new file does in 2–3 lines at the top — the team must explain every line to the judges.
- Skills: `/checkpoint`, `/demo-check`, `/grounding-audit`, `/i18n-sync`, `/add-site`.
