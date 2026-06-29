# QuickCart — Feature Documentation

## 1. Error Logging System

### Overview
A server-side logging pipeline that captures every API error, auth failure, and warning that occurs on the platform and stores them in MongoDB. Admin can view, filter, and clear logs from the admin panel at `/admin/logs`.

---

### Architecture

```
API Route throws / rejects
        ↓
  logError() called
        ↓
  MongoDB errorlogs collection
        ↓
  Admin views at /admin/logs
```

---

### Files Involved

| File | Role |
|------|------|
| `models/ErrorLog.js` | Mongoose schema for log documents |
| `lib/logger.js` | Central `logError()` helper |
| `app/api/admin/logs/route.js` | GET (paginated list) + DELETE (clear old) |
| `app/api/admin/logs/test/route.js` | Test endpoint to fire dummy logs |
| `app/admin/logs/page.jsx` | Admin UI — filter, view, expand, clear |

---

### ErrorLog Schema (`models/ErrorLog.js`)

```js
{
  route:     String,   // API path e.g. "/api/order/place"
  message:   String,   // Error message
  stack:     String,   // Stack trace (optional)
  userId:    String,   // Clerk user ID who triggered it
  meta:      Object,   // Any extra context
  level:     String,   // "error" | "warn" | "info"
  createdAt: Date      // Auto-set, TTL index auto-deletes after 90 days
}
```

A **TTL index** on `createdAt` (90 days) means MongoDB automatically deletes old entries without any manual cleanup job.

---

### The Logger (`lib/logger.js`)

```js
export async function logError(route, error, userId = '', meta = {}, level = 'error') {
    await connectDB()
    await ErrorLog.create({
        route,
        message: error.message,
        stack: error.stack,
        userId,
        meta,
        level
    })
}
```

**Design decisions:**
- **Fire-and-forget**: The `await` is intentional for reliability inside API routes, but the call never blocks the response to the user — it's called just before `return NextResponse.json(...)`.
- **Levels**: `error` = unhandled exception in catch block, `warn` = controlled rejection (e.g. auth failure, bad input), `info` = informational event.
- **No external service**: Logs go straight to MongoDB — no third-party dependency, no extra cost.

---

### How Errors Get Captured

Every instrumented API route follows this pattern:

```js
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const isSeller = await authSeller(userId)

        // Controlled rejection → logged as warn
        if (!isSeller) {
            await logError('/api/seller/analytics', new Error('Unauthorized access attempt'), userId, {}, 'warn')
            return NextResponse.json({ success: false, message: 'not authorized' })
        }

        // ... business logic ...

    } catch (error) {
        // Unhandled exception → logged as error
        await logError('/api/seller/analytics', error)
        return NextResponse.json({ success: false, message: error.message })
    }
}
```

**Two capture points:**
1. **`catch` block** — unhandled exceptions (DB errors, Clerk failures, etc.) → level: `error`
2. **Auth guard** — deliberate rejections → level: `warn`

---

### Admin Logs API (`app/api/admin/logs/route.js`)

#### GET `/api/admin/logs`
Query params:
- `page` (default 1)
- `limit` (default 50)
- `level` — filter by `error` | `warn` | `info`
- `route` — partial string match on route field

Returns paginated log entries sorted newest-first.

#### DELETE `/api/admin/logs?days=30`
Deletes all log entries older than `N` days. Used from the "Clear > 30 days" button in the UI.

Both endpoints are guarded by `authAdmin()` — only users with `publicMetadata.role === 'admin'` in Clerk can call them.

---

### Test Endpoint (`app/api/admin/logs/test/route.js`)

`GET /api/admin/logs/test?level=error|warn|info`

Fires a dummy log entry at the specified level so you can verify the logging pipeline and UI are working correctly without needing to trigger a real error. Only accessible by admins. The logs page has **TEST: ERROR | WARN | INFO** buttons that call this endpoint and auto-refresh the list.

- **ERROR** test includes a readable stack trace
- **WARN / INFO** tests have no stack trace (mirrors how real warnings work — controlled rejections don't produce a call stack)

---

### Admin Logs UI (`/admin/logs`)

**Features:**
- Filter by level (All / Error / Warn / Info)
- Filter by route (partial text match)
- Refresh button
- Click any log entry to expand and see the full stack trace
- Test buttons (ERROR / WARN / INFO) to verify the pipeline
- "Clear > 30 days" button to manually purge old entries
- Pagination (50 entries per page)

**Badge colours:**
- 🔴 ERROR — `bg-red-50 text-red-600`
- 🟡 WARN — `bg-yellow-50 text-yellow-700`
- 🔵 INFO — `bg-blue-50 text-blue-600`

---

### What Does and Doesn't Get Logged

| Event | Logged? | Level |
|-------|---------|-------|
| Unhandled exception in any API route | ✅ | error |
| Auth rejection (not seller / not admin) | ✅ | warn |
| DB connection failure | ✅ | error |
| Clerk API failure | ✅ | error |
| Client-side "Please login" toast | ❌ | — |
| User navigating to a page they don't have access to | ❌ | — |

> Client-side events are never sent to the server and therefore cannot be captured by this system. To log those, a dedicated `POST /api/log/client` endpoint would be needed.

---
---

## 2. Cart Abandonment Analytics

### Overview
A seller-specific analytics feature accessible at `/seller/cart-abandonment`. Sellers can select a date range and see, per product, how many users currently have the product in their cart but did not place an order during the selected period.

---

### Architecture

```
Seller selects date range → clicks Analyse
        ↓
GET /api/seller/cart-abandonment?from=&to=
        ↓
1. Fetch seller's own product IDs
2. Scan ALL users' cartItems for those products  →  "In Cart" count
3. Query orders in [from, to] range              →  "Ordered" count
4. Abandoned = In Cart − Ordered
        ↓
Per-product breakdown returned to UI
```

---

### Files Involved

| File | Role |
|------|------|
| `app/api/seller/cart-abandonment/route.js` | API — computes abandonment data |
| `app/seller/cart-abandonment/page.jsx` | Seller UI — date picker + results |
| `components/seller/Sidebar.jsx` | "Cart Analysis" nav link added |

---

### How Cart Data is Structured

There is **no separate Cart model**. Carts are stored directly on the `User` document:

```js
// models/User.js
{
    _id: String,       // Clerk user ID
    name: String,
    email: String,
    imageUrl: String,
    cartItems: Object  // { [productId]: quantity }
}
```

Example `cartItems`:
```json
{
  "64a1f2b3c4d5e6f7a8b9c0d1": 2,
  "64a1f2b3c4d5e6f7a8b9c0d2": 1
}
```

A product is considered "in cart" when `cartItems[productId] > 0`.

---

### Abandonment Criteria

**A user is counted as "abandoned" for a product if:**
1. They **currently have the product in their cart** (live snapshot at query time), AND
2. They did **not** place any order containing that product within the selected date range

```
Abandoned Count = |{users with product in cart}| − |{users who ordered it in [from, to]}|
Abandonment Rate = (Abandoned Count / In Cart Count) × 100%
```

#### Important Limitation — Live Snapshot vs Event Log
The cart is a **current state snapshot**, not a time-series event log. This means:
- ✅ "Who has this product in their cart right now?" — answerable
- ❌ "Who added this product to their cart between Date A and Date B?" — not possible without a separate CartEvent collection

The **date range only applies to orders** — it filters which orders count as "converted". The cart population is always the current snapshot.

This is standard practice for e-commerce platforms that don't instrument cart-add events.

---

### API (`app/api/seller/cart-abandonment/route.js`)

#### `GET /api/seller/cart-abandonment?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Auth:** `authSeller()` — sellers and admins pass. Other users get 403.

**Steps:**
1. Parse `from` / `to` query params into Unix timestamps. Defaults to last 30 days if not provided. `to` date is extended to `23:59:59.999` to include the full day.
2. `Product.find({ userId })` — get this seller's product IDs only. If none, return empty array immediately.
3. `User.find({}).select('_id cartItems')` — scan all user documents for cart data.
4. Build `cartUsersMap: { productId → Set<userId> }` — which users have each product in cart.
5. `Order.find({ date: { $gte: fromTs, $lte: toTs }, 'items.product': { $in: sellerProductIds } })` — get relevant orders in the date range.
6. Build `orderedUsersMap: { productId → Set<userId> }` — which users ordered each product in the period.
7. For each product: compute `abandonedCount`, `abandonmentRate`, return full breakdown.
8. Sort results by `abandonedCount` descending (worst performing products first).

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "productId": "64a1...",
      "name": "MacBook Pro 16",
      "image": "https://res.cloudinary.com/...",
      "price": 2499,
      "inCartCount": 10,
      "orderedCount": 3,
      "abandonedCount": 7,
      "abandonmentRate": 70
    }
  ],
  "from": 1748736000000,
  "to": 1751327999999
}
```

**Security:** Only the calling seller's products appear in the results — `Product.find({ userId })` hard-filters by the authenticated seller's Clerk user ID.

---

### UI (`/seller/cart-abandonment`)

#### Date Range Picker
- **From** and **To** date inputs, defaults to last 30 days
- `max` on From = selected To date (prevents inverted ranges)
- `max` on To = today (no future dates)
- **Analyse** button triggers the API call

#### Summary Cards (shown after first fetch)
| Card | Value |
|------|-------|
| In Cart (currently) | Total users holding any of your products in cart |
| Abandoned in Period | Total who didn't convert in the date range |
| Avg Abandonment Rate | `(total abandoned / total in cart) × 100%` |

#### Per-Product Breakdown Table
Each product row shows:
- Product image + name + price
- **In Cart** count
- **Ordered** count (green)
- **Abandoned** count (orange)
- **% Rate** — colour-coded number
- Visual **progress bar** showing the abandonment rate

**Risk classification:**

| Rate | Label | Colour |
|------|-------|--------|
| < 40% | Low Risk | 🟢 Green |
| 40–69% | Medium Risk | 🟠 Orange |
| ≥ 70% | High Risk | 🔴 Red |

Sorted by abandonment count descending so the most problematic products appear first.

---

### Interpreting the Results

| Scenario | What to do |
|----------|-----------|
| High abandonment on a specific product | Check price competitiveness, improve product images/description |
| All products show 100% abandonment | Likely no orders placed in the selected period — try a wider date range |
| `inCartCount = 0` for a product | No users currently have it in cart |
| `orderedCount > inCartCount` | Possible — user may have ordered then cleared their cart, or ordered multiple times |

---

### Data Flow Diagram

```
User adds product to cart
    ↓ (POST /api/cart/update)
User.cartItems = { productId: qty }   ← stored in MongoDB

                    ↓ (at query time)
Seller opens Cart Analysis, selects dates
    ↓ (GET /api/seller/cart-abandonment?from=X&to=Y)

┌─────────────────────────────────────────────────────┐
│  For each of seller's products:                      │
│                                                      │
│  cartUsers  = users where cartItems[pid] > 0        │
│  ordered    = users who ordered pid in [from, to]   │
│  abandoned  = cartUsers − ordered                   │
│  rate       = abandoned / cartUsers × 100           │
└─────────────────────────────────────────────────────┘
    ↓
Results rendered in table, sorted by abandoned DESC
```
