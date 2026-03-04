# FIX-BLQ-001 — Recurrence day defaults to '1' instead of empty for non-recurring expenses

## Type
FIX

## Severity
BLOQUANT

## Feature
charges-fixes

## Description
In ExpenseModal.tsx:32, `recurrence_day` defaults to `'1'` for all expenses, including one-time expenses that should not have a recurrence day. This causes `autoMarkOverdue()` to incorrectly flag one-time expenses as overdue on the 1st of each month, corrupting the overdue tracking and the financial health score downstream.

## Acceptance Criteria
Given a user creates a one-time (non-recurring) expense
When the expense is saved
Then `recurrence_day` is NULL in the database and `autoMarkOverdue()` skips expenses with null `due_date`

Given a user creates a recurring expense (MONTHLY, BIWEEKLY, etc.)
When they do NOT specify a recurrence day
Then the field remains empty and the form shows a validation hint (day is required for recurring expenses)

## Technical Notes
- Files to modify: `src/components/ExpenseModal.tsx`, `src/app/actions/monthly-expenses.ts`
- Root cause: Default value `'1'` assigned unconditionally at form init; `autoMarkOverdue()` does not guard against null `due_date`
- Fix approach: Default `recurrence_day` to `''` (empty string). Make day required only when frequency != ONE_TIME. Update `autoMarkOverdue()` to skip entries where `due_date` is null.
- Dependencies: FIX-BLQ-004 (health score) depends on this fix

## Size
S
