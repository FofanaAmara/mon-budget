# DISC-PROG-002-001 — Missing parent ownership pre-check in child record inserts

**Type:** TECH_DEBT
**Severity:** P2
**Discovered by:** af-reviewer
**During:** Review of PROG-002
**Status:** Open

## Description

Server actions that insert child records (expense_transactions, savings_contributions) accept a parent ID from the user but do not verify that the parent record belongs to the authenticated user BEFORE the insert. The UPDATE statement filters by user_id, so it silently affects 0 rows if the parent belongs to another user, but the INSERT succeeds — creating orphaned records.

## Affected Actions

- `addExpenseTransaction` in `lib/actions/expense-transactions.ts`
- `addSavingsContribution` in `lib/actions/savings.ts`
- Potentially other actions following the same pattern

## Impact

- Data integrity: orphaned child records referencing other users' parent records
- Not exploitable for data theft (SELECT filters by user_id)
- Not exploitable for paid_amount/saved_amount manipulation (UPDATE filters by user_id)

## Recommendation

Add a pre-check query before the transaction:
```sql
SELECT id FROM parent_table WHERE id = $parentId AND user_id = $userId
```
Throw an error if no row returned. Apply consistently across all child-insert actions.
