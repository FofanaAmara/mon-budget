# FIX-BLQ-004 — Financial health score corrupted by wrong coverage formula and upstream data bugs

## Type
FIX

## Severity
BLOQUANT

## Feature
sante-financiere

## Description
In TabSanteFinanciere.tsx:227-237, the health score is corrupted by two compounding issues:
1. The coverage ratio uses `actualTotal` instead of `expectedTotal` (same bug as FIX-BLQ-003 but in the health tab context), inflating the coverage percentage.
2. The overall score formula weights are applied to already-corrupted sub-scores from upstream bugs (FIX-BLQ-001 inflated overdue count, FIX-BLQ-002 inflated expected totals).

Even after upstream fixes, the coverage formula itself needs correction to use expectedTotal.

## Acceptance Criteria
Given a user has $4000 expected expenses and $2500 paid
When the health score calculates coverage
Then coverage = $2500 / $4000 = 62.5%, not $2500 / $2500 = 100%

Given upstream bugs FIX-BLQ-001 and FIX-BLQ-003 are fixed
When the health score recalculates
Then the score reflects accurate overdue counts and accurate balance data

## Technical Notes
- Files to modify: `src/components/TabSanteFinanciere.tsx`
- Root cause: Line 228 uses `actualTotal` for coverage denominator; upstream data is corrupted by FIX-BLQ-001 and FIX-BLQ-002
- Fix approach: Replace `actualTotal` with `expectedTotal` in coverage formula (line ~228). Verify weight distribution in overall score formula. (Merges audit MINEUR #10 — dashboard coverage uses actualTotal)
- Dependencies: Blocked by FIX-BLQ-001, FIX-BLQ-002, FIX-BLQ-003 (data must be correct for score to be meaningful)

## Size
S
