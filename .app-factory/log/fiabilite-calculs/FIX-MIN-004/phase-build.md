# Build Report: FIX-MIN-004

Date: 2026-03-05
Level: 1
Scope: [backend, frontend]

## Summary

Extracted shared `BIWEEKLY_MONTHLY_MULTIPLIER` (26/12) and `WEEKLY_MONTHLY_MULTIPLIER` (52/12) constants into `lib/constants.ts`. Replaced all hardcoded biweekly multiplier values across 6 files. Fixed two bugs where `* 2` was used instead of `26/12` (~8.3% undercount).

## Files Modified

1. `lib/constants.ts` — Added WEEKLY_MONTHLY_MULTIPLIER and BIWEEKLY_MONTHLY_MULTIPLIER
2. `lib/utils.ts` — calcMonthlyCost and calcMonthlyIncome now use constants
3. `components/Onboarding.tsx` — toMonthly() uses constants instead of 4.33/2.17
4. `lib/actions/monthly-expenses.ts` — monthlyMultipliers map uses constants
5. `lib/actions/monthly-incomes.ts` — Biweekly fallback uses constant instead of * 2
6. `app/parametres/charges/page.tsx` — normalizeToMonthly uses constants
7. `lib/actions/expenses.ts` — Added SQL comment referencing JS constants

## Bug Fixes

- `components/Onboarding.tsx:62` — `2.17` replaced with `26/12` (2.1667)
- `lib/utils.ts:135` — `* 2` replaced with `BIWEEKLY_MONTHLY_MULTIPLIER` (2.1667)
- `lib/actions/monthly-incomes.ts:30` — `* 2` replaced with `BIWEEKLY_MONTHLY_MULTIPLIER` (2.1667)

## Build Output

PASS — all routes compiled successfully, zero errors.

## Commit

- `c084fca` [FIX-MIN-004] extract shared BIWEEKLY_MONTHLY_MULTIPLIER constant

## Notes

- Large diff due to project formatter (Biome) converting single→double quotes on touched files. Logical changes are ~20 lines.
- SQL queries cannot import JS constants — left as literals with cross-reference comment.
