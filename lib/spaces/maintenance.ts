import type { DatabaseTransactionTag } from "@/lib/database/types";

/** Rare reset/demo operations serialize with ordinary finance writers too.
 * A bounded transaction lock avoids a pre-check racing a concurrent insertion.
 * No untrusted table identifier is accepted by these helpers.
 */
export function maintenanceLocks(txn: DatabaseTransactionTag) {
  return [txn`SET LOCAL lock_timeout='5s'`,txn`SET LOCAL statement_timeout='10s'`,txn`SET LOCAL transaction_timeout='15s'`,
    txn`LOCK TABLE sections,cards,incomes,expenses,debts,savings_contributions,debt_transactions,
      monthly_expenses,monthly_incomes,income_allocations,monthly_allocations,allocation_sections,notification_log,expense_transactions
      IN SHARE ROW EXCLUSIVE MODE`];
}

export function requireEmptySpace(txn: DatabaseTransactionTag,spaceId:string) {
  // A failure rolls back the entire transaction before any destructive statement.
  return txn`SELECT 1 / CASE WHEN EXISTS(
    SELECT 1 FROM expenses WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM incomes WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM cards WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM debts WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM monthly_expenses WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM monthly_incomes WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM income_allocations WHERE space_id=${spaceId} UNION ALL
    SELECT 1 FROM monthly_allocations WHERE space_id=${spaceId}
  ) THEN 0 ELSE 1 END AS empty`;
}
