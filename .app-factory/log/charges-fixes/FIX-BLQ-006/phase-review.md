# FIX-BLQ-006 — Code Review

**Date:** 2026-03-05
**Agent:** af-reviewer
**Story:** FIX-BLQ-006 — Modifying a template does not update already-generated monthly_expenses entries
**Scope:** backend
**Level:** 2 (business logic)
**Skills loaded:** af-conventions, af-clean-code, af-clean-architecture, af-documentation

---

## Git Reality Check

| Check | Result |
|-------|--------|
| Files declared in build log match git diff | PASS — `lib/actions/expenses.ts` + `phase-build.md` |
| Undocumented file changes | NONE |
| Uncommitted changes related to story | NONE |
| Tasks marked done with no corresponding change | NONE |

No CRITICAL git findings. Proceeding with review.

---

## Verdict: APPROVED WITH NOTES

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 3 |

---

## Findings

### [MEDIUM] F-1 — Duplicated `currentMonth` computation instead of using existing utility

**File:** `lib/actions/expenses.ts`, lines 201-202 and 226-227
**Skill:** `af-clean-code` § DRY (Pas de connaissance dupliquee)

**Problem:** The inline computation `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` duplicates the existing `currentMonth()` utility exported from `lib/utils.ts:118`, which does exactly the same thing (`toMonthKey(new Date())`). This same pattern now exists in 2 places in `expenses.ts`.

**Impact:** If the month key format ever changes (unlikely but possible), this code would not be updated. Adds cognitive load for readers who may not realize the utility exists.

**Fix:** Replace both inline computations with:
```ts
import { currentMonth } from "@/lib/utils";
// ...
const month = currentMonth();
```
Remove the `const now = new Date();` lines that become unused.

---

### [LOW] F-2 — No transaction wrapping UPDATE + DELETE in `updateExpense()`

**File:** `lib/actions/expenses.ts`, lines 170-210
**Skill:** `af-clean-architecture` § Gestion des erreurs

**Problem:** The UPDATE (template) and DELETE (monthly_expenses) are two independent SQL statements. If the DELETE fails after a successful UPDATE, the template reflects new values but stale monthly_expenses persist until the next dashboard visit triggers regeneration.

**Impact:** Minimal. The regeneration mechanism acts as a self-healing fallback. Additionally, no other action in this file uses transactions — this is a pre-existing pattern consistent with the alpha-stage, single-user context.

**Fix (optional):** Consider wrapping in a transaction when the Neon driver supports it cleanly, or note as TECH_DEBT for when the app graduates to multi-user. No action required now.

---

### [LOW] F-3 — No row-count check before invalidation in `updateExpense()`

**File:** `lib/actions/expenses.ts`, lines 192-210
**Skill:** `af-clean-code` § Gestion des erreurs (Fail fast)

**Problem:** The code does not verify that the UPDATE actually affected a row (i.e., `rows.length > 0`) before proceeding to delete monthly_expenses. If the expense does not exist or does not belong to the user, the DELETE executes unnecessarily.

**Impact:** None in practice — the DELETE WHERE clause includes both `expense_id` and `user_id`, so it will match 0 rows harmlessly. The function already returns `rows[0]` which would be `undefined` if no row was updated, but this is a pre-existing issue in the function, not introduced by this change.

**Fix (optional):** Add a guard `if (rows.length === 0) throw new Error("Expense not found")` before the invalidation block. This would be a broader improvement to the function.

---

### [LOW] F-4 — Duplicate invalidation logic between `updateExpense()` and `deleteExpense()`

**File:** `lib/actions/expenses.ts`, lines 200-210 and 225-234
**Skill:** `af-clean-code` § DRY (Pas de connaissance dupliquee)

**Problem:** The DELETE query for invalidating stale monthly_expenses is identical in both functions (same WHERE clause structure, same status filter, same month comparison). This is the second occurrence — the DRY rule of 3 says to wait for a third occurrence before extracting.

**Impact:** If the invalidation logic changes (e.g., adding a new status to the filter), two places must be updated. However, per the rule of 3, extraction is premature with only 2 occurrences.

**Fix:** No action required now. If a third usage appears (e.g., in a future bulk-update action), extract to a shared helper like `invalidateStaleMonthlyExpenses(expenseId, userId)`.

---

## Acceptance Criteria Cross-Check

| AC | Coverage | Notes |
|----|----------|-------|
| AC-1: Amount change propagates | COVERED | `data.amount !== undefined` triggers invalidation |
| AC-2: Toggling spread_monthly | COVERED | `data.spread_monthly !== undefined` triggers invalidation |
| AC-3: Frequency change | COVERED | `data.recurrence_frequency !== undefined` triggers invalidation |
| AC-4: PAID entries untouched | COVERED | `status IN ('UPCOMING', 'OVERDUE')` excludes PAID |
| AC-5: Deactivating spread_monthly | COVERED | Same as AC-2 — toggle triggers invalidation, regeneration handles the rest |
| Edge: Template deactivation | COVERED | `deleteExpense()` unconditionally invalidates |
| Edge: Multiple future months | COVERED | `month >= currentMonth` catches all future entries |
| Edge: Mid-month after payment | COVERED | PAID entries excluded by status filter |

---

## Security Check

| Check | Result |
|-------|--------|
| Auth enforced (`requireAuth()`) | PASS |
| Ownership enforced (`user_id = ${userId}`) | PASS — present in both DELETE queries |
| SQL injection protection (parameterized) | PASS — tagged template literals |
| PAID entries protected | PASS — status filter excludes them |

---

## Dismissed Concerns

1. **Over-invalidation (deleting when value didn't actually change):** The build log acknowledges this as a conscious design decision. Comparing old vs new values would require an extra SELECT and add complexity for negligible benefit. The regeneration mechanism is idempotent. Acceptable trade-off.

2. **String comparison for month ordering:** `"YYYY-MM"` format ensures correct lexicographic ordering across year boundaries (e.g., `"2025-12" < "2026-01"`). The design document explicitly analyzed this risk. No concern.

3. **No unit tests added:** The story is Level 2, but the codebase currently has no test infrastructure. This is a pre-existing gap, not introduced by this change. Not blocking for this story.

---

## Code Quality Assessment

The implementation is clean, targeted, and faithful to the approved design. The invalidation approach (delete-and-regenerate via the existing `ON CONFLICT DO NOTHING` mechanism) is pragmatic and avoids the complexity of in-place updates with spread_monthly recalculations. The only actionable finding is the duplicated `currentMonth` computation which should use the existing utility from `lib/utils.ts`.
