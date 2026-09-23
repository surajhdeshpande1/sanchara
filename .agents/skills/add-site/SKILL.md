---
name: add-site
description: Add or enrich a Bagalkot destination (site metadata, verified facts with sources, story, FAQ) in public/data, keeping the knowledge base source-linked and valid. Use for any data/knowledge change.
---
# Add or enrich a site

Rules: facts come ONLY from sources the human provides or that you can cite with a URL. Never write facts from memory.

1. Site record → `public/data/sites.json` (`id` kebab-case; names/short in en, kn, hi; `district`, `scope`; `location` + `coordVerified`; `tier` anchor/major/hidden; `popularity` 0–100; `crowdProfile`; `visitMin`; `walking`; `hours`/`fee` with `verified:false` unless a source confirms; `recognition.signature` = concrete visual features; `plannable:false` + `parentId` for a structure inside a larger complex).
2. Source → `public/data/sources.json` (`id`, publisher, title, url, tier A–D, retrieved date). Tier A = Govt/UNESCO/ASI/GI registry; B = encyclopedic/institutional; C = maps/business; D = user content (never the only source for history).
3. Facts → `public/data/knowledge.json` → `facts[siteId]`: one claim per fact, ≤ 30 words, id `<siteId>.fNN`, `sourceIds`, `topic`, `claim` = `fact` or `tradition` (legends must be `tradition`), `lastVerified`, text in en + kn + hi with IDENTICAL numbers.
4. Story (100–150 words) uses only facts listed in its `factIds`; FAQ answers likewise.
5. Run `npm run check-data` (must exit 0). New site → add it to `routes.json` ids and matrix (estimate method is fine) and to `crowd.json` scenarios if relevant.
6. List which kn/hi texts are machine translations so the native speaker can check them.
