# Code Complete Report: FIX-BLQ-002

Date: 2026-03-05
Level: 2
Scope: [data, backend, frontend]

## Summary

Fixed YEARLY and QUARTERLY expenses being generated every month instead of their due month. Restructured `calcDueDateForMonth()` into separate frequency blocks with proper skip logic. Added `spread_monthly` boolean feature allowing users to spread QUARTERLY/YEARLY charges evenly across all months. Added migration script, updated types, server actions, and ExpenseModal UI.

## Phases Completed

- Classification: Level 2, scope [data, backend, frontend]
- Design: Produced, revised once (3 findings addressed)
- Design Review: APPROVED (attempt 2) — all findings resolved, migration SAFE
- Build: 1 file created, 4 files modified, build SUCCESS
- Code Review: APPROVED WITH NOTES — 0 CRITICAL, 0 HIGH, 2 MEDIUM (1 fixed), 2 LOW

## Files

### Created
- scripts/migrate-spread-monthly.mjs

### Modified
- lib/types.ts (spread_monthly: boolean added to Expense type)
- lib/actions/monthly-expenses.ts (calcDueDateForMonth fix + spread_monthly generation path + dead code cleanup)
- lib/actions/expenses.ts (spread_monthly in create/update)
- components/ExpenseModal.tsx (spread_monthly toggle UI for QUARTERLY/YEARLY)

## Tests

Baseline: build OK, 0 test suite
Final: build OK
Delta: No test suite available

## Discoveries

None

## Commits

- `23a742b` [FIX-BLQ-002] fix quarterly/yearly expenses generating every month
- `eb3b53e` [FIX-BLQ-002] remove dead QUARTERLY/YEARLY entries from multiplier map

## AC Verification

- AC1: YEARLY due June, generate March = no entry — calcDueDateForMonth returns null when monthNum !== refMonth
- AC2: QUARTERLY due Jan/Apr/Jul/Oct, generate Feb = no entry — calcDueDateForMonth returns null when diff % 3 !== 0
- AC3: YEARLY spread_monthly=true, any month = amount/12 — spread path runs first, divides by 12, generates every month

## Migration Required

Run `node scripts/migrate-spread-monthly.mjs` before deploying. SAFE operation (ADD COLUMN with DEFAULT).
