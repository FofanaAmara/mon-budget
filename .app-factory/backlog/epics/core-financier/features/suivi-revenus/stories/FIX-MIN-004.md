# FIX-MIN-004 — Biweekly multiplier inconsistent across codebase (2.17 vs 26/12)

## Type
FIX

## Severity
MINEUR

## Feature
suivi-revenus

## Description
The biweekly-to-monthly multiplier is hardcoded inconsistently across the codebase: some files use `2.17`, others use `26/12` (which equals `2.1666...`), and at least one uses `2`. This creates rounding discrepancies where the same biweekly income produces different monthly totals depending on which page or calculation is displaying it. Users see conflicting numbers across dashboard, income settings, and onboarding.

## Acceptance Criteria
Given any biweekly calculation anywhere in the app
When the multiplier is applied
Then it consistently uses a single canonical constant (26/12)

Given the constant is defined
When a developer searches for biweekly multiplier usage
Then all references point to the shared constant, with no hardcoded magic numbers

## Technical Notes
- Files to modify: `src/app/actions/monthly-incomes.ts`, `src/components/Onboarding.tsx`, and any other files using biweekly multipliers
- Root cause: No shared constant; each file hardcodes its own approximation
- Fix approach: Create a constants file (e.g., `src/lib/constants.ts`) with `BIWEEKLY_MONTHLY_MULTIPLIER = 26 / 12`. Replace all hardcoded values across the codebase.
- Dependencies: FIX-MIN-002, FIX-MIN-007 will naturally use this constant once created

## Size
S
