# AUDIT-005 Validation — Batch INSERTs in generation functions

**Date:** 2026-03-05
**Validator:** af-pm
**Story:** AUDIT-005 (REFACTOR, Level 1, backend-only)
**Method:** Code review of modified files (no UI changes to validate visually)

## Pre-conditions

- Build: OK (148 tests pass)
- Review: APPROVED WITH NOTES (0 CRITICAL, 0 HIGH, 1 MEDIUM pre-existing)

## Per-AC Validation

### AC1 — generateMonthlyExpenses uses Promise.all instead of sequential INSERTs

**Verdict: PASS**

`generateMonthlyExpenses` delegates to three sub-functions, all refactored:
- `generateRecurringInstances` (monthly-expenses.ts:43-124): builds an `inserts: Promise<unknown>[]` array inside a `for...of` loop (push, not await), then fires `await Promise.all(inserts)` at line 123.
- `generateOneTimeInstances` (monthly-expenses.ts:126-155): uses `.map()` to build the array, then `await Promise.all(inserts)` at line 154.
- `generateDebtPaymentInstances` (monthly-expenses.ts:157-208): same pattern as recurring — push inside loop, `await Promise.all(inserts)` at line 207.

No sequential `await sql` inside any loop. Pattern correctly applied.

### AC2 — generateMonthlyIncomes uses Promise.all instead of sequential INSERTs

**Verdict: PASS**

`generateMonthlyIncomes` (monthly-incomes.ts:23-76): uses `.map()` to build the inserts array, then `await Promise.all(inserts)` at line 74. No sequential await. Pattern correctly applied.

### AC3 — generateMonthlyAllocations uses Promise.all instead of sequential INSERTs

**Verdict: PASS**

`generateMonthlyAllocations` (allocations.ts:219-259): builds `inserts: Promise<unknown>[]` inside a `for...of` loop (push, not await), fires `await Promise.all(inserts)` at line 257. Pattern correctly applied.

### AC4 — reorderSections uses Promise.all instead of sequential UPDATEs

**Verdict: PASS**

`reorderSections` (sections.ts:85-95): uses `.map()` to build the updates array, then `await Promise.all(updates)` at line 92. Pattern correctly applied.

### AC5 — setAllocationSections uses Promise.all instead of sequential INSERTs

**Verdict: PASS**

`setAllocationSections` (allocations.ts:57-73): uses `.map()` to build the inserts array, then `await Promise.all(inserts)` at line 72. Pattern correctly applied.

**Bonus:** `reorderAllocations` (allocations.ts:201-212) also refactored with `.map()` + `Promise.all` at line 210. `ensureDefaultSections` (claim.ts:90-103) and `completeOnboarding` (onboarding.ts:76-83) also refactored. These were mentioned in the story technical notes and were correctly addressed.

### AC6 — ON CONFLICT clauses are preserved

**Verdict: PASS**

Verified all ON CONFLICT clauses in the refactored functions:
- monthly-expenses.ts: `ON CONFLICT (expense_id, month) DO NOTHING` at lines 82, 119, 151; `ON CONFLICT (debt_id, month) WHERE debt_id IS NOT NULL DO NOTHING` at line 203.
- monthly-incomes.ts: `ON CONFLICT (income_id, month) DO UPDATE ... WHERE monthly_incomes.status = 'EXPECTED' AND NOT monthly_incomes.manually_edited` at lines 66-70.
- allocations.ts: `ON CONFLICT (allocation_id, month) DO NOTHING` at line 253.

All ON CONFLICT clauses preserved. Idempotency maintained.

### AC7 — Build passes, data generated is identical, latency reduced

**Verdict: PASS**

- Build passes: confirmed (148 tests pass, build OK per build report).
- Data identical: the SQL statements are unchanged (same columns, same values, same ON CONFLICT logic). Only the execution strategy changed (parallel vs sequential). The generated data is functionally identical.
- Latency reduced: by construction. N sequential round-trips (20-50ms each) replaced by N parallel round-trips. For 15 expenses, theoretical improvement from ~300-750ms to ~20-50ms (single round-trip latency). The code change is correct; the improvement is inherent to the pattern.

## Beyond AC — Additional checks

- No remaining sequential `for...await sql` patterns in the target files (monthly-expenses.ts, monthly-incomes.ts, allocations.ts, sections.ts, claim.ts, onboarding.ts). Confirmed by grep.
- Sequential patterns remain in `demo-data.ts` only — this is out of scope (demo seed script, not production generation).
- Guard pattern `if (inserts.length > 0)` consistently applied before `Promise.all()` to avoid calling `Promise.all([])` unnecessarily. Good defensive coding.

## Verdict

**ACCEPTED**

All 7 acceptance criteria are met. The refactoring correctly replaces sequential `for...await` patterns with `Promise.all()` across all specified functions, preserves ON CONFLICT clauses for idempotency, and includes bonus refactoring of `ensureDefaultSections`, `completeOnboarding`, and `reorderAllocations` as noted in the technical notes. Build passes, tests pass, no regressions.
