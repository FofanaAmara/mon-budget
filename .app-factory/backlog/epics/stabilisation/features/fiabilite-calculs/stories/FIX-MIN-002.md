# FIX-MIN-002 — Biweekly income without anchor date uses amount*2 approximation

## Type
FIX

## Severity
MINEUR

## Feature
suivi-revenus

## Description
In monthly-incomes.ts:30, biweekly income generation uses `amount * 2` as the monthly total when no anchor date is set. This underestimates the actual biweekly income because biweekly means 26 pay periods per year (26/12 = 2.1667 per month), not 24 (2 per month). Over a year, this discrepancy is ~8.3% of one paycheck, which compounds into inaccurate budget projections.

## Acceptance Criteria
Given a biweekly income of $3000 per paycheck with no anchor date
When monthly income is generated
Then the monthly amount is $3000 * 26/12 = $6500, not $3000 * 2 = $6000

Given a biweekly income with an anchor date set
When monthly income is generated
Then the system counts actual pay dates in the month (2 or 3) and uses the exact amount

## Technical Notes
- Files to modify: `src/app/actions/monthly-incomes.ts`
- Root cause: Simplified `amount * 2` multiplier instead of `amount * 26/12`
- Fix approach: Replace `amount * 2` with `amount * (26/12)` for the no-anchor fallback. Ideally, prompt user to set an anchor date for biweekly income.
- Dependencies: Related to FIX-MIN-004 (biweekly multiplier consistency)

## Size
XS
