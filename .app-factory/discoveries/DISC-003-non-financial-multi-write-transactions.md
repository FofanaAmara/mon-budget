# DISC-003 — Non-financial multi-write functions lack transactions

**Type:** TECH_DEBT
**Severity:** P3
**Discovered by:** Builder
**During:** AUDIT-007 (DB transactions for financial operations)
**Status:** Open
**Blocking:** No

## Description

Several non-financial server actions execute multiple SQL statements without transaction wrapping. While these are lower risk than financial operations (no money movement), they can still leave data in inconsistent states if a query fails mid-way.

## Functions identified

| Function | File | Queries | Risk |
|----------|------|---------|------|
| `deleteSection` | `lib/actions/sections.ts` | UPDATE expenses + DELETE section | Expenses orphaned if DELETE fails |
| `claimOrphanedData` | `lib/actions/user.ts` | Multiple UPDATEs across tables | Partial ownership claim |
| `deferExpenseToMonth` | `lib/actions/monthly-expenses.ts` | UPDATE status + INSERT new instance | Original marked DEFERRED but copy not created |
| `deleteExpense` | `lib/actions/expenses.ts` | UPDATE is_active + DELETE monthly_expenses | Soft-deleted but stale monthly instances remain |
| `updateExpense` | `lib/actions/expenses.ts` | UPDATE expense + conditional DELETE monthly_expenses | Expense updated but stale instances not cleaned |
| `generateMonthlyExpenses` | `lib/actions/monthly-expenses.ts` | Multiple INSERTs in loop | Partial generation (lower risk: idempotent via ON CONFLICT) |

## Impact

Low to moderate. These are not financial operations (no money transfer/balance updates), but data inconsistency is possible on partial failure.

## Recommendation

Wrap these functions in `sql.transaction()` in a future enabler story. Priority is lower than financial operations but should be addressed for data integrity completeness.
