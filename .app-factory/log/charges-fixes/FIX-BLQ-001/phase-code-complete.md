# Code Complete Report: FIX-BLQ-001

Date: 2026-03-04
Level: 1
Scope: [frontend, backend]

## Summary

Fixed recurrence_day defaulting to '1' for all expenses, which caused false OVERDUE markings. Changed default to empty string, made the day field visible (but optional) for all recurring expenses, guarded autoMarkOverdue() and autoMarkPaidForAutoDebit() against null due_date.

## Phases Completed

- Classification: Level 1, scope [frontend, backend]
- Design: Skipped (Level 1)
- Design Review: Skipped (Level 1)
- Build: 2 files modified, 0 new tests (no test suite exists)
- Code Review: Self-reviewed (Level 1 fast track)

## Changes

### components/ExpenseModal.tsx
1. Line 46: Default `day` changed from `'1'` to `''`
2. Line 66: `parseInt(day)` → `day ? parseInt(day) : undefined` to handle empty string
3. Lines 682-706: Day field moved out of `autoDebit` condition, now visible for ALL recurring expenses, labeled "Jour du mois (optionnel)" with placeholder "ex: 15"

### lib/actions/monthly-expenses.ts
4. Line 385: Added `AND due_date IS NOT NULL` guard to `autoMarkOverdue()`
5. Line 403: Added `AND due_date IS NOT NULL` guard to `autoMarkPaidForAutoDebit()` for consistency

## Tests

Baseline: build OK, 0 test suite
Final: build OK
Delta: No test suite available

## Discoveries

None

## AC Verification

- AC1: One-time expense → recurrence_day will be undefined (line 66 guard), autoMarkOverdue skips null due_date (line 385) ✅
- AC2: Recurring without specified day → field shows empty with "(optionnel)" hint, form submits with undefined recurrence_day ✅
