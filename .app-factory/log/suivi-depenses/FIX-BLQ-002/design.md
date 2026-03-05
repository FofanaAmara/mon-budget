# FIX-BLQ-002 — Design

**Story:** Yearly and quarterly expenses generated every month instead of their due month
**Level:** 2 (business logic)
**Scope:** data, backend, frontend
**Date:** 2026-03-05
**Revision:** 1 (addresses review-design findings F-001, F-002, F-003)

---

## 1. Root Cause Analysis

In `lib/actions/monthly-expenses.ts`, `calcDueDateForMonth()` (lines 40-50) treats QUARTERLY and YEARLY identically to MONTHLY: it returns a valid due date for **every** month as long as `recurrence_day` exists. The skip logic at lines 117-124 checks `!dueDate`, but since `calcDueDateForMonth` always returns a date for these frequencies, the guard never triggers.

**Result:** A yearly insurance bill of $1,200 appears as a $100/month entry ($1,200 / 12) in every month, inflating the monthly total by $100 in 11 wrong months.

---

## 2. DB Schema Change

### New column: `expenses.spread_monthly`

```sql
ALTER TABLE expenses ADD COLUMN spread_monthly BOOLEAN NOT NULL DEFAULT false;
```

**Purpose:** When `true` on a QUARTERLY or YEARLY expense, the system generates the expense in every month with `amount / period_count` instead of only in the due month(s) with the full amount.

**Migration safety:** ADD COLUMN with DEFAULT and NOT NULL is safe on Neon PostgreSQL (no table lock for small-to-medium tables). This is a SAFE operation per the gate migration checklist.

**Migration script:** `scripts/migrate-spread-monthly.mjs`
- Pattern: follows existing migration scripts (neon + dotenv, same error handling)
- Single operation: `ALTER TABLE expenses ADD COLUMN spread_monthly BOOLEAN NOT NULL DEFAULT false`
- No data migration needed (default false preserves current behavior intent, but the bug fix itself changes behavior)

---

## 3. Backend Logic Changes

### 3.1 `calcDueDateForMonth()` — Add frequency-aware skip logic

**Current behavior (lines 40-50):** QUARTERLY and YEARLY return a due date for every month.

**New behavior:** Add explicit checks BEFORE the generic MONTHLY/QUARTERLY/YEARLY block:

```
For QUARTERLY:
  - Extract the reference month from next_due_date (or recurrence_day's implied month)
  - Calculate if current month is a due month: (currentMonth - referenceMonth) % 3 === 0
  - If not a due month, return null (skip)

For YEARLY:
  - Extract the reference month from next_due_date
  - If currentMonth !== referenceMonth, return null (skip)
```

**Key decision:** The reference month comes from `next_due_date`. If `next_due_date` is null and only `recurrence_day` is set, we cannot determine the due month for QUARTERLY/YEARLY. In that case, we fall back to generating every month (same as current behavior). This is a safe degradation that avoids breaking existing data with missing next_due_date.

**Implementation approach:**

Restructure the block at lines 40-50 into three separate cases:

```typescript
// YEARLY: only generate in the due month
if (expense.recurrence_frequency === "YEARLY" && expense.recurrence_day) {
  if (expense.next_due_date) {
    const ref = new Date(expense.next_due_date + "T00:00:00");
    const refMonth = ref.getMonth() + 1;
    if (monthNum !== refMonth) return null; // not the due month
  }
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const day = Math.min(expense.recurrence_day, daysInMonth);
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// QUARTERLY: generate in due_month, +3, +6, +9
if (expense.recurrence_frequency === "QUARTERLY" && expense.recurrence_day) {
  if (expense.next_due_date) {
    const ref = new Date(expense.next_due_date + "T00:00:00");
    const refMonth = ref.getMonth() + 1;
    const diff = ((monthNum - refMonth) % 12 + 12) % 12; // positive modulo
    if (diff % 3 !== 0) return null; // not a quarterly due month
  }
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const day = Math.min(expense.recurrence_day, daysInMonth);
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// MONTHLY: unchanged — generate every month
if (expense.recurrence_frequency === "MONTHLY" && expense.recurrence_day) {
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const day = Math.min(expense.recurrence_day, daysInMonth);
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
```

### 3.2 `generateMonthlyExpenses()` — Handle spread_monthly

**Change in the SQL query (line 69-76):** Add `spread_monthly` to the SELECT.

**Change in the generation loop (lines 100-139):**

**Execution order (F-002 fix — unambiguous control flow):**

The spread_monthly check MUST run BEFORE both `calcDueDateForMonth` and the skip guard. This is critical because `calcDueDateForMonth` returns null for non-due months, and the skip guard (lines 117-124) would skip the expense before spread_monthly logic ever runs.

```
for (const expense of recurringExpenses) {
  const freq = expense.recurrence_frequency;

  // STEP 1: spread_monthly path — runs BEFORE calcDueDateForMonth
  if (expense.spread_monthly && (freq === "QUARTERLY" || freq === "YEARLY")) {
    const periodCount = freq === "QUARTERLY" ? 3 : 12;
    const spreadAmount = Math.round((expense.amount / periodCount) * 100) / 100;
    // Compute a synthetic due_date using recurrence_day (or 1st of month)
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const day = expense.recurrence_day ? Math.min(expense.recurrence_day, daysInMonth) : 1;
    const syntheticDueDate = `${year}-${String(monthNum).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    // INSERT with spreadAmount and syntheticDueDate
    continue; // skip the normal path entirely
  }

  // STEP 2: normal path — calcDueDateForMonth + skip guard + multiplier
  const dueDate = calcDueDateForMonth(expense, month);

  if (!dueDate && expense.recurrence_day && freq && freq !== "MONTHLY") {
    continue; // skip non-due months for QUARTERLY/YEARLY without spread
  }

  const multiplier = (freq === "QUARTERLY" || freq === "YEARLY")
    ? 1  // full amount, only in due months
    : monthlyMultipliers[freq ?? "MONTHLY"] ?? 1;
  const monthlyAmount = Math.round(expense.amount * multiplier * 100) / 100;
  // INSERT with monthlyAmount and dueDate
}
```

**Why this order matters:** If spread_monthly=true ran AFTER the skip guard, a yearly expense due in June would be skipped in March before the spread logic could generate the 1/12 entry. The `continue` in the spread_monthly branch ensures no fall-through to the normal path.

**Amount calculation decision:**

| Frequency | spread_monthly=false | spread_monthly=true |
|-----------|---------------------|---------------------|
| WEEKLY | amount * 52/12 (every month) | N/A (not applicable) |
| BIWEEKLY | amount * 26/12 (every month) | N/A |
| MONTHLY | amount * 1 (every month) | N/A |
| BIMONTHLY | amount * 1/2 (skip months) | N/A |
| QUARTERLY | **amount (full, 4x/year)** | amount / 3 (every month) |
| YEARLY | **amount (full, 1x/year)** | amount / 12 (every month) |

**Key insight:** When spread_monthly=false for QUARTERLY/YEARLY, we should use the **full amount** (multiplier = 1) because it only generates in due months. The existing multipliers (1/3 for QUARTERLY, 1/12 for YEARLY) were designed to normalize to a monthly equivalent BECAUSE the expense was generated every month. Now that we skip non-due months, using the multiplier would give the wrong total.

When spread_monthly=true, we divide by the period count and generate every month (same visual effect as before the fix, but intentional).

**Multiplier table update:**

```typescript
// For QUARTERLY/YEARLY without spread_monthly:
// Full amount in due months only → multiplier = 1
// For spread_monthly = true:
// amount / periodCount every month → handled separately

const multiplier = (freq === "QUARTERLY" || freq === "YEARLY") && !expense.spread_monthly
  ? 1  // full amount, only in due months
  : monthlyMultipliers[freq ?? "MONTHLY"] ?? 1;
```

### 3.3 `getMonthlySummaryBySection()` — Update SQL CASE for spread_monthly (F-001 fix)

**File:** `lib/actions/expenses.ts:220-241`

**Current behavior:** Hardcoded SQL CASE divides QUARTERLY by 3 and YEARLY by 12 unconditionally. This function computes "monthly equivalent" totals per section from the `expenses` template table (NOT from `monthly_expenses`).

**Problem:** After the fix, `monthly_expenses` will show full amounts in due months (spread_monthly=false) or divided amounts every month (spread_monthly=true). But this summary SQL will still always divide, creating an inconsistency:
- User sees $300 quarterly charge in the monthly view (due month, full amount)
- Summary shows $100 for that section (SQL divides by 3)

**New behavior:** The SQL CASE must account for `spread_monthly`:

```sql
CASE
  WHEN e.recurrence_frequency = 'WEEKLY' THEN e.amount * 52.0 / 12
  WHEN e.recurrence_frequency = 'BIWEEKLY' THEN e.amount * 26.0 / 12
  WHEN e.recurrence_frequency = 'MONTHLY' THEN e.amount
  WHEN e.recurrence_frequency = 'BIMONTHLY' THEN e.amount / 2.0
  WHEN e.recurrence_frequency = 'QUARTERLY' AND e.spread_monthly = true THEN e.amount / 3.0
  WHEN e.recurrence_frequency = 'QUARTERLY' AND e.spread_monthly = false THEN e.amount / 3.0
  WHEN e.recurrence_frequency = 'YEARLY' AND e.spread_monthly = true THEN e.amount / 12.0
  WHEN e.recurrence_frequency = 'YEARLY' AND e.spread_monthly = false THEN e.amount / 12.0
  ELSE e.amount
END
```

**Design decision:** Both spread_monthly=true and spread_monthly=false use the same monthly equivalent formula in this summary. The reason: `getMonthlySummaryBySection()` answers the question "how much does this section cost me per month?" — this is always a monthly equivalent, regardless of how the charges are displayed in the monthly view.

- `spread_monthly=true` QUARTERLY $300: monthly_expenses shows $100/month, summary shows $100/month. Consistent.
- `spread_monthly=false` QUARTERLY $300: monthly_expenses shows $300 in due months only, summary shows $100/month. This is intentionally different: monthly view shows cash flow (when money leaves), summary shows budget allocation (monthly cost).

**Consequence:** The existing SQL CASE is actually CORRECT as-is for the summary's purpose. No change needed to the SQL formula itself. However, the column `spread_monthly` must be available in the query (it already is since it's on the `expenses` table joined in the query). The CASE remains identical.

**Action: NO CODE CHANGE to this function.** The existing behavior is correct for the summary's semantics. This is documented here to acknowledge the reviewer's finding and explain why no change is needed.

### 3.4 `createExpense` / `updateExpense` — Handle spread_monthly field

**File:** `lib/actions/expenses.ts`

- Add `spread_monthly?: boolean` to `CreateExpenseInput` type
- Add `spread_monthly` to the INSERT statement in `createExpense()` with default `false`
- Add `spread_monthly` to the UPDATE statement in `updateExpense()`

### 3.5 Type update

**File:** `lib/types.ts`

Add to `Expense` type:
```typescript
spread_monthly: boolean;
```

---

## 4. Frontend Changes

### 4.1 `ExpenseModal.tsx` — spread_monthly toggle

**When visible:** Only when `type === "RECURRING"` AND `frequency` is `"QUARTERLY"` or `"YEARLY"`.

**UI element:** Toggle switch (same pattern as the auto-debit toggle already in the modal).

**Label:** "Repartir sur chaque mois"
**Subtitle:** "Divise le montant sur 3 mois (trimestriel) ou 12 mois (annuel)"

**State:** `const [spreadMonthly, setSpreadMonthly] = useState(expense?.spread_monthly ?? false);`

**Reset behavior:** When frequency changes away from QUARTERLY/YEARLY, reset `spreadMonthly` to `false`.

**Data submission:** Add `spread_monthly` to the data object passed to `createExpense`/`updateExpense`, but only when frequency is QUARTERLY or YEARLY. Otherwise, always send `false`.

---

## 5. Files to Create/Modify

| File | Action | What changes |
|------|--------|-------------|
| `scripts/migrate-spread-monthly.mjs` | CREATE | Add `spread_monthly` column to expenses table |
| `lib/types.ts` | MODIFY | Add `spread_monthly: boolean` to Expense type |
| `lib/actions/monthly-expenses.ts` | MODIFY | Fix `calcDueDateForMonth` + spread_monthly in generation loop |
| `lib/actions/expenses.ts` | MODIFY | Add spread_monthly to create/update input and SQL. `getMonthlySummaryBySection()` reviewed — no change needed (see 3.3) |
| `components/ExpenseModal.tsx` | MODIFY | Add spread_monthly toggle for QUARTERLY/YEARLY |

---

## 6. Risks and Mitigations

### R1 — Existing monthly_expenses rows for current month are wrong (HIGH)

**Risk:** Users who already generated March 2026 expenses have QUARTERLY/YEARLY entries that shouldn't be there.

**Mitigation:** The fix only affects future generation calls. Existing `monthly_expenses` rows are NOT automatically cleaned. However, since generation uses `ON CONFLICT (expense_id, month) DO NOTHING`, re-running generation won't create duplicates. The wrong entries from before the fix will persist.

**Recommendation:** Document in release notes that users should manually delete incorrect QUARTERLY/YEARLY entries for the current month. OR provide a one-time cleanup in the migration script that deletes monthly_expenses where the expense is QUARTERLY/YEARLY and the month is not a due month. This cleanup is OPTIONAL and should be a separate step with a confirmation prompt.

### R2 — next_due_date is null for some QUARTERLY/YEARLY expenses (MEDIUM)

**Risk:** If `next_due_date` is null, we cannot determine the reference month. The design falls back to generating every month (degraded behavior identical to current bug).

**Mitigation:** This is acceptable because:
1. `next_due_date` is populated by `calcNextDueDate()` on create/update when `recurrence_day` is provided
2. Expenses without `recurrence_day` already skip the block that generates dates
3. The edge case is: QUARTERLY/YEARLY with `recurrence_day` set but `next_due_date` null — unlikely given the create flow, but possible for old data

**Long-term:** Consider a data fix migration to backfill `next_due_date` for expenses that have `recurrence_day` but null `next_due_date`.

### R3 — Multiplier change breaks monthly totals display (MEDIUM)

**Risk:** Changing the multiplier for QUARTERLY/YEARLY from 1/3 and 1/12 to 1 (full amount) changes the amount stored in `monthly_expenses`. Dashboard totals will show the full quarterly/yearly amount in due months instead of the monthly equivalent.

**Mitigation:** This is the CORRECT behavior. A quarterly bill of $300 should show as $300 in the months it's due, not $100 every month. The `spread_monthly` option exists for users who prefer the monthly equivalent view.

### R4 — Rounding error on spread amounts (LOW — F-003 fix)

**Risk:** When spread_monthly=true, `$100 QUARTERLY / 3 = $33.33/month = $99.99 total` (1-cent loss per quarter). Similarly, amounts not evenly divisible by 12 for YEARLY will accumulate rounding drift.

**Decision: Accepted limitation.**

Rationale:
1. The maximum drift is 1 cent per period (3 months or 12 months). Over a year, a quarterly charge loses at most 4 cents, a yearly charge at most 1 cent.
2. This is a personal budgeting app, not an accounting system. Sub-cent precision is not a user expectation.
3. The "last month absorbs delta" approach adds complexity (need to know which month is "last" in the period, track cumulative amounts) for negligible user value.
4. `Math.round(amount / periodCount * 100) / 100` is the standard rounding used throughout the codebase (see existing multiplier calculations at line 129). Consistency with the existing approach is preferred.

**If users report this as a problem:** the fix is to compute `remainingAmount = totalAmount - (spreadAmount * (periodCount - 1))` for the last month of each period. This can be done as a follow-up without schema changes.

### R5 — No test suite (LOW)

**Risk:** No automated tests to verify the fix or catch regressions.

**Mitigation:** Manual testing via Playwright MCP after implementation. The logic is concentrated in two pure-ish functions (`calcDueDateForMonth` and the generation loop), making future unit testing straightforward.

---

## 7. Implementation Order

1. **Migration script** — `scripts/migrate-spread-monthly.mjs` (create)
2. **Type** — `lib/types.ts` (add spread_monthly to Expense)
3. **Backend fix** — `lib/actions/monthly-expenses.ts` (fix calcDueDateForMonth + generation loop)
4. **Backend CRUD** — `lib/actions/expenses.ts` (add spread_monthly to create/update)
5. **Frontend** — `components/ExpenseModal.tsx` (add spread_monthly toggle)
6. **Run migration** — Execute on local DB
7. **Validate** — Playwright MCP end-to-end verification

---

## 8. Acceptance Criteria Mapping

| AC | Implementation |
|----|---------------|
| YEARLY due in June, generate March = no entry | `calcDueDateForMonth` returns null when `monthNum !== refMonth` for YEARLY |
| QUARTERLY due Jan/Apr/Jul/Oct, generate Feb = no entry | `calcDueDateForMonth` returns null when `(monthNum - refMonth) % 3 !== 0` for QUARTERLY |
| YEARLY with spread_monthly=true, any month = entry with amount/12 | Generation loop checks `spread_monthly`, divides amount by 12, generates every month |
