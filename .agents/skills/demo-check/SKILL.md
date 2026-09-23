---
name: demo-check
description: Run the Sanchara judge-demo checklist end to end (phone and projector sizes, online and offline) and report pass/fail per item. Use before every rehearsal and after every deploy.
---
# Demo check

Run `npm run preflight -- <vercel URL>` first. Then open the deployed Vercel URL at 390×844 with `?stage=1` and verify, marking PASS/FAIL with evidence:
1. Home loads in < 3 s on a cold cache; ಕನ್ನಡ / हिन्दी / EN switch works.
2. Stage → Staff sign-in shows "Broadcasting to the room". Clock "Sun 09:00" → the "Demo clock" banner appears (also on a second phone).
3. Plan: 1 day, Architecture + History, start Badami → ≥ 4 stops, a local lunch, and "Timed to beat the crowds".
4. Stage → "Sun 10:45", then "Surge at next big stop" → pressure banner (on both phones) → Rebalance → "What changed" says "Same places, new order", the surged site moves after the rush (est. 92 → ~55) and the remaining-stops crowd drops.
5. Scan a sample photo → correct site, confidence and evidence shown. A random non-monument photo → "doesn't look like…".
6. Site page → Listen plays the Kannada narration; story and facts show source chips.
7. Ask (Kannada) a covered question → cited answer. Ask "Who designed this in 1357?" → refusal, no invented facts.
8. `/district` at 1440×900: crowd bars, counters that rise when a phone plans, the report feed, a working QR code.
9. Stage → Simulate offline (or aeroplane mode): plan, rebalance, stories, FAQ chips still work; the sample scan replays with the "Replayed recording" label.
10. No console errors.
Report failures with the exact screen, steps and console output.
