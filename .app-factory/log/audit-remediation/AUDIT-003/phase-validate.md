# AUDIT-003 — PM Validation

**Validator:** af-pm
**Date:** 2026-03-05
**Story:** Extract calcDueDateForMonth + decompose generateMonthlyExpenses
**Level:** 2 | **Scope:** backend

---

## Verdict: ACCEPTED

---

## Acceptance Criteria Validation

| AC | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| AC1 | `calcDueDateForMonth` importable from test file (no "use server" error) | CONFORME | Test file imports from `@/lib/utils` (line 2). Function exported at `lib/utils.ts:288`. 148 tests pass — import works. |
| AC2 | Tests cover each frequency (MONTHLY, BIMONTHLY, QUARTERLY, YEARLY, WEEKLY, BIWEEKLY) | CONFORME | 6 `describe` blocks in test file: MONTHLY (L73), BIMONTHLY (L103), QUARTERLY (L147), YEARLY (L201), WEEKLY (L243), BIWEEKLY (L253). |
| AC3 | Day 31 clamping for February | CONFORME | Two tests: "clamps day 31 to February 28 (non-leap year)" (L82) and "clamps day 31 to February 29 (leap year)" (L90). |
| AC4 | BIMONTHLY skip month returns null | CONFORME | Test "skips odd-offset month from reference" (L116) — expects `null`. |
| AC5 | QUARTERLY skip month returns null | CONFORME | Two tests: "skips month at offset 1" (L160) and "skips month at offset 2" (L172) — both expect `null`. |
| AC6 | YEARLY skip month returns null | CONFORME | Test "skips all other months" (L214) — expects `null`. |
| AC7 | spread_monthly logic tested | ECART DOCUMENTE | Logic lives in `generateRecurringInstances` (I/O function with SQL). Cannot be unit-tested without DB mocking. DISC-004 documents the gap with rationale and recommends future integration test. The calculation itself is trivial (`Math.round((amount / periodCount) * 100) / 100`). Accepted as documented trade-off. |
| AC8 | `generateMonthlyExpenses` decomposed into sub-functions | CONFORME | Orchestrator at L202 (~10 lines) calls 3 sub-functions: `generateRecurringInstances` (L43), `generateOneTimeInstances` (L122), `generateDebtPaymentInstances` (L152). |
| AC9 | Build passes, no regression | CONFORME | Build log: 148 tests pass (126 + 22 new), `npm run build` succeeds. Review confirms SQL queries unchanged character-for-character. |

**Score: 8/9 CONFORME, 1 ECART DOCUMENTE (AC7)**

---

## Beyond Criteria Check

| Check | Result |
|-------|--------|
| Backward compatibility | No breaking changes. `calcDueDateForMonth` was private, now exported — strict superset. `generateMonthlyExpenses` signature unchanged. |
| Type safety | Improved — `CalcDueDateInput` uses `RecurrenceFrequency \| null` instead of `string \| null`. |
| Test quality | 22 tests well-organized by frequency, clear descriptive names, `makeInput()` factory, edge cases covered (leap year, null frequency, December-January wrap). |
| Discovery handling | DISC-004 properly classified as IMPROVEMENT/P2 with clear rationale. Will be triaged in next cycle. |
| Review findings | 0 CRITICAL, 0 HIGH. 2 MEDIUM (import verbosity, loop invariant) are quality improvements — not correctness issues. |

No additional concerns. No missing obvious cases.

---

## Rationale for ACCEPTED despite AC7 ecart

The AC7 gap is a conscious, documented trade-off:
1. The spread logic is trivially correct (division + rounding) — verified by code inspection
2. It resides in an I/O function (`generateRecurringInstances`) that performs SQL queries — unit testing would require DB mocking, which is out of scope for a refactoring story
3. DISC-004 properly documents the gap and recommends future integration tests
4. The Reviewer explicitly validated this approach as correct
5. The refactoring itself did not change the spread logic — it was moved as-is during decomposition

Requiring unit tests for this I/O-bound logic would force either (a) further extraction of a trivial one-liner or (b) DB mocking infrastructure — both disproportionate to the risk. The PM accepts the documented gap.

---

## Summary

AUDIT-003 achieves its goals cleanly: the core date calculation logic is now extracted, exported, and tested. The monolithic `generateMonthlyExpenses` is decomposed into readable sub-functions. 22 tests provide solid coverage. Zero regression risk confirmed by unchanged SQL and passing build. The single AC gap (spread_monthly) is properly documented in DISC-004 for future triage.

**Story status: ACCEPTED**
