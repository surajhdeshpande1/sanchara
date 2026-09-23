# Sanchara.AI — Bagalkot heritage companion

See the heritage. Hear the story. Discover the people.
A phone web app (PWA) for Bagalkot district, Karnataka: crowd-aware day plans that rebalance live, monument scan,
grounded answers in Kannada / Hindi / English, local weavers and kitchens, and a live district dashboard.

## Stack (₹0)
React 19 · Vite 8 · TypeScript · Tailwind 4 · PWA — hosted on Vercel · Firebase AI Logic (Gemini) · Cloud Firestore · Firebase Auth · App Check.

## Run it
```powershell
npm install
npm run dev        # http://localhost:5173 (and your Wi-Fi address for phones)
npm test           # 26 tests: engine + grounding
npm run build
npm run check-data
npm run shots      # phone QA: 9 screens × 4 widths × 3 languages (needs `npm run preview`)
```
Paste your Firebase web config into `src/firebase/config.ts` (Firebase console → Project settings → Your apps).
Without it the app still runs: planning, stories and FAQ work; AI and live features show their offline fallbacks.

## Deploy
- **App:** push to `main` → Vercel runs `npm run verify` (data check + tests + build) and deploys only if everything passes.
- **Database rules:** `npm install -g firebase-tools` · `firebase login` · `firebase use --add` · `npm run deploy:rules`
- **Demo morning:** `npm run preflight -- https://<your-app>.vercel.app`

## Honesty rules
Crowd levels are **estimated** by a model (day, time, season, visitor reports) — never live telemetry.
Answers come only from source-linked facts in `public/data/knowledge.json`; every number is checked.
Demo businesses are labelled "Demo listing". Impact numbers are "Modelled".
