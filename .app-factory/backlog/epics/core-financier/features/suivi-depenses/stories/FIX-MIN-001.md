# FIX-MIN-001 — Deferred expense loses expense_id link to template

## Type
FIX

## Severity
MINEUR

## Feature
suivi-depenses

## Description
In monthly-expenses.ts:302, when an expense is deferred to the next month, the new monthly_expense entry is created without preserving the `expense_id` foreign key that links it back to the original expense template. This breaks the template-transaction relationship, making the deferred entry an orphan that won't be regenerated correctly in future months and won't appear in template-based reports.

## Acceptance Criteria
Given a user defers a monthly expense to the next month
When the deferred entry is created
Then it retains the same `expense_id` as the original entry

Given a deferred expense exists in the next month
When the monthly generation runs
Then it does not create a duplicate entry for that template (deferred entry already satisfies it)

## Technical Notes
- Files to modify: `src/app/actions/monthly-expenses.ts`
- Root cause: The defer function at line ~302 creates a new row but omits `expense_id` from the INSERT
- Fix approach: Pass `expense_id` through in the defer INSERT statement
- Dependencies: None

## Size
XS
