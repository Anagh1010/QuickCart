# Continuity Ledger

## Snapshot
- 2026-08-22 [USER] Goal: diagnose delayed Popular-products images after landing-page load.
- 2026-08-22 [CODE] Now: Popular products are server-rendered with their image URLs and the first row is eager-loaded.
- 2026-08-22 [CODE] Next: monitor production image/API timings if further optimization is needed.
- 2026-08-22 [USER] Open questions: none.

## Decisions
- 2026-08-22 [CODE] D001 ACTIVE: retain the historical `Outfit` weights (`300`, `400`, `500`) from the pre-JetBrains-Mono revision.
- 2026-08-22 [CODE] D002 ACTIVE: home product cards receive a limited, server-fetched product list rather than wait for the global client context API call.

## Done (recent)
- 2026-08-22 [TOOL] Git history identifies `Outfit` as the font immediately preceding JetBrains Mono (commit `5e32f75^`).
- 2026-08-22 [CODE] Restored `Outfit` in `app/layout.jsx`; removed the JetBrains Mono body override from `app/globals.css`.
- 2026-08-22 [CODE] Identified delayed product cards/images as a client-side data waterfall followed by remote-image optimization requests.
- 2026-08-22 [CODE] Implemented server-side home product retrieval (10 newest products, ratings calculated after limiting) and eager loading for the first five card images.

## Working set
- `app/layout.jsx`
- `app/globals.css`
- `app/page.jsx`
- `context/AppContext.jsx`
- `components/HomeProducts.jsx`
- `components/ProductCard.jsx`
- `app/api/product/list/route.js`
- `lib/homeProducts.js`
- `components/HeaderSlider.jsx`
- `CONTINUITY.md`

## Receipts
- 2026-08-22 [TOOL] `git show 5e32f75^` confirmed the earlier layout used `Outfit` without a global body font-family rule.
- 2026-08-22 [TOOL] `git diff --check` passed. `npm run build` was blocked by the sandbox being unable to fetch Outfit from `fonts.googleapis.com`.
- 2026-08-22 [TOOL] `AppContext` loads `/api/product/list` only in `useEffect`; the endpoint runs a full product aggregation with a reviews lookup before product URLs reach `ProductCard`.
- 2026-08-22 [TOOL] Each `ProductCard` then loads a remote Cloudinary image through `next/image`; non-visible images are lazy-loaded by default.
- 2026-08-22 [TOOL] `git diff --check` passes. The production build compiled the revised Server/Client component boundaries; it stops only because the environment cannot fetch Outfit from Google Fonts.
- 2026-08-22 [TOOL] ESLint cannot run due to the repository's existing circular ESLint configuration error (`ConfigValidator` JSON serialization).
