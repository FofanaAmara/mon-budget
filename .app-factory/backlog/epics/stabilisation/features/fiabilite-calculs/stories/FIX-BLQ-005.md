# FIX-BLQ-005 — Savings rate formula uses all-time savings / income instead of monthly rate

## Type
FIX

## Severity
BLOQUANT

## Feature
sante-financiere

## Description
In TabSanteFinanciere.tsx:233-234, the savings rate is calculated as `totalSavings / totalIncome` using all-time cumulative values. This produces a meaningless metric that trends toward the historical average and cannot reflect the user's current month savings behavior. A user saving aggressively this month but who had poor savings historically would see a discouraging low score.

The correct formula is: monthly savings contributions / monthly income, giving an actionable snapshot of current financial health.

## Acceptance Criteria
Given a user has $6500 monthly income and contributes $500 to savings this month
When the savings rate is calculated
Then it shows 7.7% ($500 / $6500), not a cumulative historical ratio

Given a user has no savings contributions this month
When the savings rate is calculated
Then it shows 0%, regardless of historical savings balance

## Technical Notes
- Files to modify: `src/components/TabSanteFinanciere.tsx`
- Root cause: Formula uses cumulative `totalSavings / totalIncome` instead of monthly `monthlySavingsContributions / monthlyIncome`
- Fix approach: Replace the savings rate calculation (lines ~233-234) with monthly values. May need to query monthly savings contributions separately if not already available in the component props. (Merges audit MINEUR #11 — savings rate conceptually incorrect)
- Dependencies: None (independent calculation, but ideally deployed with FIX-BLQ-004 for coherent health tab)

## Size
S
