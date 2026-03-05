# Build Report: FIX-MIN-003

Date: 2026-03-05
Level: 1
Scope: [data, backend]

## Summary

Added `manually_edited` boolean flag to monthly_incomes to prevent income generation from overwriting user-edited entries.

## Files Created

1. `scripts/migrate-manually-edited.mjs` — Adds `manually_edited BOOLEAN DEFAULT FALSE` column

## Files Modified

1. `lib/actions/monthly-incomes.ts` — Updated `updateMonthlyIncomeAmount`, `generateMonthlyIncomes` ON CONFLICT, and `markIncomeAsExpected`
2. `.app-factory/docs/data-model.md` — Added manually_edited column documentation

## Implementation Decisions

1. Boolean flag approach (vs timestamp comparison) — simpler, explicit, and reversible via `markIncomeAsExpected`
2. Reset flag in `markIncomeAsExpected` — allows users to revert to template-driven values

## Build Output

PASS — all routes compiled, zero errors.

## Commits

- `5b345d2` [FIX-MIN-003] preserve manually edited monthly income entries
- `d7d7eb5` [FIX-MIN-003] update data-model.md with manually_edited column
