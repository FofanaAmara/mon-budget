# Review — AUDIT-002: Write unit tests for financial calculation functions

**Date:** 2026-03-05
**Reviewer:** af-reviewer
**Commit:** 9a4a6dd
**Level:** 1 (fast track)
**Scope:** backend

---

## Step 0 — Git Reality Check

| Check | Result |
|-------|--------|
| Files declared modified | lib/constants.ts, lib/utils.ts, __tests__/unit/utils.test.ts, __tests__/unit/month-utils.test.ts |
| Files changed in git | Same 4 files — match |
| Uncommitted changes | None relevant (only untracked .app-factory/log/ files) |
| Commit message | `[AUDIT-002] add unit tests for financial calculation functions` — follows conventions |

**No discrepancies.** All declared files match git changes.

---

## Scope Detection

Backend scope detected. Skills loaded:
- Tier 1: af-clean-code, af-clean-architecture, af-documentation, af-conventions
- Tier 2: (no API/security changes — tests only + minor refactor)
- Tier 3: af-testing-strategy (validation)

---

## Production Code Changes

### lib/constants.ts — MS_PER_DAY extraction

- **Change:** Added `export const MS_PER_DAY = 86_400_000;`
- **Assessment:** Correct value (24 * 60 * 60 * 1000 = 86,400,000). Named constant replaces magic number. Follows `UPPER_SNAKE_CASE` convention. Well-documented with a comment explaining usage.
- **Verdict:** Clean. No behavior change.

### lib/utils.ts — calcNextDueDate refactoring

- **Change:** Added optional `referenceDate: Date = new Date()` parameter.
- **Backward compatibility:** Confirmed. Both callers in `lib/actions/expenses.ts` (lines 91 and 153) use the 2-arg form `calcNextDueDate(frequency, day)`. The default parameter preserves existing behavior.
- **Implementation:** `const today = new Date(referenceDate)` creates a defensive copy, preventing mutation of the caller's Date object. `setHours(0,0,0,0)` still normalizes to midnight.
- **Verdict:** Clean, backward-compatible, enables deterministic testing.

### lib/utils.ts — daysUntil MS_PER_DAY usage

- **Change:** Replaced `(1000 * 60 * 60 * 24)` with imported `MS_PER_DAY`.
- **Assessment:** Identical value, eliminates magic number. No behavior change.
- **Verdict:** Clean.

### Remaining magic numbers

Two occurrences of `86400000` (without underscore) remain in `lib/utils.ts`:
- Line 199: `new Date(cursor.getTime() + 14 * 86400000)` in `countBiweeklyPayDatesInMonth`
- Line 238: `cursor.getTime() - 14 * 86400000` in `getNextBiweeklyPayDate`

And one in the test file:
- `__tests__/unit/utils.test.ts` line 353: `7 * 86_400_000`

These are noted as findings below.

---

## Test Quality Assessment

### __tests__/unit/utils.test.ts (46 tests)

**Test structure:**
- Clean separation by describe blocks per function
- Section comments (`// ---`) improve readability
- `makeExpense` helper is well-typed (`Partial<Expense> & Pick<Expense, "amount">`) — prevents missing required fields while keeping tests concise

**Coverage analysis by function:**

| Function | Tests | Edge cases | Assessment |
|----------|-------|------------|------------|
| toMonthKey | 2 | Standard + padding | Adequate (existing) |
| currentMonth | 1 | Basic | Adequate (existing) |
| formatCAD | 4 | Zero, negative, large number | Good |
| formatShortDate | 3 | Null, string, Date (UTC) | Good |
| calcMonthlyCost | 8 | All 6 frequencies + ONE_TIME + null freq | Excellent — all branches covered |
| calcMonthlyIncome | 7 | VARIABLE (with/without estimated), MONTHLY, BIWEEKLY, YEARLY, null amount | Excellent |
| calcMonthlySuggested | 4 | Normal, past date, exceeded target, 1 month | Good |
| calcNextDueDate | 8 | Backward compat, past/future day, day 31 clamping, QUARTERLY, YEARLY, WEEKLY | Very good |
| countBiweeklyPayDatesInMonth | 4 | 2-date month, 3-date month, Date object input, all 12 months | Good |
| daysUntil | 5 | Null, future, past, today, ISO string | Good |

**Assertion quality:**
- Uses `toBeCloseTo` for floating-point comparisons (calcMonthlyCost, calcMonthlyIncome) — correct
- Uses `toBe` for exact integer/string comparisons — correct
- Uses `toBeInstanceOf(Date)` for type checks — correct
- Comments explain expected behavior clearly (e.g., "Jan 20, day=15 -> Feb 15")

**Determinism:**
- calcNextDueDate tests use fixed `referenceDate` — deterministic, will not flake
- daysUntil tests use relative dates (`future.setDate(future.getDate() + 10)`) — deterministic within test execution
- calcMonthlySuggested tests use relative dates — deterministic
- ISO string test in daysUntil allows +/- 1 day tolerance for timezone — pragmatic

**Potential false positives:** None detected. All assertions test meaningful behavior.

### __tests__/unit/month-utils.test.ts (11 tests)

**Coverage:**

| Function | Tests | Edge cases | Assessment |
|----------|-------|------------|------------|
| prevMonth | 3 | Year boundary, normal, December | Good |
| nextMonth | 3 | Year boundary, normal, January | Good |
| parseMonth | 3 | Normal, January, December | Good |
| monthLabel | 2 | March, January | Adequate |

**Assertion quality:**
- Uses regex matches (`/mars/i`) for locale-dependent output — resilient to formatting variations
- Year boundary tests cover the critical edge case

---

## Findings

### MEDIUM — M1: Remaining magic numbers in production code

**File:** `lib/utils.ts:199`, `lib/utils.ts:238`
**Skill:** af-clean-code SS Nommage — "Constantes nommees, pas de magic numbers"
**Problem:** Two occurrences of `86400000` remain in `countBiweeklyPayDatesInMonth` and `getNextBiweeklyPayDate`, while `MS_PER_DAY` was extracted for the same value in the same file.
**Impact:** Inconsistency within the same file. If the constant's semantics ever change (unlikely for MS_PER_DAY, but principle applies), these would be missed.
**Fix:** Replace `14 * 86400000` with `14 * MS_PER_DAY` in both locations. The constant is already imported.

### LOW — L1: Magic number in test file

**File:** `__tests__/unit/utils.test.ts:353`
**Skill:** af-clean-code SS Nommage — "Constantes nommees, pas de magic numbers"
**Problem:** `7 * 86_400_000` used directly in test assertion instead of `7 * MS_PER_DAY`.
**Impact:** Minor inconsistency. Test files have more tolerance for inline constants, but since `MS_PER_DAY` is already imported in the file's scope (via the tested function), using it would improve clarity.
**Fix:** Import `MS_PER_DAY` from `@/lib/constants` and use `7 * MS_PER_DAY`.

### LOW — L2: Missing test for BIMONTHLY and BIWEEKLY in calcNextDueDate

**File:** `__tests__/unit/utils.test.ts` (calcNextDueDate describe block)
**Skill:** af-testing-strategy — branch coverage
**Problem:** `calcNextDueDate` handles 6 frequency types (MONTHLY, WEEKLY, BIWEEKLY, BIMONTHLY, QUARTERLY, YEARLY). Tests cover MONTHLY, WEEKLY, QUARTERLY, YEARLY but not BIWEEKLY and BIMONTHLY branches.
**Impact:** Two branches untested. Low risk since the pattern is identical to MONTHLY/QUARTERLY, but completeness matters for financial calculation functions.
**Fix:** Add tests for BIWEEKLY and BIMONTHLY frequencies.

### LOW — L3: getNextBiweeklyPayDate not tested

**File:** `__tests__/unit/utils.test.ts`
**Skill:** af-testing-strategy — coverage
**Problem:** `getNextBiweeklyPayDate` (lib/utils.ts:222-249) is a financial calculation function exported from utils but has no tests in this commit.
**Impact:** Stated story goal is "unit tests for financial calculation functions." This function is a financial calculation function.
**Fix:** Add tests for `getNextBiweeklyPayDate` — at minimum: anchor in past (walk forward), anchor in future (walk backward), anchor on today.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 3 |

**Production code changes:** Minimal, clean, and backward-compatible. The `calcNextDueDate` refactoring is well-executed — optional parameter with default, defensive copy, no behavior change for existing callers.

**Test quality:** High. 57 tests across 2 files with meaningful assertions, good edge case coverage, deterministic execution (no time-dependent flakes), and clean structure. The `makeExpense` helper is well-designed.

**Overall code quality:** Good. The commit delivers on its promise — financial calculation functions are now well-tested, and the `calcNextDueDate` refactoring enables deterministic testing without breaking production.

---

## Verdict: APPROVED WITH NOTES

Zero CRITICAL, zero HIGH. One MEDIUM finding (remaining magic numbers in the same file where `MS_PER_DAY` was extracted — inconsistency). Three LOW findings for completeness (missing branches, untested function, test magic number).

The MEDIUM finding (M1) should be addressed in a follow-up commit — it is a simple 2-line change in `lib/utils.ts`. The LOW findings are at the Builder's discretion.
