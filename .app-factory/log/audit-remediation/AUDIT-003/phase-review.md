# AUDIT-003 — Code Review

**Reviewer:** af-reviewer
**Date:** 2026-03-05
**Story:** Extract calcDueDateForMonth + decompose generateMonthlyExpenses
**Level:** 2 | **Scope:** backend
**Commit reviewed:** d63b61d

---

## Verdict: APPROVED WITH NOTES

**Findings:** 0 CRITICAL, 0 HIGH, 2 MEDIUM, 1 LOW

The refactoring is well-executed. The extraction of `calcDueDateForMonth` is correct and backward-compatible. The decomposition of `generateMonthlyExpenses` preserves SQL behavior exactly. Test coverage is solid with 22 tests covering all 6 frequencies plus edge cases. All review-design findings (M-01, M-02, L-01) were addressed appropriately.

---

## Git Reality Check

| Check | Result |
|-------|--------|
| Files declared modified in build log | lib/types.ts, lib/utils.ts, lib/actions/monthly-expenses.ts, __tests__/unit/calc-due-date.test.ts, DISC-004 |
| Files changed in git diff | Same 6 files (including phase-build.md log) |
| Undocumented changes | None |
| Uncommitted changes | Only .app-factory/log/ entries (untracked, expected) |
| Build log claims vs reality | All match — 148 tests confirmed, build passes |

No discrepancies. PASS.

---

## Findings

### MEDIUM

#### M-01 — Inline `as import(...)` type cast is verbose and fragile

**File:** `lib/actions/monthly-expenses.ts:89-90`, `lib/actions/monthly-expenses.ts:179-181`
**Skill:** `af-clean-code` § Nommage / Conventions TypeScript
**Problem:** The cast pattern `(freq as import("@/lib/types").RecurrenceFrequency) ?? null` uses an inline `import()` type reference instead of importing the type at the top of the file. The file already imports from `@/lib/types` (line 6: `MonthlyExpense, MonthSummary`). Using an inline `import()` in the middle of business logic is unnecessarily verbose and inconsistent with the existing import style.

Additionally, the `?? null` is redundant here: `freq` is already `string | null` from `RecurringExpenseRow`, and if `freq` is `null`, the cast `(null as RecurrenceFrequency)` would produce `null` which `?? null` would not change. The real concern is when `freq` is a non-null string that is not a valid `RecurrenceFrequency` — the cast does not protect against that.

**Impact:** Readability. Future developers will wonder why the import is inline rather than at the top. The `?? null` creates a false sense of safety.

**Fix:** Add `import type { RecurrenceFrequency } from "@/lib/types"` at the top of the file (merge with existing import on line 6). Replace the inline casts with `(freq as RecurrenceFrequency)` and `(debt.payment_frequency as RecurrenceFrequency)`. Remove the redundant `?? null`.

---

#### M-02 — `daysInMonth` computed inside loop body (spread_monthly branch)

**File:** `lib/actions/monthly-expenses.ts:67`
**Skill:** `af-clean-code` § Fonctions / effets de bord, `af-performance` § loop optimization
**Problem:** Inside `generateRecurringInstances`, the expression `new Date(year, monthNum, 0).getDate()` is computed on every iteration of the `for` loop (line 67), even though `year` and `monthNum` are loop-invariant parameters. This creates a new `Date` object per recurring expense needlessly.

**Impact:** Minor performance — the allocation is trivial for typical expense counts (< 100). The concern is more about code clarity: computing a constant value inside a loop signals to the reader that it might depend on the loop variable.

**Fix:** Hoist `const daysInMonth = new Date(year, monthNum, 0).getDate()` above the `for` loop, after the SQL query (line 57). This makes the invariant nature explicit and avoids redundant allocations.

---

### LOW

#### L-01 — Inline type assertion for debt rows duplicates RecurringExpenseRow pattern

**File:** `lib/actions/monthly-expenses.ts:165-175`
**Skill:** `af-clean-code` § DRY / Data Clump
**Problem:** The Builder correctly introduced `RecurringExpenseRow` type (line 21) to replace the inline type assertion for recurring expenses. However, the debt query result (line 165) still uses an inline type assertion `as { id: string; name: string; ... }[]`. This is the same pattern that was cleaned up for recurring expenses.

**Impact:** Cosmetic inconsistency. The debt row type is used in one place so this is not a DRY violation per se, but the inconsistency in approach within the same file is noticeable.

**Fix:** At Builder's discretion — either create a `DebtPaymentRow` type alongside `RecurringExpenseRow`, or leave as-is since it is used in only one place. Both are acceptable.

---

## Review-Design Findings Resolution

All 3 findings from the design review were addressed:

| Finding | Status | Assessment |
|---------|--------|------------|
| M-01 (type safety) | RESOLVED | `CalcDueDateInput` uses `RecurrenceFrequency \| null` as recommended. Callers cast at call site. Correct. |
| M-02 (spread_monthly AC) | RESOLVED | DISC-004 created with clear rationale. The spread logic lives in an I/O function and cannot be unit-tested without DB mocking. Discovery is well-documented. |
| L-01 (export formatDueDate) | RESOLVED | `formatDueDate` exported and used in both `utils.ts` and `monthly-expenses.ts`. Eliminated duplication in `syntheticDueDate`, `monthStart`, `monthEnd`. |

---

## Correctness Verification

### calcDueDateForMonth extraction

- **Logic preserved:** The function body in `lib/utils.ts:288-356` is character-for-character identical to the original in `monthly-expenses.ts`, with only the date formatting calls replaced by `formatDueDate()`. No behavioral change.
- **Type narrowing:** The `includes()` check for WEEKLY/BIWEEKLY was replaced with direct `===` comparison (lines 348-351). This is a type-safe improvement — `includes()` on an array literal does not narrow the union type, while `===` does. The behavior is identical.
- **`CalcDueDateInput` type:** Uses `RecurrenceFrequency | null` which is stricter than the original `string | null`. This is correct — callers now cast at the boundary (call site), keeping the pure function type-safe.

### generateMonthlyExpenses decomposition

- **SQL queries unchanged:** All 3 SQL queries (recurring, one-time, debts) are identical to the pre-refactor versions. Column lists, WHERE clauses, and ON CONFLICT clauses are preserved exactly.
- **INSERT statements unchanged:** All INSERT INTO monthly_expenses statements are identical.
- **Parameter passing:** The orchestrator passes `userId`, `month`, `year`, `monthNum`, `monthStart`, `monthEnd` as needed. Each sub-function receives exactly the parameters it uses. No over-passing, no missing parameters.
- **Execution order preserved:** `generateRecurringInstances` -> `generateOneTimeInstances` -> `generateDebtPaymentInstances` — same order as the original monolithic function.

### Backward compatibility

- `calcDueDateForMonth` was a private (non-exported) function. No external callers exist. The extraction to `lib/utils.ts` with `export` is a strict superset.
- `generateMonthlyExpenses` remains the sole exported function from this module (for this feature). Its signature, behavior, and idempotency guarantees are unchanged.
- No DB schema changes, no API changes, no migration needed.

---

## Test Quality Assessment

### Coverage

- 22 tests covering all 6 recurrence frequencies (MONTHLY, BIMONTHLY, QUARTERLY, YEARLY, WEEKLY, BIWEEKLY)
- Edge cases: day 31 clamping to Feb 28 and Feb 29 (leap year), December-January quarterly wrap, null frequency with/without next_due_date
- BIMONTHLY with null next_due_date (added per review-design recommendation)
- `formatDueDate` helper tested (2 tests)
- `makeInput` helper factory for clean test setup

### Quality

- Tests are well-organized by describe blocks matching frequency groups
- Each test has a clear descriptive name that explains the scenario
- Tests use the `makeInput()` factory to minimize boilerplate while keeping each test self-contained
- No mocking needed — pure function testing
- Tests run in ~4ms — excellent performance

### Missing coverage (not blocking)

- `spread_monthly` logic: correctly documented in DISC-004 as requiring integration tests
- `generateRecurringInstances`, `generateOneTimeInstances`, `generateDebtPaymentInstances`: I/O functions, not unit-testable without DB mocking (correctly out of scope)

---

## Code Quality Summary

| Aspect | Assessment |
|--------|-----------|
| Naming | Good — `calcDueDateForMonth`, `formatDueDate`, `generateRecurringInstances` etc. are clear and follow verb+object convention |
| Function size | Excellent — orchestrator is ~10L, sub-functions are 20-65L, `calcDueDateForMonth` is ~65L (acceptable for a multi-branch pure function) |
| SRP | Good — pure logic in utils.ts, I/O in server action, types in types.ts |
| DRY | Improved — `formatDueDate` eliminates 5+ duplications of date formatting |
| Type safety | Improved — `RecurrenceFrequency \| null` instead of `string \| null` |
| Testability | Excellent — the whole point of the extraction, and it works |
| Documentation | Good — JSDoc on exported functions, inline comments on non-obvious decisions |
| Discovery handling | Correct — DISC-004 properly documents the AC gap with rationale |

---

## Conclusion

The refactoring achieves its goals cleanly:
1. `calcDueDateForMonth` is now a pure, exported, testable function in `lib/utils.ts`
2. `generateMonthlyExpenses` is decomposed into readable sub-functions
3. 22 tests provide solid coverage of the date calculation logic
4. Zero regression risk — SQL behavior is unchanged, types are stricter

The 2 MEDIUM findings are quality improvements, not correctness issues. The Builder can address them at their discretion in this or a future commit.
