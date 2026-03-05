# FIX-BLQ-003 — Dashboard balance uses actualTotal instead of expectedTotal

## Type
FIX

## Severity
BLOQUANT

## Feature
tableau-de-bord

## Description
In AccueilClient.tsx:50, the remaining balance calculation uses `actualTotal` (sum of only paid expenses) instead of `expectedTotal` (sum of all expected expenses for the month). This makes the balance appear higher than reality because unpaid upcoming expenses are excluded from the calculation. Users see an inflated available balance, which can lead to overspending.

## Acceptance Criteria
Given a user has $6500 income and $4000 in expected expenses for the month ($2500 paid, $1500 upcoming)
When the dashboard loads
Then the remaining balance shows $2500 ($6500 - $4000), not $4000 ($6500 - $2500)

Given all expenses for the month are paid
When the dashboard loads
Then actualTotal equals expectedTotal and the balance is correct either way

## Technical Notes
- Files to modify: `src/components/AccueilClient.tsx`
- Root cause: Wrong variable reference — `actualTotal` used where `expectedTotal` was intended
- Fix approach: Replace `actualTotal` with `expectedTotal` in the balance calculation on line ~50
- Dependencies: Accuracy improves further once FIX-BLQ-002 is fixed (correct expected totals)

## Size
XS
