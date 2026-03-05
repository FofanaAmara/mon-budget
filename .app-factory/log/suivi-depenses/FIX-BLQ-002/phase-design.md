# Design Phase Report: FIX-BLQ-002

Date: 2026-03-05

## Summary

Design produced for fixing YEARLY/QUARTERLY expense generation. Key decisions:
1. Separate frequency handling in calcDueDateForMonth (distinct blocks per frequency)
2. Reference month from next_due_date, not recurrence_day
3. Multiplier = 1 for non-spread QUARTERLY/YEARLY (full amount in due month)
4. spread_monthly toggle only for QUARTERLY/YEARLY frequencies
5. Migration: ADD COLUMN spread_monthly BOOLEAN NOT NULL DEFAULT false (SAFE)

## Files Planned

- CREATE: scripts/migrate-spread-monthly.mjs
- MODIFY: lib/types.ts, lib/actions/monthly-expenses.ts, lib/actions/expenses.ts, components/ExpenseModal.tsx

## Risks

- HIGH: Existing incorrect monthly_expenses rows persist (need cleanup consideration)
- MEDIUM: Expenses with null next_due_date degrade to current behavior
- MEDIUM: Dashboard totals will change (correct behavior)
- LOW: No test suite

## Design File

.app-factory/log/suivi-depenses/FIX-BLQ-002/design.md
