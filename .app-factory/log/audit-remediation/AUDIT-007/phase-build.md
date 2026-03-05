# AUDIT-007 — Build Phase

**Date:** 2026-03-05
**Agent:** Builder
**Mode:** Build

## Summary

Wrapped 5 financial multi-write server actions in `sql.transaction()` using the Neon HTTP non-interactive transaction API. Added pre-validation SELECT for `transferSavings` to check funds before attempting transfer.

## Implementation Decisions

1. **Callback pattern chosen:** Used `sql.transaction(txn => [...])` (callback returning array) for all transactions. This is the recommended pattern per the design and Neon docs -- synchronous callback, no async logic inside.

2. **markAsPaid restructured:** Moved the SELECT (debt_id, amount, month) BEFORE the transaction. When no debt link exists, a single UPDATE is executed without transaction wrapping (unnecessary overhead for one query). When debt link exists, all 4 writes are wrapped atomically.

3. **transferSavings pre-validation:** Added SELECT + explicit error throw before the transaction. The error message is in French ("Fonds insuffisants dans le projet source") consistent with the app's fr-CA locale. Also added a check for missing source project ("Projet source introuvable").

4. **addDebtTransaction conditional branching:** PAYMENT and CHARGE paths use separate transaction calls with different query sets, as designed.

5. **No changes to error handling or function signatures:** Transactions are transparent to callers. Same function signatures, same error propagation behavior. The only new behavior is atomicity on failure.

## Files Modified

| File | Changes |
|------|---------|
| `lib/actions/expenses.ts` | `addSavingsContribution`: 2 queries wrapped in transaction. `transferSavings`: pre-validation SELECT + 4 queries wrapped in transaction |
| `lib/actions/monthly-expenses.ts` | `markAsPaid`: restructured to read-then-write. Single query (no debt) or 4-query transaction (with debt) |
| `lib/actions/debts.ts` | `makeExtraPayment`: 3 queries wrapped in transaction |
| `lib/actions/debt-transactions.ts` | `addDebtTransaction`: conditional 3-query (PAYMENT) or 2-query (CHARGE) transaction |

## Files Created

| File | Purpose |
|------|---------|
| `.app-factory/discoveries/DISC-003-non-financial-multi-write-transactions.md` | TECH_DEBT discovery for non-financial multi-write functions |

## Verification

- Build: PASS (npm run build)
- Tests: 74/74 PASS (npx vitest run) -- no regression
- No schema changes, no migrations needed
