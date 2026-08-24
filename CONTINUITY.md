# Continuity Ledger

## Snapshot
- 2026-08-24 [USER] Goal: redesign layout (complete) → audit & fix all issues found by o1-alpha rewrite.
- 2026-08-24 [CODE] Now: navbar restored to standard page flow (scrolls up naturally with page); storefront layout main pt removed.
- 2026-08-24 [CODE] Next: none outstanding; ready for manual QA / staging deploy.
- 2026-08-24 [USER] Open questions: none.

## Decisions
- 2026-08-22 [CODE] D001 ACTIVE: retain the historical `Outfit` weights (`300`, `400`, `500`) from the pre-JetBrains-Mono revision.
- 2026-08-22 [CODE] D002 ACTIVE: home product cards receive a limited, server-fetched product list rather than wait for the global client context API call.
- 2026-08-24 [CODE] D003 ACTIVE: home, catalog, product detail, cart, address, orders, and confirmation use a shared `(storefront)` route-group layout instead of duplicated mounts.
- 2026-08-24 [CODE] D004 ACTIVE: homepage is composed from small modules under `components/layout` and `components/home`.
- 2026-08-24 [CODE] D005 ACTIVE: narrowly suppress ProtonPass-injected form attributes on the newsletter form wrapper rather than disabling hydration warnings globally.
- 2026-08-24 [CODE] D006 ACTIVE: logo and Home navigation explicitly clear an existing URL hash before returning to `/` so Next.js does not preserve `#about`.
- 2026-08-24 [CODE] D007 ACTIVE: landing-page category tiles link directly to encoded `/all-products` filters using only catalog-supported categories.
- 2026-08-24 [CODE] D008 ACTIVE: `minPrice`/`maxPrice` validated with `Number.isFinite` + `>= 0` before Mongo query; raw `error.message` never exposed to client.

## Done (recent)
- 2026-08-24 [CODE] Audit + fix pass: 15 items resolved (4 bugs, 4 security, 4 UX/layout, 3 dead-code).
- 2026-08-24 [CODE] Fixed: HeroSlider missing `relative` (dot nav invisible), FeaturedProduct missing `fill`, AllProducts `key={index}` → `key={product._id}`.
- 2026-08-24 [CODE] Fixed: `getCartAmount` crash on deleted products; API price params validated; API error.message hidden from client.
- 2026-08-24 [CODE] Fixed: ProductCard deceptive 4-star fallback removed; NewsLetter rewritten (type=email, form handler, LF endings); PromotionBanner uses LayoutContainer.
- 2026-08-24 [CODE] Fixed: MobileMenu ARIA dialog attrs added; ValueHighlights Tailwind class order; HeroSlider slide-2 priority removed.
- 2026-08-24 [CODE] Deleted 4 orphan root-level components: Navbar, Footer, HeaderSlider, Banner (confirmed zero imports).
- 2026-08-24 [CODE] Added reusable shell primitives and five modular homepage components; shared storefront layout.

## Working set
- `app/(storefront)/layout.jsx`
- `app/(storefront)/page.jsx`
- `app/(storefront)/all-products/page.jsx`
- `components/layout/Navbar.jsx`
- `components/layout/Footer.jsx`
- `components/layout/MobileMenu.jsx`
- `components/layout/LayoutContainer.jsx`
- `components/home/HomeHeroSlider.jsx`
- `components/home/PromotionBanner.jsx`
- `components/NewsLetter.jsx`
- `components/ProductCard.jsx`
- `context/AppContext.jsx`

## Receipts
- 2026-08-24 [TOOL] Verified all 15 fixes via grep: relative✓ fill✓ key✓ error-msg✓ itemInfo-guard✓ isFinite✓ star-fallback✓ ARIA✓ LayoutContainer✓ LF✓.
- 2026-08-24 [TOOL] Deleted components/{Navbar,Footer,HeaderSlider,Banner}.jsx — confirmed no imports anywhere in app/.
- 2026-08-24 [TOOL] Fixed CategoryRail empty-image regression; dark-footer heading contrast; `/#about` persistence; hydration mismatch on NewsLetter.
- 2026-08-24 [TOOL] Build/lint not runnable here: dependencies absent and npm registry access returned DNS `ENOTFOUND`.
- 2026-08-22 [TOOL] Server-side homepage retrieval limits to 10 products before calculating ratings.
