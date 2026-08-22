# Continuity Ledger

## Snapshot
- 2026-08-22 [USER] Goal: restore the font used before JetBrains Mono.
- 2026-08-22 [CODE] Now: restored the prior `Outfit` Next font configuration and removed the Mono-specific global override.
- 2026-08-22 [CODE] Next: no further implementation work requested.
- 2026-08-22 [USER] Open questions: none.

## Decisions
- 2026-08-22 [CODE] D001 ACTIVE: retain the historical `Outfit` weights (`300`, `400`, `500`) from the pre-JetBrains-Mono revision.

## Done (recent)
- 2026-08-22 [TOOL] Git history identifies `Outfit` as the font immediately preceding JetBrains Mono (commit `5e32f75^`).
- 2026-08-22 [CODE] Restored `Outfit` in `app/layout.jsx`; removed the JetBrains Mono body override from `app/globals.css`.

## Working set
- `app/layout.jsx`
- `app/globals.css`
- `CONTINUITY.md`

## Receipts
- 2026-08-22 [TOOL] `git show 5e32f75^` confirmed the earlier layout used `Outfit` without a global body font-family rule.
- 2026-08-22 [TOOL] `git diff --check` passed. `npm run build` was blocked by the sandbox being unable to fetch Outfit from `fonts.googleapis.com`.
