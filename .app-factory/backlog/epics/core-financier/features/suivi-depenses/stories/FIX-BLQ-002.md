# FIX-BLQ-002 — Yearly and quarterly expenses generated every month instead of their due month

## Type
FIX

## Severity
BLOQUANT

## Feature
suivi-depenses

## Description
In monthly-expenses.ts:37-41, the generation logic creates monthly_expense entries for YEARLY and QUARTERLY templates every single month, regardless of their actual due month. This inflates the monthly expected total, corrupts the dashboard balance, and makes the budget unusable for users with annual or quarterly charges (insurance, taxes, subscriptions).

## Acceptance Criteria
Given a YEARLY expense template due in June
When monthly expenses are generated for March
Then no entry is created for that expense in March

Given a QUARTERLY expense template due in Jan/Apr/Jul/Oct
When monthly expenses are generated for February
Then no entry is created for that expense in February

Given a YEARLY expense with `spread_monthly = true`
When monthly expenses are generated for any month
Then the entry is created with amount = annual_amount / 12

## Technical Notes
- Files to modify: `src/app/actions/monthly-expenses.ts`, `src/components/ExpenseModal.tsx`, DB migration (add `spread_monthly` boolean column to expenses)
- Root cause: Generation loop iterates all templates without checking frequency vs current month
- Fix approach: (1) Add `spread_monthly` boolean field to expenses table. (2) For YEARLY: generate only in due_month unless spread_monthly=true. (3) For QUARTERLY: generate only in due_month, due_month+3, due_month+6, due_month+9 unless spread_monthly=true. (4) When spread, divide amount by period count.
- Dependencies: FIX-BLQ-003 and FIX-BLQ-004 accuracy depends on correct totals from this fix

## Size
M
