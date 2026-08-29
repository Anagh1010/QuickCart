# Continuity Ledger

## Snapshot
- 2026-08-29 [USER] Goal: improve slow website loading time, including first product-image loads and product-detail navigation.
- 2026-08-29 [CODE] Now: product detail uses a direct lookup instead of multiple full-catalog requests; related cards load after the product.
- 2026-08-29 [CODE] Next: deploy and compare production server timings/Core Web Vitals.
- 2026-08-29 [USER] Open questions: none.

## Decisions
- 2026-08-22 [CODE] D001 ACTIVE: retain the historical `Outfit` weights (`300`, `400`, `500`) from the pre-JetBrains-Mono revision.
- 2026-08-22 [CODE] D002 ACTIVE: home product cards receive a limited, server-fetched product list rather than wait for the global client context API call.
- 2026-08-24 [CODE] D003 ACTIVE: home, catalog, product detail, cart, address, orders, and confirmation use a shared `(storefront)` route-group layout instead of duplicated mounts.
- 2026-08-24 [CODE] D004 ACTIVE: homepage is composed from small modules under `components/layout` and `components/home`.
- 2026-08-24 [CODE] D005 ACTIVE: narrowly suppress ProtonPass-injected form attributes on the newsletter form wrapper rather than disabling hydration warnings globally.
- 2026-08-24 [CODE] D006 ACTIVE: logo and Home navigation explicitly clear an existing URL hash before returning to `/` so Next.js does not preserve `#about`.
- 2026-08-24 [CODE] D007 ACTIVE: landing-page category tiles link directly to encoded `/all-products` filters using only catalog-supported categories.
- 2026-08-24 [CODE] D008 ACTIVE: `minPrice`/`maxPrice` validated with `Number.isFinite` + `>= 0` before Mongo query; raw `error.message` never exposed to client.
- 2026-08-29 [CODE] D009 ACTIVE: cache home products for 60 seconds; connect to MongoDB only on a cache miss.
- 2026-08-29 [CODE] D010 ACTIVE: skip the global full-catalog fetch on `/`; other routes retain it for cart/detail workflows.
- 2026-08-29 [CODE] D011 ACTIVE: skip the global catalog fetch on `/all-products`, where the page owns filtered catalog data.
- 2026-08-29 [CODE] D012 ACTIVE: MongoDB TTL/index maintenance runs after connection establishment instead of delaying the first request.
- 2026-08-29 [CODE] D013 ACTIVE: product images use direct Cloudinary `f_auto,q_auto` width variants with `next/image` optimization bypassed.
- 2026-08-29 [CODE] D014 ACTIVE: product detail fetches `/api/product/[id]`; related products are non-blocking.

## Done (recent)
- 2026-08-24 [CODE] Audit + fix pass: 15 items resolved (4 bugs, 4 security, 4 UX/layout, 3 dead-code).
- 2026-08-24 [CODE] Fixed: HeroSlider missing `relative` (dot nav invisible), FeaturedProduct missing `fill`, AllProducts `key={index}` → `key={product._id}`.
- 2026-08-24 [CODE] Fixed: `getCartAmount` crash on deleted products; API price params validated; API error.message hidden from client.
- 2026-08-24 [CODE] Fixed: ProductCard deceptive 4-star fallback removed; NewsLetter rewritten (type=email, form handler, LF endings); PromotionBanner uses LayoutContainer.
- 2026-08-24 [CODE] Fixed: MobileMenu ARIA dialog attrs added; ValueHighlights Tailwind class order; HeroSlider slide-2 priority removed.
- 2026-08-24 [CODE] Deleted 4 orphan root-level components: Navbar, Footer, HeaderSlider, Banner (confirmed zero imports).
- 2026-08-24 [CODE] Added reusable shell primitives and five modular homepage components; shared storefront layout.
- 2026-08-29 [CODE] Homepage hero and Popular cards share server-fetched products; first five card images eager-load with responsive `sizes`.
- 2026-08-29 [CODE] Catalog API review aggregation now returns grouped stats, defers audit writes, and advertises short shared response caching.
- 2026-08-29 [CODE] Added product indexes for date and offer-price sorting.
- 2026-08-29 [CODE] Guarded unresolved pathname so AppContext cannot start an unintended catalog fetch during initial hydration.
- 2026-08-29 [CODE] Added Cloudinary image URL transformation helper; applied to product cards and product-detail gallery.
- 2026-08-29 [CODE] Replaced product detail's unused ID search plus full-catalog reload with one direct product request.

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
- `lib/homeProducts.js`
- `app/api/product/list/route.js`
- `models/Product.js`
- `config/db.js`
- `lib/cloudinaryImage.js`
- `app/api/product/[id]/route.js`
- `app/(storefront)/product/[id]/page.jsx`

## Receipts
- 2026-08-24 [TOOL] Verified all 15 fixes via grep: relative✓ fill✓ key✓ error-msg✓ itemInfo-guard✓ isFinite✓ star-fallback✓ ARIA✓ LayoutContainer✓ LF✓.
- 2026-08-24 [TOOL] Deleted components/{Navbar,Footer,HeaderSlider,Banner}.jsx — confirmed no imports anywhere in app/.
- 2026-08-24 [TOOL] Fixed CategoryRail empty-image regression; dark-footer heading contrast; `/#about` persistence; hydration mismatch on NewsLetter.
- 2026-08-24 [TOOL] Build/lint not runnable here: dependencies absent and npm registry access returned DNS `ENOTFOUND`.
- 2026-08-22 [TOOL] Server-side homepage retrieval limits to 10 products before calculating ratings.
- 2026-08-29 [TOOL] `git diff --check` passes; Next build compiles revised app code but cannot fetch Outfit from Google Fonts in this environment.
- 2026-08-29 [TOOL] ESLint is blocked by the repository's existing circular `@eslint/eslintrc` configuration error.
- 2026-08-29 [TOOL] Next build reaches only the known Google Fonts network failure; no revised application compilation errors reported.
- 2026-08-29 [TOOL] `git diff --check` passes after first-request changes; build remains blocked only by Google Fonts network access.
- 2026-08-29 [TOOL] `git diff --check` passes after direct-image changes; build reaches only the existing Google Fonts network failure.
- 2026-08-29 [TOOL] `git diff --check` passes after direct-product changes; build reaches only the existing Google Fonts network failure.
