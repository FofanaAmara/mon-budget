# PROG-004 — Code Review

**Date:** 2026-03-06
**Reviewer:** af-reviewer
**Story:** PROG-004 — UI : suivi progressif dans la page depenses
**Level:** 2 | **Scope:** frontend, backend

---

## Verdict: APPROVED WITH NOTES

**Findings:** 0 CRITICAL, 1 HIGH, 3 MEDIUM, 2 LOW

---

## Step 0 — Git Reality Check

**Commit:** `2010eec` — [PROG-004] add progressive expense UI tracking in depenses page

| Declared files | Git diff | Match |
|---|---|---|
| lib/types.ts | Modified | OK |
| lib/constants.ts | Modified | OK |
| lib/expense-display-utils.ts | Modified | OK |
| lib/actions/monthly-expenses.ts | Modified | OK |
| components/DepensesTrackingClient.tsx | Modified | OK |
| components/ExpenseTrackingRow.tsx | Modified | OK |
| components/depenses/StatusGroupSection.tsx | Modified | OK |
| components/depenses/ExpenseActionSheet.tsx | Modified | OK |
| __tests__/unit/progressive-expenses.test.ts | Created | OK |

**Uncommitted changes detected:**
- `components/DepensesTrackingClient.tsx` — adds Number() casts for DECIMAL-as-string bug
- `components/ExpenseTrackingRow.tsx` — same Number() casts

These uncommitted changes are the fix for the Neon DECIMAL string comparison bug documented in the build context. They are NOT in the commit. This is a **finding** (see HIGH-1 below).

**No fraudulent claims detected.** All declared files match git history. No undocumented changes.

---

## HIGH

### HIGH-1 — Uncommitted Number() cast fixes not in commit

**File:** `components/DepensesTrackingClient.tsx:42-43`, `components/ExpenseTrackingRow.tsx:98-99`
**Skill:** `af-conventions` § Git Workflow & Commit Conventions
**Problem:** The Neon DECIMAL-as-string bug fix (Number() casts) exists as uncommitted working tree changes. The committed code at `2010eec` still uses raw string comparisons that will fail: `"350.00" < "1000.00"` evaluates to `false` (lexicographic), breaking AC1/AC4/AC7 for any amount with different digit counts.
**Impact:** The committed version is functionally broken for progressive expenses. If this code were deployed from the commit alone, display grouping and over-budget detection would be incorrect.
**Fix:** Stage and commit these changes before proceeding. This is a data integrity issue — the committed code does not match the working code.

---

## MEDIUM

### MEDIUM-1 — Duplicated getDisplayGroup logic between component and tests

**File:** `__tests__/unit/progressive-expenses.test.ts:41-51`, `components/DepensesTrackingClient.tsx:35-52`
**Skill:** `af-clean-code` § DRY (Knowledge duplication)
**Problem:** The `getDisplayGroup` function is copied inline in both the component and the test file. The test file's copy does NOT include the Number() cast fix, meaning it tests against the old broken logic. If the real function changes, the test copy will silently diverge.
**Impact:** Tests may pass while the real implementation differs. The test's copy currently lacks Number() casts, so it would fail on actual DB data (strings vs numbers).
**Fix:** Extract `getDisplayGroup` into a shared utility (e.g., `lib/expense-display-utils.ts` where the other display functions live), export it, and import it in both the component and the tests. This eliminates the duplication and ensures tests exercise the real code.

### MEDIUM-2 — addExpenseTransaction does not verify expense is progressive

**File:** `lib/actions/expense-transactions.ts:15-40`
**Skill:** `af-clean-code` § Error handling (Fail fast)
**Problem:** `addExpenseTransaction` accepts any `monthlyExpenseId` and increments `paid_amount` without checking that the target monthly expense has `is_progressive = true`. A caller could add transactions to a non-progressive expense, corrupting its data.
**Impact:** Data integrity risk — though currently the UI guards against this (only progressive expenses show "Ajouter un achat"), the server action itself is unprotected. Defense in depth dictates the server should validate.
**Fix:** Add a guard query that checks `e.is_progressive = true` via the joined expenses table, or add a WHERE clause: `WHERE id = $id AND user_id = $userId AND EXISTS (SELECT 1 FROM expenses e WHERE e.id = me.expense_id AND e.is_progressive = true)`. Alternatively, throw an error if the expense is not progressive.

### MEDIUM-3 — ExpenseActionSheet component exceeds size threshold (1215 lines)

**File:** `components/depenses/ExpenseActionSheet.tsx:1-1215`
**Skill:** `af-clean-code` § Functions (Long Method), Anti-patterns #1 (Long Method), #2 (God Object)
**Problem:** At 1215 lines, this file is well beyond the 30-line function guideline. The main component function itself contains 6 render branches (actions, defer, edit, delete, add-transaction, history). While sub-components are extracted (SheetWrapper, SheetHandle, ActionItem), each view branch is a full-page render with inline styles and logic.
**Impact:** Readability and maintenance cost. Adding a new view (e.g., "edit note") requires modifying an already massive file.
**Fix:** Extract each view into its own component file under `components/depenses/sheets/` (e.g., `AddTransactionSheet.tsx`, `HistorySheet.tsx`, `DeferSheet.tsx`). The main ExpenseActionSheet becomes a thin router. This is not blocking for this story but should be addressed before adding more views. Note: this file was already large before PROG-004 — the story added ~330 lines for two new views. Consider creating a discovery.

---

## LOW

### LOW-1 — Inconsistent accent handling in empty state text

**File:** `components/depenses/ExpenseActionSheet.tsx:313`
**Skill:** `af-clean-code` § Conventions
**Problem:** Line 313 reads `"Aucun achat enregistre"` (missing accent on "enregistre" — should be "enregistre" with accent). Other strings in the same file correctly use accents (e.g., "Reporté", "irréversible").
**Fix:** Change to `"Aucun achat enregistré"`.

### LOW-2 — `useRef` and `useEffect` imported but ref focus pattern could use autoFocus

**File:** `components/depenses/ExpenseActionSheet.tsx:3, 983-985`
**Skill:** `af-clean-code` § Simplicity (KISS)
**Problem:** The SheetWrapper uses `useRef` + `useEffect` to focus the dialog on mount. This could be simplified with the `autoFocus` attribute on the div (though autoFocus on divs requires tabIndex, which is already present). Minor simplification opportunity.
**Fix:** No action required — current pattern works correctly. Noted for awareness.

---

## Dismissed Concerns

1. **Inline styles vs CSS modules/Tailwind** — This codebase consistently uses inline styles across all components. This is a project convention, not a violation. No finding.

2. **Number() casts scattered across files** — The DECIMAL-as-string issue from Neon could be centralized (e.g., a mapper at the query layer). However, this is a systemic issue beyond PROG-004's scope. The fix applied (Number() at usage site) is correct and minimal. This belongs in a discovery, not a finding against this story.

3. **getExpenseIconVariant receives `expense.paid_amount` (still a string) at line 123** — In `ExpenseTrackingRow.tsx:123`, the raw `expense.paid_amount` is passed to `getExpenseIconVariant` which compares `paidAmount > 0`. In JS, `"350.00" > 0` is `true` due to implicit coercion, so this works by coincidence. Not flagged because the function's parameter type is `number` with default `0`, and the comparison is truthiness-based (> 0), where string coercion produces correct results. However, it's fragile — the Number() cast should ideally be applied before passing. This is covered implicitly by MEDIUM-1's recommendation to centralize.

4. **Security (auth, ownership)** — All server actions use `requireAuth()` and filter by `user_id`. The SQL queries properly parameterize inputs. Zod validation is applied. No security findings.

5. **Monument CASE WHEN query** — The `getMonthSummary` query correctly uses `CASE WHEN e.is_progressive = true THEN me.paid_amount WHEN me.status = 'PAID' THEN me.amount ELSE 0 END` for paid_total. This correctly implements AC6.

---

## Overall Assessment

Good implementation with clean separation of concerns. The progressive expense logic is well-designed — using a frontend-only `ExpenseGroupKey` without adding a new DB status is the right architectural choice. The M1 priority rule (OVERDUE/DEFERRED checked first) is correctly implemented in all three locations. The Neon DECIMAL-as-string bug was correctly identified and fixed.

The single HIGH finding is a commit hygiene issue — the fix exists but is not committed. The MEDIUM findings are legitimate maintainability concerns but do not block the story's functional correctness.

---

## Test Output

```
Test Files  5 passed (5)
Tests       180 passed (180)
Duration    290ms
```

All 180 tests pass, including 21 new tests for progressive expenses.
