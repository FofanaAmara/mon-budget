import type { DatabaseTransactionTag } from "@/lib/database/types";

/** Debt first, then monthly rows: same order as generators and reversals. */
export function payMonthlyExpenses(txn: DatabaseTransactionTag,spaceId: string,userId: string,
  target: {id:string|null;month:string|null;automatic:boolean}) {
  const {id,month,automatic}=target;
  return txn`WITH debt_locks AS MATERIALIZED (
    SELECT d.id,d.remaining_balance FROM debts d WHERE d.space_id=${spaceId}
      AND EXISTS(SELECT 1 FROM monthly_expenses me WHERE me.debt_id=d.id AND me.space_id=d.space_id
        AND (${id}::uuid IS NULL OR me.id=${id}) AND (${month}::text IS NULL OR me.month=${month})
        AND me.status IN ('UPCOMING','OVERDUE') AND NOT me.is_progressive
        AND (NOT ${automatic} OR (me.is_auto_charged AND me.due_date<=CURRENT_DATE)))
    ORDER BY d.id FOR NO KEY UPDATE
  ), targets AS MATERIALIZED (
    SELECT me.* FROM monthly_expenses me
    WHERE me.space_id=${spaceId} AND (${id}::uuid IS NULL OR me.id=${id}) AND (${month}::text IS NULL OR me.month=${month})
      AND NOT me.is_progressive AND me.status IN ('UPCOMING','OVERDUE','PAID')
      AND (NOT ${automatic} OR (me.is_auto_charged AND me.due_date<=CURRENT_DATE))
      AND (me.debt_id IS NULL OR EXISTS(SELECT 1 FROM debt_locks d WHERE d.id=me.debt_id) OR me.status='PAID')
    ORDER BY me.id FOR UPDATE OF me
  ), payable AS (
    SELECT t.id,t.debt_id,CASE WHEN t.debt_id IS NULL THEN 0 ELSE LEAST(t.amount,d.remaining_balance) END AS applied
    FROM targets t LEFT JOIN debt_locks d ON d.id=t.debt_id
    WHERE t.status IN ('UPCOMING','OVERDUE') AND (t.debt_id IS NULL OR d.remaining_balance>0)
  ), paid AS (
    UPDATE monthly_expenses me SET status='PAID',paid_at=CASE WHEN ${automatic} THEN me.due_date ELSE CURRENT_DATE END,
      debt_paid_amount=p.applied FROM payable p WHERE me.space_id=${spaceId} AND me.id=p.id
    RETURNING me.id,me.debt_id,me.month,me.debt_paid_amount AS applied
  ), changed_debts AS (
    UPDATE debts d SET remaining_balance=d.remaining_balance-p.applied,
      is_active=(d.reactivation_allowed AND d.remaining_balance-p.applied>0),updated_at=now()
    FROM paid p WHERE d.space_id=${spaceId} AND d.id=p.debt_id RETURNING d.id
  ), journal AS (
    INSERT INTO debt_transactions(space_id,user_id,debt_id,type,amount,month,note,source)
    SELECT ${spaceId},${userId},p.debt_id,'PAYMENT',p.applied,p.month,'Versement mensuel','MONTHLY_EXPENSE'
    FROM paid p JOIN changed_debts d ON d.id=p.debt_id WHERE p.applied>0
  ) SELECT id FROM paid UNION ALL SELECT id FROM targets WHERE status='PAID'`;
}

export function reverseMonthlyPayment(txn: DatabaseTransactionTag,spaceId: string,userId: string,id:string) {
  return txn`WITH debt_locks AS MATERIALIZED (
    SELECT d.id FROM debts d JOIN monthly_expenses me ON me.debt_id=d.id AND me.space_id=d.space_id
    WHERE me.space_id=${spaceId} AND me.id=${id} ORDER BY d.id FOR NO KEY UPDATE OF d
  ), target AS MATERIALIZED (
    SELECT me.* FROM monthly_expenses me WHERE me.space_id=${spaceId} AND me.id=${id}
      AND (me.debt_id IS NULL OR EXISTS(SELECT 1 FROM debt_locks d WHERE d.id=me.debt_id))
    FOR UPDATE OF me
  ), changed AS (
    UPDATE monthly_expenses me SET status='UPCOMING',paid_at=NULL,debt_paid_amount=0
    FROM target t WHERE me.id=t.id AND me.space_id=${spaceId} AND NOT t.is_progressive AND t.status!='DEFERRED'
      AND (t.debt_id IS NULL OR t.status!='PAID' OR t.debt_paid_amount IS NOT NULL)
    RETURNING me.id,t.debt_id,t.month,CASE WHEN t.status='PAID' THEN t.debt_paid_amount ELSE 0 END AS refund
  ), restored AS (
    UPDATE debts d SET remaining_balance=d.remaining_balance+c.refund,is_active=d.reactivation_allowed,updated_at=now()
    FROM changed c WHERE d.space_id=${spaceId} AND d.id=c.debt_id AND c.refund>0 RETURNING d.id
  ), journal AS (
    INSERT INTO debt_transactions(space_id,user_id,debt_id,type,amount,month,note,source)
    SELECT ${spaceId},${userId},c.debt_id,'CHARGE',c.refund,c.month,'Annulation du versement mensuel','MONTHLY_REVERSAL'
    FROM changed c JOIN restored d ON d.id=c.debt_id
  ) SELECT id,false AS historical_unknown FROM changed
    UNION ALL SELECT id,true AS historical_unknown FROM target WHERE debt_id IS NOT NULL AND status='PAID' AND debt_paid_amount IS NULL`;
}
