---
name: checkpoint
description: Run every check for Sanchara (tests, typecheck, build, data check), fix failures, and produce a commit-ready summary. Use after finishing any task and before every push or merge.
---
# Checkpoint

1. `npm run verify` runs everything Vercel will run (data check, tests, build). Then details:
   `npm test` — fix failures in `src/engine` or `src/ai` first; never weaken or delete a test to make it pass.
2. `npm run build` — zero TypeScript errors.
3. If anything under `public/data/` changed: `npm run check-data` must exit 0 (warnings allowed; list them).
4. Start `npm run dev`, open http://localhost:5173 at 390×844 and visit `/`, `/plan` → create a journey, `/journey`, `/site/badami-caves`, `/scan`, `/ask`, `/impact`, `/district`. No console errors. Switch to ಕನ್ನಡ and हिन्दी once.
5. Phone QA: `npm run preview` in one terminal, `npm run shots` in another — the report must show 0 problems.
6. `git status` — make sure `.env.local`, `dist/` and `node_modules/` are NOT staged.
7. Report: files changed, checks run with results, known issues. Propose a one-line conventional commit message (`feat:`, `fix:`, `data:`, `docs:`).
Never report a check as passing unless you ran it in this session.
