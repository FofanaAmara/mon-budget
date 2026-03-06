# AUDIT-003 — Build Log

**Date:** 2026-03-05
**Agent:** af-builder
**Story:** Extract calcDueDateForMonth + decompose generateMonthlyExpenses

---

## What was done

### 1. Type definition (lib/types.ts)
- Added `CalcDueDateInput` type with `RecurrenceFrequency | null` (per review M-01, not `string | null`)
- Callers cast DB strings to RecurrenceFrequency at the call site

### 2. Extraction to lib/utils.ts
- Extracted `calcDueDateForMonth` as exported pure function
- Extracted `formatDueDate(year, month, day)` as exported helper (per review L-01)
- Used `formatDueDate` inside `calcDueDateForMonth` (eliminated 5x duplication of date formatting)
- Changed WEEKLY/BIWEEKLY check from `includes()` to direct `===` comparison (type safety with RecurrenceFrequency)

### 3. Decomposition of generateMonthlyExpenses (lib/actions/monthly-expenses.ts)
- Extracted `generateRecurringInstances` (~65L)
- Extracted `generateOneTimeInstances` (~20L)
- Extracted `generateDebtPaymentInstances` (~35L)
- `generateMonthlyExpenses` is now a ~10L orchestrator
- Used `formatDueDate` for monthStart/monthEnd and syntheticDueDate (eliminated duplication)
- Added `RecurringExpenseRow` type to replace inline type assertion
- Moved `MONTHLY_MULTIPLIERS` to module-level const

### 4. Tests (__tests__/unit/calc-due-date.test.ts)
- 22 tests total (design planned 17, added extras per review)
- Covers all 6 frequencies + edge cases
- Added BIMONTHLY with null next_due_date (per review recommendation)
- Added formatDueDate tests (2)
- Added edge cases for null frequency with/without next_due_date

## Review findings addressed

| Finding | Resolution |
|---------|-----------|
| M-01 (type safety) | CalcDueDateInput uses `RecurrenceFrequency \| null`, callers cast at call site |
| M-02 (spread_monthly AC) | Created DISC-004 — logic is in I/O function, not testable as unit test |
| L-01 (export formatDueDate) | Exported and used in both utils.ts and monthly-expenses.ts |

## Decisions

- **Cast at call site vs helper function:** Chose inline cast (`freq as RecurrenceFrequency`) over creating a `toRecurrenceFrequency()` helper. The cast is simple and happens at exactly 2 call sites. A helper would be YAGNI at this point.

## Test results

```
Test Files  4 passed (4)
     Tests  148 passed (148)  -- up from 126 (+22 new)
```

## Build output

```
Next.js 16.1.6 (Turbopack)
Compiled successfully in 3.5s
```

## Exit checklist

1. [x] Build passes — `npm run build` successful
2. [x] Migrations — N/A (no DB changes)
3. [x] Dev server — N/A (refactoring, no UI changes)
4. [x] Each AC tested:
   - AC1 (extraction + importable): calcDueDateForMonth exported from lib/utils.ts, imported in test file without "use server" error
   - AC2 (6 frequencies tested): MONTHLY, BIMONTHLY, QUARTERLY, YEARLY, WEEKLY, BIWEEKLY all covered
   - AC3 (day 31 clamping Feb): test "clamps day 31 to February 28" + leap year test
   - AC4 (BIMONTHLY skip): test "skips odd-offset month from reference"
   - AC5 (QUARTERLY skip): tests at offset 1 and 2
   - AC6 (YEARLY skip): test "skips all other months"
   - AC7 (spread_monthly): DISC-004 created — logic in I/O function, not unit-testable
   - AC8 (decomposition): generateRecurringInstances, generateOneTimeInstances, generateDebtPaymentInstances
   - AC9 (build + tests pass): 148 tests pass, build succeeds
5. [x] Visual scan — N/A (no UI changes)
6. [x] Defects fixed — N/A
