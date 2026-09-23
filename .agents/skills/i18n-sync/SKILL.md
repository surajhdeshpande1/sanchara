---
name: i18n-sync
description: Keep src/i18n/en.json, kn.json and hi.json in sync, find hard-coded English in components, and flag strings for native review. Use after adding UI text.
---
# i18n sync

1. Compare keys across `src/i18n/{en,kn,hi}.json`; add every missing key to kn and hi (natural Kannada/Hindi, not transliteration; keep `{placeholders}` identical).
2. Search `src/features` and `src/components` for user-visible English literals in JSX; move them to the dictionaries (presenter `StagePanel` is exempt).
3. Check that no Kannada/Hindi string is more than ~1.6× the English length on buttons; shorten if needed.
4. Output a table of the keys you added or changed in kn/hi so the native speaker on the team can approve them.
