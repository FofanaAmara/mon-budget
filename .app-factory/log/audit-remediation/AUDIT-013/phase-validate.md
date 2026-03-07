# Validation — AUDIT-013: Split God Files

**Date:** 2026-03-05
**Validator:** af-pm
**Story:** AUDIT-013 — Split God Files (expenses.ts, monthly-expenses.ts) into focused modules
**Level:** 1
**Method:** Code file review + import analysis across codebase

---

## Per-AC Results

### AC1 — expenses.ts decomposed into focused modules

| Check | Result |
|-------|--------|
| expenses.ts contains CRUD functions (get, create, update, delete, getById, getByCard) | PASS |
| savings.ts created with 7 savings functions | PASS |
| getMonthlyExpenseActualsBySection moved to monthly-expenses.ts | PASS |
| getMonthlySummaryBySection moved to monthly-expenses.ts | ECART |

**Ecart:** getMonthlySummaryBySection remains in expenses.ts. The AC stated it should move to monthly-expenses.ts, but the AC's technical premise was incorrect -- the function queries `expenses` + `sections`, NOT `monthly_expenses`. The builder kept it in expenses.ts (architecturally correct). Reviewer flagged as M2 (not blocking). PM accepts this deviation as it preserves better SRP.

### AC2 — monthly-expenses.ts clean

| Check | Result |
|-------|--------|
| Generation logic present | PASS |
| CRUD instances present (get, summary, markPaid, defer, markUpcoming, delete, updateAmount) | PASS |
| Auto-marking functions present | PASS |
| createAdhocExpense present | PASS |
| getMonthlyExpenseActualsBySection present | PASS |

**Verdict:** CONFORME

### AC3 — Consumer imports updated

| Check | Result |
|-------|--------|
| Savings functions imported from savings.ts (4 consumer files) | PASS |
| createAdhocExpense imported from monthly-expenses.ts | PASS |
| getMonthlyExpenseActualsBySection imported from monthly-expenses.ts | PASS |
| No remaining imports of moved functions from wrong files | PASS |

**Verdict:** CONFORME

### AC4 — createAdhocExpense moved with object params

| Check | Result |
|-------|--------|
| createAdhocExpense in monthly-expenses.ts with object signature | PASS |
| transferSavings in savings.ts with object signature | PASS |

**Verdict:** CONFORME

### AC5 — Build passes, zero regression

| Check | Result |
|-------|--------|
| 148 tests pass | PASS |
| Build OK | PASS |
| Critical accent fix applied (C1 from review) | PASS |

**Verdict:** CONFORME

---

## Overall Verdict: ACCEPTED

4/5 ACs fully met. AC1 has one accepted deviation: getMonthlySummaryBySection not moved because the AC's technical assumption was wrong (function queries `expenses`, not `monthly_expenses`). Builder's implementation is architecturally sounder than the original AC.

No rework needed.
