# Audit Performance — 2026-03-05

## Summary
- Files scanned: 87 (all files in lib/, app/, components/)
- Findings: 3 CRITICAL, 5 HIGH, 8 MEDIUM, 5 LOW

---

## CRITICAL

### C1. N+1 queries in `generateMonthlyExpenses` — loop of sequential INSERTs
**File:** `lib/actions/monthly-expenses.ts:124-201`
**Rule:** `af-performance` § Backend — Requetes DB — "Pas de N+1"
**Problem:** `generateMonthlyExpenses` fetches recurring expenses, one-time expenses, and active debts in 3 queries (good), but then executes one `INSERT INTO monthly_expenses` per item in a `for...of` loop with `await`. For a user with 15 recurring expenses + 2 debts, this is 17 sequential round-trips to Neon serverless. Each Neon HTTP query has ~20-50ms latency overhead, totaling 340-850ms just for INSERTs. This function is called during page render on every navigation to `/` and `/depenses`.
**Fix:** Replace the loop with a single batch INSERT. Build a VALUES list and execute one query:
```sql
INSERT INTO monthly_expenses (user_id, expense_id, month, name, amount, ...)
VALUES ($1, $2, $3, ...), ($4, $5, $6, ...), ...
ON CONFLICT (expense_id, month) DO NOTHING
```
Alternatively, use `Promise.all` on the individual INSERTs to parallelize the round-trips (simpler change, same effect).

### C2. N+1 queries in `generateMonthlyIncomes` — loop of sequential INSERTs
**File:** `lib/actions/monthly-incomes.ts:21-59`
**Rule:** `af-performance` § Backend — Requetes DB — "Pas de N+1"
**Problem:** Same pattern as C1. For each active income, one `INSERT INTO monthly_incomes` is executed sequentially. With 3-5 incomes, that's 3-5 sequential round-trips on every page load for `/` and `/revenus`.
**Fix:** Same as C1 — batch INSERT or `Promise.all` on the individual queries.

### C3. N+1 queries in `generateMonthlyAllocations` — loop of sequential INSERTs
**File:** `lib/actions/allocations.ts:204-221`
**Rule:** `af-performance` § Backend — Requetes DB — "Pas de N+1"
**Problem:** Same pattern. For each allocation, one `INSERT INTO monthly_allocations` is executed sequentially. Called during page render of `/revenus`.
**Fix:** Same as C1 — batch INSERT or `Promise.all`.

---

## HIGH

### H1. Waterfall of sequential awaits before parallel data fetch on homepage
**File:** `app/page.tsx:35-52`
**Rule:** `af-performance` § Frontend — Chargement — "Promise.all pour 2+ fetches independants"
**Problem:** Before the `Promise.all` on line 54, the homepage executes 6 sequential awaits:
1. `await ensureDefaultSections()` — 1-2 queries
2. `await hasOrphanedData()` — 1 query
3. `await hasUserData()` — 1 query (EXISTS across 4 tables)
4. `await generateMonthlyExpenses(month)` — 3 queries + N inserts (see C1)
5. `await generateMonthlyIncomes(month)` — 1 query + N inserts (see C2)
6. Then conditionally 3 more auto-mark queries

These cannot all be parallelized (some depend on generation completing first), but `ensureDefaultSections()`, `hasOrphanedData()`, and `hasUserData()` are completely independent and should run in parallel. After that, `generateMonthlyExpenses` and `generateMonthlyIncomes` are also independent and should run in parallel.
**Fix:** Restructure as:
```ts
const [, showClaimBanner, isNewUser] = await Promise.all([
  ensureDefaultSections(),
  hasOrphanedData(),
  hasUserData().then(has => !has),
]);
await Promise.all([
  generateMonthlyExpenses(month),
  generateMonthlyIncomes(month),
]);
// then auto-mark in parallel too
```

### H2. N+1 in `setAllocationSections` — sequential INSERTs in loop
**File:** `lib/actions/allocations.ts:43-48`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** After deleting existing section links, inserts new ones one by one in a loop. Typically 1-3 sections per allocation, but called from `createAllocation`, `updateAllocation`, and `createAdhocMonthlyAllocation`.
**Fix:** Use a single batch INSERT with multiple VALUES rows.

### H3. N+1 in `reorderSections` and `reorderAllocations` — sequential UPDATEs in loop
**File:** `lib/actions/sections.ts:79-81`, `lib/actions/allocations.ts:176-181`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** Each reorder sends one UPDATE per item sequentially. With 6-10 sections, that's 6-10 round-trips. These are user-triggered actions (drag-and-drop reorder), so the latency is directly perceived.
**Fix:** Use a single UPDATE with a CASE expression:
```sql
UPDATE sections SET position = CASE id
  WHEN $1 THEN 0
  WHEN $2 THEN 1
  ...
END, updated_at = NOW()
WHERE id = ANY($ids) AND user_id = $userId
```
Or use `Promise.all` on the individual UPDATEs for a simpler change.

### H4. `transferSavings` executes 4 sequential queries that could be parallelized
**File:** `lib/actions/expenses.ts:362-378`
**Rule:** `af-performance` § Backend — Appels externes — "Promise.all pour appels independants"
**Problem:** The function runs: (1) INSERT debit contribution, (2) UPDATE source balance, (3) INSERT credit contribution, (4) UPDATE destination balance — all sequentially. Steps 1-2 (source) and 3-4 (destination) are independent pairs.
**Fix:** Run the two pairs in parallel:
```ts
await Promise.all([
  (async () => { await sql`INSERT...debit`; await sql`UPDATE...source`; })(),
  (async () => { await sql`INSERT...credit`; await sql`UPDATE...dest`; })(),
]);
```

### H5. `force-dynamic` on ALL 14 pages — zero caching anywhere
**File:** All pages in `app/` (14 files)
**Rule:** `af-performance` § Backend — Caching — "Cache-Control + stale-while-revalidate"
**Problem:** Every single page exports `export const dynamic = 'force-dynamic'`, disabling Next.js data cache entirely. While personal finance data is user-specific (so CDN caching is inappropriate), the `force-dynamic` also disables the Next.js Data Cache (per-request deduplication). Pages like `/landing` are fully static and should not be force-dynamic. Pages like `/parametres/devise`, `/parametres/notifications`, `/parametres/rappels` fetch settings once and rarely change — they could benefit from `revalidate` instead of full dynamic.
**Fix:**
- `/landing`: Remove `force-dynamic` entirely — it's a static page with zero data fetching.
- Settings pages: Consider using `unstable_cache` or time-based revalidation (`export const revalidate = 60`) instead of `force-dynamic`, since settings change rarely.
- Data pages (`/`, `/depenses`, `/revenus`): `force-dynamic` is appropriate since they call generation functions with side effects.

---

## MEDIUM

### M1. `SELECT *` on multiple tables — fetches unnecessary columns
**Files:**
- `lib/actions/sections.ts:11` — `SELECT * FROM sections`
- `lib/actions/cards.ts:11,18` — `SELECT * FROM cards`
- `lib/actions/incomes.ts:12` — `SELECT * FROM incomes`
- `lib/actions/settings.ts:10` — `SELECT * FROM settings`
- `lib/actions/expenses.ts:346` — `SELECT * FROM savings_contributions`
**Rule:** `af-performance` § Backend — Requetes DB — "SELECT explicite, pas de SELECT *"
**Problem:** These queries fetch all columns when callers often need only a subset. For small tables (sections ~6 rows, cards ~2 rows, settings 1 row), the impact is minimal. For `savings_contributions` which could grow, it fetches unnecessary columns.
**Fix:** Replace with explicit column lists. Prioritize `savings_contributions` and `incomes` (more columns, more rows). Low-row tables like `settings` and `cards` can be addressed later.

### M2. `e.*` with JOINs — fetches all columns of expenses, sections, and cards
**Files:**
- `lib/actions/expenses.ts:18-19` — `SELECT e.*, row_to_json(s.*), row_to_json(c.*)`
- `lib/actions/expenses.ts:34-35` — same pattern
- `lib/actions/expenses.ts:53-55` — same pattern
- `lib/actions/expenses.ts:287-289` — same pattern
- `lib/actions/expenses.ts:407-409` — same pattern
- `lib/actions/debts.ts:12-14` — `SELECT d.*, row_to_json(s.*), row_to_json(c.*)`
**Rule:** `af-performance` § Backend — Requetes DB — "SELECT explicite"
**Problem:** `row_to_json(s.*)` serializes the ENTIRE sections row (id, user_id, name, icon, color, position, created_at, updated_at) when typically only name, icon, and color are displayed. Same for cards. The `e.*` fetches all 20+ columns of expenses.
**Fix:** Select only the columns needed: `row_to_json((SELECT x FROM (SELECT s.name, s.icon, s.color) x)) as section`.

### M3. `getMonthlyIncomeTotal` fetches all incomes just to sum them
**File:** `lib/actions/incomes.ts:19-26`
**Rule:** `af-performance` § Backend — Requetes DB — "SELECT explicite"
**Problem:** Calls `getIncomes()` which does `SELECT * FROM incomes`, then reduces in JS to compute a monthly total. This could be a single SQL aggregation query instead of fetching all rows and computing in JavaScript.
**Fix:** Write a SQL query that computes the monthly total directly:
```sql
SELECT COALESCE(SUM(
  CASE frequency
    WHEN 'MONTHLY' THEN amount
    WHEN 'BIWEEKLY' THEN amount * 2.1667
    WHEN 'YEARLY' THEN amount / 12
    ELSE COALESCE(estimated_amount, 0)
  END
), 0) as total
FROM incomes
WHERE is_active = true AND user_id = $1
```

### M4. Missing composite index on `monthly_expenses(user_id, month)`
**File:** `scripts/migrate-phase1-complement.js:32-34`
**Rule:** `af-performance` § Backend — Requetes DB — "Index sur FK"
**Problem:** The existing indexes are `idx_me_month(month)`, `idx_me_month_status(month, status)`, and `idx_me_section(section_id)`. However, almost every query on `monthly_expenses` filters by BOTH `user_id` AND `month` (e.g., `getMonthlyExpenses`, `getMonthSummary`, `autoMarkOverdue`, `autoMarkPaidForAutoDebit`). The current `idx_me_month` on `month` alone forces a filter on `user_id` after the index scan. With multi-tenancy, a composite index `(user_id, month)` is essential.
**Fix:** Create index: `CREATE INDEX CONCURRENTLY idx_me_user_month ON monthly_expenses(user_id, month)`.

### M5. Missing composite index on `monthly_incomes(user_id, month)`
**File:** (no migration creates this index)
**Rule:** `af-performance` § Backend — Requetes DB — "Index sur FK"
**Problem:** `monthly_incomes` is queried by `user_id + month` in `getMonthlyIncomeSummary`, `autoMarkReceivedForAutoDeposit`, and during generation. No index exists on `(user_id, month)`. Only the single-column `idx_monthly_incomes_user_id` from `migrate-auth.mjs` exists.
**Fix:** Create index: `CREATE INDEX CONCURRENTLY idx_mi_user_month ON monthly_incomes(user_id, month)`.

### M6. Missing index on `expenses(user_id, is_active)` for frequent filtered queries
**File:** `lib/actions/expenses.ts:17-28`
**Rule:** `af-performance` § Backend — Requetes DB — "Index sur FK"
**Problem:** `getExpenses()`, `getPlannedExpenses()`, `getExpensesByCard()`, `getMonthlySummaryBySection()`, and `generateMonthlyExpenses()` all filter on `user_id` AND `is_active = true`. The single-column index on `user_id` doesn't cover the `is_active` predicate.
**Fix:** Create index: `CREATE INDEX CONCURRENTLY idx_expenses_user_active ON expenses(user_id, is_active) WHERE is_active = true` (partial index).

### M7. `markAsPaid` does 4 sequential queries that could be reduced
**File:** `lib/actions/monthly-expenses.ts:327-364`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** When marking a debt-linked expense as paid, the function executes: (1) UPDATE monthly_expense status, (2) SELECT debt info, (3) UPDATE debt balance, (4) UPDATE debt if fully paid, (5) INSERT debt_transaction. 5 sequential queries. Steps 3-4 could be a single UPDATE with a RETURNING clause.
**Fix:** Combine the debt UPDATE and auto-deactivation into a single query using a CTE:
```sql
WITH updated AS (
  UPDATE debts SET remaining_balance = GREATEST(remaining_balance - $amount, 0), updated_at = NOW()
  WHERE id = $debt_id AND user_id = $userId
  RETURNING remaining_balance
)
UPDATE debts SET is_active = false, updated_at = NOW()
WHERE id = $debt_id AND user_id = $userId
  AND (SELECT remaining_balance FROM updated) <= 0;
```

### M8. `loadDemoData` executes 50+ sequential INSERTs
**File:** `lib/actions/demo-data.ts:36-367`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** The demo data loader executes approximately 50+ individual `await sql` calls sequentially. This is a one-time operation but takes several seconds due to Neon serverless latency.
**Fix:** Since this is a one-time action per user, severity is MEDIUM. Group related INSERTs into single multi-row INSERT statements where possible (the savings_contributions and debt_transactions loops are the worst offenders — 15 and 18 individual INSERTs respectively). Use `Promise.all` for independent groups.

---

## LOW

### L1. `ensureDefaultSections` — N+1 for 6 default sections
**File:** `lib/actions/claim.ts:72-77`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** Inserts 6 default sections one by one in a loop. Called once per new user on first visit.
**Fix:** Use a single multi-row INSERT (like the demo data already does for sections).

### L2. `completeOnboarding` — N+1 for category sections
**File:** `lib/actions/onboarding.ts:71-77`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** Inserts selected categories one by one in a loop. One-time action per user.
**Fix:** Use a single multi-row INSERT.

### L3. Font loading — 6 weights loaded when likely only 3-4 are used
**File:** `app/layout.tsx:9`
**Rule:** `af-performance` § Frontend — Images, Fonts & Bundle — "next/font"
**Problem:** `Plus_Jakarta_Sans` is loaded with weights `['300', '400', '500', '600', '700', '800']`. The app primarily uses 500, 600, 700, and 800. Weights 300 and 400 add to the font file size without significant usage.
**Fix:** Remove unused weights. Audit CSS/styles to confirm which weights are actually referenced, then trim the list. Note: `next/font/google` handles font hosting correctly (self-hosted, no external Google Fonts request), so this is a minor optimization.

### L4. `clearAllUserData` — 14 sequential DELETEs
**File:** `lib/actions/demo-data.ts:382-395`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** Deletes user data from 14 tables sequentially. Order matters for FK constraints, so full parallelization is not possible, but independent leaf tables could be deleted in parallel.
**Fix:** Group independent deletes: `Promise.all([deleteDebtTx, deleteSavingsContributions, deleteMonthlyAllocations, deleteNotificationLog, deletePushSubscriptions])` first, then the parent tables.

### L5. `claimOrphanedData` — 11 sequential UPDATEs
**File:** `lib/actions/claim.ts:26-37`
**Rule:** `af-performance` § Backend — Requetes DB — "Batch operations"
**Problem:** Claims data from 11 tables sequentially. One-time action, low priority.
**Fix:** Use `Promise.all` for all 11 UPDATEs since they're independent (no FK dependencies for UPDATE SET user_id).

---

## Systemic Issues

### S1. Pervasive N+1 pattern in generation functions
All three generation functions (`generateMonthlyExpenses`, `generateMonthlyIncomes`, `generateMonthlyAllocations`) follow the same anti-pattern: fetch a list, then INSERT one by one in a loop. This pattern is the single largest performance bottleneck in the application because these functions run on every page navigation. A systematic fix (batch INSERT helper or `Promise.all` wrapper) would address C1, C2, C3 simultaneously.

### S2. No database connection pooling awareness
The app uses `@neondatabase/serverless` which makes HTTP-based queries. Each `await sql` is a separate HTTP round-trip. The codebase treats SQL calls as "cheap" (like a traditional pooled connection), but they are 10-50x more expensive in latency than a pooled TCP connection. This amplifies every N+1 and sequential query pattern. Consider using Neon's WebSocket driver or connection pooling for pages with many queries.

### S3. Excessive `revalidatePath` calls
137 `revalidatePath` calls across 13 action files. Many mutations call `revalidatePath` on 4-6 paths (e.g., `createExpense` revalidates `/depenses`, `/projets`, `/parametres`, `/parametres/charges`, `/`). While each individual call is cheap, the aggregate effect triggers unnecessary cache invalidation across unrelated pages. Consider using `revalidatePath('/', 'layout')` to revalidate everything once, or be more surgical about which paths actually display the changed data.

---

## Checklist Summary (af-performance)

| Check | Status | Notes |
|-------|--------|-------|
| Server Components par defaut | PASS | All pages are Server Components. Client boundary pushed to `*Client.tsx` components |
| Suspense + streaming | FAIL | No `<Suspense>` boundaries anywhere. Homepage fetches 9+ queries sequentially before rendering anything |
| Promise.all for parallel fetching | PARTIAL | Good use of `Promise.all` for final data fetches, but sequential awaits before it (H1) |
| next/image | PASS | No `<img>` tags found. No images in the app (SVG-based UI) |
| next/font | PASS | Self-hosted via `next/font/google` with `display: 'swap'` |
| Dynamic imports | N/A | No heavy libraries to code-split |
| Bundle JS < 200KB | LIKELY PASS | Minimal dependencies (only react, next, neon, web-push) |
| No N+1 queries | FAIL | Critical N+1 in 3 generation functions + multiple loops with sequential INSERTs |
| SELECT explicite | FAIL | 6+ locations using `SELECT *` or `e.*` |
| Pagination | PARTIAL | No explicit pagination, but personal finance data is naturally bounded (~20 expenses per user) |
| Index on FK | PARTIAL | user_id indexed on all tables, but composite indexes for common query patterns are missing |
| Batch operations | FAIL | Multiple loops with sequential INSERTs/UPDATEs |
| Cache-Control | FAIL | No caching at all. `force-dynamic` on every page including the static landing page |
| Promise.all for independent calls | PARTIAL | Good in data fetching, poor in generation/mutation functions |
| Core Web Vitals monitored | UNKNOWN | No Vercel Analytics or SpeedInsights detected in the code |
| Skeleton loaders | UNKNOWN | Not audited (frontend rendering detail) |
