# PROG-004 Build Phase

**Date:** 2026-03-06
**Agent:** af-builder (build mode)
**Story:** PROG-004 - UI suivi progressif dans la page depenses

---

## Implementation Summary

All 7 ACs implemented in a single atomic commit following the validated design.

### Design review findings addressed

- **M1:** getDisplayGroup() checks OVERDUE/DEFERRED BEFORE progressive logic (guard clause at top)
- **M2:** autoMarkPaidForAutoDebit excludes progressives via NOT EXISTS subquery
- **M3:** ExpenseGroupKey type defined in lib/types.ts (not constants.ts)

### Files Modified

| File | Changes |
|------|---------|
| `lib/types.ts` | Added `is_progressive: boolean` to MonthlyExpense, added `ExpenseGroupKey` type |
| `lib/constants.ts` | Extended GROUP_ORDER, GROUP_LABELS, STATUS_STYLES with IN_PROGRESS |
| `lib/actions/monthly-expenses.ts` | getMonthlyExpenses: LEFT JOIN expenses for is_progressive. getMonthSummary: CASE WHEN for progressive paid_amount. autoMarkPaidForAutoDebit: NOT EXISTS exclude |
| `lib/expense-display-utils.ts` | Added expense-in-progress icon variant, extended getExpenseIconVariant/getStatusBadge/getStatusLabel |
| `components/DepensesTrackingClient.tsx` | Added getDisplayGroup(), updated grouping logic, progressive-safe handleToggle |
| `components/ExpenseTrackingRow.tsx` | Progress bar with "X $ / Y $", over-budget red, hide toggle for progressives, in-progress icon |
| `components/depenses/ExpenseActionSheet.tsx` | add-transaction and history sub-views, conditional action menu for progressives |
| `components/depenses/StatusGroupSection.tsx` | Widened type from MonthlyExpenseStatus to ExpenseGroupKey |

### Files Created

| File | Purpose |
|------|---------|
| `__tests__/unit/progressive-expenses.test.ts` | 21 unit tests for display group logic, icon variants, badges, labels, progress calculations |

### Key Decisions

1. **autoMarkPaidForAutoDebit exclusion (M2):** Used NOT EXISTS subquery instead of JOIN to keep the UPDATE statement clean. Progressives should never be auto-marked PAID since they accumulate via sub-transactions.

2. **Display status derivation in ExpenseTrackingRow:** The row component derives its own display status (matching getDisplayGroup logic) to show correct badge/icon without needing the parent to pass the computed group. This avoids prop drilling while keeping the logic consistent.

3. **No delegation to design-integrator:** All UI changes modify existing components following existing patterns (progress bar reuses monument pattern, sub-views follow edit/defer pattern). No new pages or components requiring design-integrator.

## Bug Fix: DECIMAL String Comparison (CRITICAL)

Neon PostgreSQL returns DECIMAL columns as strings. `"350.00" < "1000.00"` evaluates to `false` in JS (lexicographic comparison: "3" > "1"). This caused progressive expenses to never match "IN_PROGRESS" group.

**Fix:** Added `Number()` casts in `getDisplayGroup()` (DepensesTrackingClient.tsx) and `ExpenseTrackingRow.tsx` (isOverBudget, progressPct, displayStatus).

## Test Results

- **Baseline:** 159 tests passing
- **After:** 180 tests passing (21 new)
- **Build:** Clean, no TypeScript errors

## Visual Validation (Playwright)

- AC1 (progress bar): teal bar under 475.50/1000 — screenshot .tmp/prog-004-en-cours-group.png
- AC2 (add purchase): added 125.50 "Maxi semaine 3", paid_amount updated to 475.50
- AC3 (transaction sheet): form with amount + note, submits correctly
- AC4 (over-budget red): pushed to 1075.50/1000, red text + red bar — screenshot .tmp/prog-004-over-budget.png
- AC5 (history): 3 transactions shown, ordered by date desc, with notes
- AC6 (monument): $2097/$3554 after progressive transactions (correct)
- AC7 (status grouping): "En cours" group for partial, "Paye" for completed

## Discoveries

- **DISC-PROG-004-001 (BUG, resolved):** DECIMAL string comparison bug — Neon returns DECIMAL as strings, causing wrong comparisons in progressive logic. Fixed with Number() casts.
