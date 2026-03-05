# Audit Data Modeling — 2026-03-05

## Summary

- **Files scanned:** 28 (1 schema.sql, 14 migration scripts, 13 action files)
- **Tables audited:** 14 (sections, cards, expenses, monthly_expenses, incomes, monthly_incomes, debts, debt_transactions, income_allocations, monthly_allocations, allocation_sections, savings_contributions, settings, push_subscriptions, notification_log)
- **Findings:** 3 CRITICAL, 5 HIGH, 9 MEDIUM, 6 LOW

---

## CRITICAL

### C1 — Amounts stored as DECIMAL instead of INTEGER cents

**File:** `supabase/schema.sql:42`, `scripts/migrate-debts.mjs:30-32`, `scripts/migrate-allocations.mjs:16`, `scripts/migrate-debt-transactions.mjs:29`, all action files
**Rule:** `af-data-modeling` § Types de donnees / Anti-pattern #5
**Problem:** All monetary columns use `DECIMAL(10,2)` or `NUMERIC(10,2)` instead of `INTEGER` cents. This affects `expenses.amount`, `monthly_expenses.amount`, `incomes.amount`, `incomes.estimated_amount`, `debts.original_amount`, `debts.remaining_balance`, `debts.payment_amount`, `debt_transactions.amount`, `income_allocations.amount`, `monthly_allocations.allocated_amount`, `savings_contributions.amount`, `expenses.target_amount`, `expenses.saved_amount`.

The skill is explicit: "Montants : toujours `_cents INTEGER` (5010 + 4990 = 10000, exact). Diviser par 100 a l'affichage." DECIMAL arithmetic can produce rounding errors on aggregations (`SUM(DECIMAL)` accumulates floating-point imprecision). The entire codebase does `Math.round(expense.amount * multiplier * 100) / 100` to work around this — a clear signal the type is wrong.

**Impact:** Potential rounding errors in budget summaries. Multi-currency support harder to add later (cents are universal). This is a foundational schema decision affecting every table.
**Fix:** Migrate all monetary columns to `_cents INTEGER` (e.g., `amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0)`). This is a large-scale breaking change requiring the 3-migration pattern: (1) add `_cents` columns + backfill `amount * 100`, (2) code writes both / reads from `_cents`, (3) drop old columns. Given alpha stage, a single migration + code update is acceptable.

---

### C2 — PostgreSQL ENUM used for income_frequency

**File:** `scripts/migrate-phase2.mjs:13-16`
**Rule:** `af-data-modeling` § Types de donnees / TEXT + CHECK vs ENUM
**Problem:** The `income_frequency` type is created as a PostgreSQL ENUM: `CREATE TYPE income_frequency AS ENUM ('MONTHLY', 'BIWEEKLY', 'YEARLY')`. The skill explicitly prohibits this: "TEXT + CHECK (recommande) — Ajouter une valeur au CHECK = ALTER TABLE simple. Ajouter une valeur a l'ENUM = ALTER TYPE (plus complexe)."

Evidence this already bit the project: the `VARIABLE` frequency value used in `incomes.ts:94` and `monthly-incomes.ts:18` was needed later and likely required an `ALTER TYPE` to add. Additionally, `incomes.source` uses `VARCHAR(20)` without any CHECK constraint, meaning any string value is accepted.

**Impact:** Adding new frequencies requires complex ALTER TYPE operations. No validation on `incomes.source` values at the DB level.
**Fix:** Replace the ENUM with `TEXT NOT NULL CHECK (frequency IN ('MONTHLY', 'BIWEEKLY', 'YEARLY', 'VARIABLE'))`. Add CHECK constraints on `incomes.source` (should be `CHECK (source IN ('EMPLOYMENT', 'BUSINESS', 'INVESTMENT', 'OTHER'))`).

---

### C3 — No source of truth for current database schema

**File:** `supabase/schema.sql` (entire file), `.app-factory/docs/data-model.md:158-161`
**Rule:** `af-data-modeling` § Principes fondamentaux / `af-documentation` § Touche le code, touche la doc
**Problem:** The `supabase/schema.sql` file reflects only the initial MVP state and is missing approximately 10+ migrations worth of changes. The data-model.md document even acknowledges this: "Gap identifie : Le schema SQL dans `supabase/schema.sql` ne reflete pas l'etat actuel de la DB (manque ~10 migrations)."

There is no single file where a developer can see the complete current schema. Understanding the actual schema requires reading 14+ migration scripts in sequence and mentally composing them.

**Impact:** Any new developer (or future Claude session) cannot understand the data model without tracing all migrations. High risk of schema drift between documentation and reality.
**Fix:** Create a canonical `schema-current.sql` file that reflects the actual production schema. Generate it from the live database (`pg_dump --schema-only`) and commit it. Update it with each migration. Keep `supabase/schema.sql` as historical reference only (rename to `schema-mvp-initial.sql`).

---

## HIGH

### H1 — Missing FK indexes on multiple tables

**File:** `supabase/schema.sql`, `scripts/migrate-phase1-complement.js`, various migration scripts
**Rule:** `af-data-modeling` § Index Strategy / Anti-pattern #6
**Problem:** PostgreSQL does NOT automatically create indexes on foreign keys. The following FK columns have NO index:

| Table | FK Column | Impact |
|-------|-----------|--------|
| `expenses` | `section_id` | JOINs in `getExpenses()`, `getMonthlySummaryBySection()` |
| `expenses` | `card_id` | JOINs in `getExpenses()`, `getExpensesByCard()` |
| `monthly_expenses` | `expense_id` | `ON CONFLICT (expense_id, month)` uses UNIQUE index, but non-unique queries on `expense_id` alone (e.g., `DELETE FROM monthly_expenses WHERE expense_id = ?`) do sequential scan |
| `monthly_expenses` | `card_id` | LEFT JOIN in `getMonthlyExpenses()` |
| `monthly_incomes` | `income_id` | Likely covered by UNIQUE (income_id, month) if exists |
| `notification_log` | `expense_id` | CASCADE delete trigger |
| `income_allocations` | `project_id` | LEFT JOIN in `getAllocations()` |

The `idx_me_section` index on `monthly_expenses(section_id)` was created, and `idx_debts_user_id` exists. But core FK columns like `expenses.section_id` and `expenses.card_id` have no index.

**Impact:** Slow JOINs as data grows. The `getExpensesByCard()` query filters on `card_id` with no supporting index. DELETE CASCADE on `notification_log.expense_id` requires a sequential scan to find child rows.
**Fix:** Create indexes on all FK columns:
```sql
CREATE INDEX idx_expenses_section_id ON expenses(section_id);
CREATE INDEX idx_expenses_card_id ON expenses(card_id);
CREATE INDEX idx_monthly_expenses_card_id ON monthly_expenses(card_id);
CREATE INDEX idx_notification_log_expense_id ON notification_log(expense_id);
CREATE INDEX idx_income_allocations_project_id ON income_allocations(project_id);
```

---

### H2 — monthly_expenses and monthly_incomes lack updated_at columns

**File:** `scripts/migrate-phase1-complement.js:11-28` (monthly_expenses CREATE TABLE), monthly_incomes (creation script not found)
**Rule:** `af-data-modeling` § Audit et tracabilite
**Problem:** The `monthly_expenses` table has `created_at` but NO `updated_at` column. The `monthly_incomes` table similarly has only `created_at`. Both tables are frequently updated (status changes, amount edits, paid_at updates) but there is no way to know WHEN the last modification occurred.

Additionally, the `debt_transactions` table has `created_at` but no `updated_at` (acceptable since transactions should be immutable, but the table allows updates via the `addDebtTransaction` flow).

**Impact:** No audit trail for when records were last modified. Impossible to debug issues like "when was this expense marked as PAID?" without application logs.
**Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to both tables. In application code, set `updated_at = NOW()` on every UPDATE statement for these tables (currently no UPDATE sets `updated_at` because the column does not exist).

---

### H3 — No CHECK constraints on status columns for monthly_expenses and monthly_incomes

**File:** `scripts/migrate-phase1-complement.js:18-19` (monthly_expenses has CHECK), monthly_incomes (unknown)
**Rule:** `af-data-modeling` § Principes fondamentaux / Anti-pattern #3
**Problem:** While `monthly_expenses.status` has a CHECK constraint (`CHECK (status IN ('UPCOMING', 'PAID', 'OVERDUE', 'DEFERRED'))`), there is no evidence that `monthly_incomes.status` has a CHECK constraint. The code uses values `'EXPECTED'`, `'RECEIVED'`, `'PARTIAL'`, `'MISSED'` but the DB may accept any string.

Similarly, `expenses.type` has a CHECK, but `debt_transactions.source` (values: `'MANUAL'`, `'MONTHLY_EXPENSE'`, `'EXTRA_PAYMENT'`) has no CHECK constraint — any value is accepted.

**Impact:** Risk of invalid status values being inserted, causing bugs in CASE/WHEN queries and UI display logic.
**Fix:** Add CHECK constraints:
```sql
ALTER TABLE monthly_incomes ADD CONSTRAINT monthly_incomes_status_check
  CHECK (status IN ('EXPECTED', 'RECEIVED', 'PARTIAL', 'MISSED'));
ALTER TABLE debt_transactions ADD CONSTRAINT debt_transactions_source_check
  CHECK (source IN ('MANUAL', 'MONTHLY_EXPENSE', 'EXTRA_PAYMENT'));
```

---

### H4 — transferSavings is not atomic (race condition risk)

**File:** `lib/actions/expenses.ts:353-381`
**Rule:** `af-data-modeling` § Principes fondamentaux (DB is the last line of defense)
**Problem:** The `transferSavings` function performs 4 separate SQL operations (2 INSERTs + 2 UPDATEs) without a transaction. If the process crashes after debiting the source but before crediting the destination, money is lost. Similarly, `addSavingsContribution` (line 319) does an INSERT + UPDATE without a transaction, and `markAsPaid` (line 327) does 4 operations without a transaction.

The Neon serverless driver supports transactions via `sql.transaction()` but this is not used anywhere in the codebase.

**Impact:** Data corruption risk on concurrent requests or process failures. A savings transfer could debit one project without crediting another.
**Fix:** Wrap multi-statement financial operations in transactions:
```typescript
await sql.transaction([
  sql`INSERT INTO savings_contributions ...`,
  sql`UPDATE expenses SET saved_amount = saved_amount - ${amount} ...`,
  sql`INSERT INTO savings_contributions ...`,
  sql`UPDATE expenses SET saved_amount = saved_amount + ${amount} ...`,
]);
```
Priority targets: `transferSavings`, `markAsPaid` (debt balance + transaction log), `addDebtTransaction`, `makeExtraPayment`.

---

### H5 — reorderSections and reorderAllocations execute N separate queries (N+1 pattern)

**File:** `lib/actions/sections.ts:77-84`, `lib/actions/allocations.ts:174-183`
**Rule:** `af-data-modeling` § Performance et denormalisation
**Problem:** Both `reorderSections` and `reorderAllocations` execute one UPDATE per item in a loop. For 10 sections, this is 10 separate round-trips to the database. The `setAllocationSections` helper (allocations.ts:34-49) similarly loops N INSERTs. Same pattern in `ensureDefaultSections`, `loadDemoData`, and the onboarding flow.

**Impact:** Performance degrades linearly with number of items. Each round-trip to Neon serverless has network latency.
**Fix:** Use a single UPDATE with `unnest()`:
```sql
UPDATE sections SET position = data.pos, updated_at = NOW()
FROM unnest($1::uuid[], $2::int[]) AS data(id, pos)
WHERE sections.id = data.id AND sections.user_id = $3
```
Or use `sql.transaction()` to batch operations in a single network round-trip.

---

## MEDIUM

### M1 — SELECT * used in multiple queries

**File:** `lib/actions/sections.ts:11`, `lib/actions/cards.ts:11,18`, `lib/actions/incomes.ts:12`, `lib/actions/settings.ts:10`, `lib/actions/expenses.ts:346`
**Rule:** `af-data-modeling` § Anti-patterns / Anti-pattern #7
**Problem:** Six queries use `SELECT *` instead of listing columns explicitly. This exposes all columns including potential future sensitive data, and includes overhead from columns not needed by the caller.
**Fix:** List columns explicitly in each query. For small tables like `sections`, `cards`, and `settings`, this is a minor issue but should be fixed to prevent future regressions when columns are added.

---

### M2 — user_id is TEXT instead of UUID

**File:** All tables — `user_id TEXT NOT NULL`
**Rule:** `af-data-modeling` § Types de donnees / Conventions de nommage
**Problem:** `user_id` is stored as `TEXT` across all tables instead of `UUID`. The skill recommends UUID for all IDs. The Neon Auth provider likely returns UUIDs as strings, but storing them as `TEXT` means no type validation at the DB level — any string is accepted (including the literal `'unclaimed'` used during migration).
**Impact:** No type-level guarantee that user_id is a valid identifier. No FK relationship to an auth users table. Slightly larger storage and slower comparisons vs native UUID.
**Fix:** This is a historical choice tied to Neon Auth integration. Document as an ADR. If Neon Auth user IDs are guaranteed UUID format, consider migrating to `UUID` type with a CHECK or casting. Low priority given alpha stage.

---

### M3 — No NOT NULL on created_at / updated_at columns

**File:** `supabase/schema.sql:17-18,31-32,66-67` and all migration CREATE TABLE statements
**Rule:** `af-data-modeling` § Audit et tracabilite
**Problem:** All `created_at` and `updated_at` columns are defined as `TIMESTAMPTZ DEFAULT NOW()` without `NOT NULL`. This means an explicit `INSERT ... (created_at) VALUES (NULL)` would succeed. The skill requires: "created_at TIMESTAMPTZ NOT NULL DEFAULT now()".
**Fix:** Add NOT NULL constraint to all audit timestamp columns:
```sql
ALTER TABLE sections ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE sections ALTER COLUMN updated_at SET NOT NULL;
-- repeat for all tables
```

---

### M4 — month column uses VARCHAR instead of DATE

**File:** `monthly_expenses.month`, `monthly_incomes.month`, `debt_transactions.month`, `monthly_allocations.month`
**Rule:** `af-data-modeling` § Types de donnees
**Problem:** The `month` column is stored as `VARCHAR(7)` with format `"YYYY-MM"`. This provides no DB-level date validation — values like `"2026-13"` or `"abcd-ef"` are accepted. Range queries (`month >= '2026-01'`) work by accident (lexicographic order matches chronological for this format) but are fragile.
**Impact:** No type-level guarantee of valid month values. Cannot use native PostgreSQL date functions directly on this column.
**Fix:** This is a pragmatic design choice for a finance app where months are the primary grouping unit. Adding a CHECK constraint would help: `CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$')`. Full migration to DATE type is lower priority. Document as ADR.

---

### M5 — Inconsistent ON DELETE policies

**File:** `scripts/migrate-phase1-complement.js:13` (`monthly_expenses.expense_id ON DELETE SET NULL`), `scripts/migrate-debts.mjs:62` (`monthly_expenses.debt_id ON DELETE SET NULL`), `scripts/migrate-savings-contributions.mjs:27` (`savings_contributions.expense_id ON DELETE CASCADE`)
**Rule:** `af-data-modeling` § Relations et normalisation / ON DELETE decision framework
**Problem:** The ON DELETE policies are inconsistent for financial records:
- `monthly_expenses.expense_id → ON DELETE SET NULL` (keeps the monthly record, nulls the template reference — reasonable)
- `savings_contributions.expense_id → ON DELETE CASCADE` (deletes contribution history if the project is deleted — dangerous for financial data)
- `debt_transactions.debt_id → ON DELETE CASCADE` (deletes payment history if the debt is deleted — dangerous)

The skill says: "L'enfant est un booking/paiement/donnee critique ? → RESTRICT toujours." Financial transaction history should never be silently deleted.

**Impact:** Deleting a debt via hard-delete (not the current soft-delete path) would destroy all payment transaction history. Deleting a savings project would destroy all contribution records.
**Fix:** Change to RESTRICT for financial transaction tables:
```sql
ALTER TABLE debt_transactions DROP CONSTRAINT debt_transactions_debt_id_fkey,
  ADD CONSTRAINT debt_transactions_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE RESTRICT;
ALTER TABLE savings_contributions DROP CONSTRAINT savings_contributions_expense_id_fkey,
  ADD CONSTRAINT savings_contributions_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE RESTRICT;
```
Current soft-delete pattern in the application code mitigates the risk, but the DB should be the safety net.

---

### M6 — No updated_at trigger (moddatetime equivalent)

**File:** All tables with `updated_at`
**Rule:** `af-data-modeling` § Audit et tracabilite — "Trigger moddatetime pour updated_at"
**Problem:** All `updated_at` columns are maintained manually in application code (`updated_at = NOW()` in each UPDATE query). There is no DB-level trigger to guarantee `updated_at` is always set. Any UPDATE that forgets to include `updated_at = NOW()` will leave stale timestamps.

Example: `updateMonthlyExpenseAmount` (`monthly-expenses.ts:460-466`) does NOT set `updated_at` because the column does not exist on this table.

**Impact:** Risk of `updated_at` being stale if a code path forgets to set it.
**Fix:** Create a trigger function and apply to all tables:
```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
-- repeat for all tables with updated_at
```

---

### M7 — data-model.md is incomplete

**File:** `.app-factory/docs/data-model.md:133-139`
**Rule:** `af-documentation` § Touche le code, touche la doc
**Problem:** The data-model.md document is missing details for several tables:
- `income_allocations` — columns listed are incomplete (missing `end_month`, `color`, `position`, `project_id`, `section_id`)
- `monthly_allocations` — no column details
- `savings_contributions` — no column details
- `allocation_sections` — not mentioned at all
- `debt_transactions` — missing `note`, `source` columns
- `monthly_expenses` — missing `notes` column
- `monthly_incomes` — missing `notes` column
- Several tables missing `created_at`/`updated_at` in the documentation

**Fix:** Update data-model.md with complete column listings for all 14+ tables. Include constraints, defaults, and indexes.

---

### M8 — savings_contributions missing user_id in original schema

**File:** `scripts/migrate-savings-contributions.mjs:25-32`
**Rule:** `af-data-modeling` § Securite / Multi-tenancy
**Problem:** The `savings_contributions` table was originally created WITHOUT a `user_id` column. It was added later by `migrate-auth.mjs`. However, the `addSavingsContribution` action (`expenses.ts:327`) correctly includes `user_id`, so the runtime code is safe. The original table design relied solely on the FK to `expenses` for tenant isolation.

The `getSavingsContributions` query (`expenses.ts:345-350`) filters by `user_id` — correct. But `getMonthlySavingsSummary` (`expenses.ts:431-443`) also filters by `user_id` — correct.

**Impact:** Low — the auth migration fixed this. Noted for completeness.
**Fix:** Already resolved by `migrate-auth.mjs`. No further action needed.

---

### M9 — incomes table created without user_id

**File:** `scripts/migrate-phase2.mjs:27-37`
**Rule:** `af-data-modeling` § Securite / Multi-tenancy
**Problem:** The `incomes` table was originally created without `user_id`, `source`, `estimated_amount`, or `pay_anchor_date`. These were added in subsequent migrations. The initial CREATE TABLE used the ENUM type and had no source column at all, meaning the initial schema was significantly different from the current state.

This reinforces finding C3 (no schema source of truth). The actual production schema can only be understood by composing 14+ migration scripts.

**Impact:** Historical issue, resolved by subsequent migrations.
**Fix:** Addressed by C3 recommendation (create canonical schema file).

---

## LOW

### L1 — Naming inconsistency: due_date vs _at vs _on suffixes

**File:** Multiple tables
**Rule:** `af-data-modeling` § Conventions de nommage
**Problem:** The skill specifies `_at` for timestamps and `_on` for dates. The codebase uses `due_date` (DATE type — should be `due_on`), `paid_at` (DATE type — should be `paid_on`), `received_at` (DATE type — should be `received_on`). The `created_at` (TIMESTAMPTZ) follows the convention correctly.
**Fix:** Low priority. Would require renaming columns (UNSAFE migration). Document the local convention as an ADR: "We use `_at` for both TIMESTAMPTZ and DATE suffixes, and `_date` for domain-meaningful dates."

---

### L2 — VARCHAR with length limits where TEXT would suffice

**File:** `supabase/schema.sql` — `VARCHAR(100)`, `VARCHAR(200)`, `VARCHAR(7)`, `VARCHAR(20)`, etc.
**Rule:** `af-data-modeling` § Types de donnees — "Pas de VARCHAR(n) inutile"
**Problem:** The skill recommends `TEXT` over `VARCHAR(n)` since PostgreSQL treats them identically performance-wise. Length limits like `VARCHAR(200)` for names provide false security — the application should validate length, not the DB.
**Fix:** Low priority. Next schema revision should use `TEXT` for variable-length string columns. Validation stays in the application layer (Zod schemas).

---

### L3 — No index on monthly_expenses(user_id, month) composite

**File:** `lib/actions/monthly-expenses.ts:263-293`
**Rule:** `af-data-modeling` § Index Strategy
**Problem:** The most frequent query pattern is `WHERE month = ? AND user_id = ?` (getMonthlyExpenses, getMonthSummary, autoMarkOverdue, autoMarkPaidForAutoDebit). There is an index on `(month)` and `(month, status)`, and `(user_id)`, but no composite index `(user_id, month)` which would be optimal for multi-tenant filtered queries.
**Fix:** Create composite index: `CREATE INDEX idx_me_user_month ON monthly_expenses(user_id, month);`

---

### L4 — demo-data.ts inserts monthly_incomes with income_id = NULL

**File:** `lib/actions/demo-data.ts:289-292`
**Rule:** `af-data-modeling` § Integrite
**Problem:** Demo data inserts a monthly_incomes row with `income_id = NULL` (the "Prime Q4" adhoc income). If the table has a UNIQUE constraint on `(income_id, month)`, multiple NULL income_ids for the same month could behave unexpectedly depending on PostgreSQL's NULL handling in UNIQUE constraints (PostgreSQL allows multiple NULLs in a UNIQUE index).
**Fix:** Minor — the NULL semantics work correctly in PostgreSQL for UNIQUE constraints. But the adhoc income pattern should be documented in the data model documentation.

---

### L5 — Seed data in schema.sql has no user_id

**File:** `supabase/schema.sql:114-129`
**Rule:** `af-data-modeling` § Migrations
**Problem:** The seed INSERT statements at the bottom of schema.sql do not include `user_id`, which is now a required NOT NULL column. These seeds would fail if run against the current schema.
**Fix:** Remove the seed data from schema.sql (it is obsolete) or update to include user_id. The onboarding and demo-data flows handle seeding correctly.

---

### L6 — Expenses table has 20+ columns approaching God Table territory

**File:** `supabase/schema.sql:38-68`, plus 3 additional columns from migrations
**Rule:** `af-data-modeling` § Anti-patterns / Anti-pattern #1
**Problem:** The `expenses` table serves three distinct purposes (RECURRING, ONE_TIME, PLANNED) and has accumulated 23+ columns. Many columns are only relevant for specific types (e.g., `target_amount`, `target_date`, `saved_amount` for PLANNED only; `recurrence_frequency`, `recurrence_day` for RECURRING only; `spread_monthly` for QUARTERLY/YEARLY only). This is not yet a God Table but is trending in that direction.
**Fix:** Low priority. Document the multi-type pattern as an ADR (Single Table Inheritance). Consider splitting into separate tables if more columns are needed per type. The `type` column + nullable type-specific columns is an acceptable pattern at alpha stage.

---

## Systemic Issues

### S1 — No transactions for multi-statement financial operations

**Pattern:** Every financial operation that modifies multiple tables (savings transfer, debt payment, mark-as-paid with debt update) executes statements individually without transactions. This is a systemic data integrity risk that affects `transferSavings`, `markAsPaid`, `addDebtTransaction`, `makeExtraPayment`, `addSavingsContribution`.

**Recommendation:** Create a discovery for the PM to prioritize. This should become an enabler story: "Wrap all multi-statement financial operations in database transactions."

### S2 — Schema evolution is untraceable

**Pattern:** 14 migration scripts, 1 legacy `.js` migration, no migration tracking table, no versioning, no single schema file. The create scripts for `monthly_incomes` is completely missing from the repository. The data-model.md documentation is outdated.

**Recommendation:** Create a discovery for a schema management strategy: numbered migrations, a tracking table (`schema_migrations`), and a canonical `schema-current.sql` generated from the live database after each migration.

### S3 — Consistent lack of DB-level constraints on status/type values for newer tables

**Pattern:** Initial tables (expenses, monthly_expenses, notification_log) have CHECK constraints. Later tables and columns (monthly_incomes.status, debt_transactions.source, incomes.source) likely lack them. This suggests constraints were part of the initial design discipline but relaxed over time.

**Recommendation:** Audit the live database constraints with `\d+ table_name` and add missing CHECKs systematically.

---

## Verdict

**CHANGES REQUESTED**

3 CRITICAL + 5 HIGH findings require attention. Priority order:

1. **C3** (no schema source of truth) — lowest effort, highest documentation ROI
2. **H4** (no transactions) — highest data integrity risk
3. **H1** (missing FK indexes) — single migration, immediate performance benefit
4. **C1** (DECIMAL amounts) — large effort but foundational; can be deferred to beta with ADR
5. **C2** (ENUM type) — medium effort; migrate when touching incomes feature
6. **H2-H3** (missing updated_at, missing CHECK constraints) — bundled into one migration
7. **H5** (N+1 reorder queries) — performance optimization, lower urgency
