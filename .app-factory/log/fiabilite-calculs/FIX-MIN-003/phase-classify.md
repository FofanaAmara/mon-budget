# Classification: FIX-MIN-003

Date: 2026-03-05
Level: 1
Scope: [data, backend]
Fast track: YES

## Rationale
Single behavior fix: add `manually_edited` boolean column to monthly_incomes, set it true in `updateMonthlyIncomeAmount`, and skip overwrite in generation's ON CONFLICT clause. Migration + 2 code changes.

## Notes
- Migration: `ALTER TABLE monthly_incomes ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN DEFAULT FALSE`
- `updateMonthlyIncomeAmount`: also set `manually_edited = true`
- `generateMonthlyIncomes`: add `AND NOT manually_edited` to ON CONFLICT WHERE clause
