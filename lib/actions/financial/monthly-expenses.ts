"use server";

import { sql } from "@/lib/db";
import { requireSpace,SpaceAccessError } from "@/lib/spaces/context";
import { requireFinancialParents,requireFinancialRecord,revalidateSpace } from "@/lib/spaces/financial";
import { payMonthlyExpenses,reverseMonthlyPayment } from "@/lib/spaces/monthly-payments";
import type { MonthlyExpense,MonthSummary } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema,monthSchema,nonNegativeAmountSchema } from "@/lib/schemas/common";
import { CreateAdhocExpenseSchema } from "@/lib/schemas/expense";

export async function generateMonthlyExpenses(spaceId:string,month:string):Promise<void> {
  validateInput(monthSchema,month);
  const {userId}=await requireSpace(spaceId);
  const start=month+"-01";
  await sql.transaction(txn=>[
    txn`WITH locked AS MATERIALIZED (
      SELECT * FROM debts WHERE space_id=${spaceId} AND is_active AND remaining_balance>0 ORDER BY id FOR NO KEY UPDATE
    ), scheduled AS (
      SELECT d.*,public.space_finance_due_date(payment_frequency,payment_day,NULL,${month}) AS due FROM locked d
    ) INSERT INTO monthly_expenses(space_id,user_id,debt_id,month,name,amount,due_date,status,section_id,card_id,is_auto_charged,is_planned,notes)
      SELECT ${spaceId},${userId},id,${month},name||' (versement)',LEAST(payment_amount,remaining_balance),due,'UPCOMING',section_id,card_id,auto_debit,true,notes
      FROM scheduled WHERE due IS NOT NULL
      ON CONFLICT(debt_id,month) WHERE debt_id IS NOT NULL DO NOTHING`,
    txn`WITH locked AS MATERIALIZED (
      SELECT * FROM expenses WHERE space_id=${spaceId} AND is_active AND type IN ('RECURRING','ONE_TIME') ORDER BY id FOR NO KEY UPDATE
    ), scheduled AS (
      SELECT e.*,
        CASE WHEN type='ONE_TIME' THEN next_due_date
          WHEN spread_monthly AND recurrence_frequency IN ('QUARTERLY','YEARLY')
            THEN (${start}::date+((LEAST(COALESCE(recurrence_day,1),extract(day FROM ${start}::date+interval '1 month'-interval '1 day')::integer)-1)*interval '1 day'))::date
          ELSE public.space_finance_due_date(recurrence_frequency,recurrence_day,next_due_date,${month}) END AS due
      FROM locked e
    ) INSERT INTO monthly_expenses(space_id,user_id,expense_id,month,name,amount,due_date,status,section_id,card_id,is_auto_charged,notes,is_progressive)
      SELECT ${spaceId},${userId},id,${month},name,
        CASE WHEN type='ONE_TIME' THEN amount ELSE public.space_finance_monthly_amount(amount,recurrence_frequency,spread_monthly) END,
        due,'UPCOMING',section_id,card_id,auto_debit,notes,is_progressive
      FROM scheduled WHERE (type='ONE_TIME' AND due>=${start}::date AND due<${start}::date+interval '1 month')
        OR (type='RECURRING' AND (due IS NOT NULL OR recurrence_day IS NULL OR recurrence_frequency IS NULL))
      ON CONFLICT(expense_id,month) DO NOTHING`,
  ]);
}

export async function getMonthlyExpenses(spaceId:string,month:string,sectionId?:string):Promise<MonthlyExpense[]> {
  validateInput(monthSchema,month);
  if(sectionId) validateInput(idSchema,sectionId);
  await requireSpace(spaceId);
  return await sql`SELECT me.*,row_to_json(s.*) AS section,row_to_json(c.*) AS card
    FROM monthly_expenses me LEFT JOIN sections s ON s.id=me.section_id AND s.space_id=me.space_id
    LEFT JOIN cards c ON c.id=me.card_id AND c.space_id=me.space_id
    WHERE me.space_id=${spaceId} AND me.month=${month} AND (${sectionId??null}::uuid IS NULL OR me.section_id=${sectionId??null})
    ORDER BY CASE me.status WHEN 'OVERDUE' THEN 1 WHEN 'UPCOMING' THEN 2 WHEN 'DEFERRED' THEN 3 WHEN 'PAID' THEN 4 END,
      me.due_date DESC NULLS LAST,me.id` as MonthlyExpense[];
}

export async function getMonthSummary(spaceId:string,month:string):Promise<MonthSummary> {
  validateInput(monthSchema,month);
  await requireSpace(spaceId);
  const [row]=await sql`SELECT count(*) AS count,COALESCE(SUM(amount),0) AS total,
    COALESCE(SUM(amount) FILTER(WHERE is_planned),0) AS planned_total,
    COALESCE(SUM(amount) FILTER(WHERE NOT is_planned),0) AS unplanned_total,
    count(*) FILTER(WHERE CASE WHEN is_progressive AND status NOT IN ('OVERDUE','DEFERRED') THEN COALESCE(paid_amount,0)>=amount ELSE status='PAID' END) AS paid_count,
    COALESCE(SUM(CASE WHEN is_progressive THEN COALESCE(paid_amount,0)
      WHEN status='PAID' THEN CASE WHEN debt_id IS NULL THEN amount ELSE COALESCE(debt_paid_amount,amount) END ELSE 0 END),0) AS paid_total,
    count(*) FILTER(WHERE status='OVERDUE') AS overdue_count FROM monthly_expenses WHERE space_id=${spaceId} AND month=${month}`;
  return {count:Number(row.count),total:Number(row.total),planned_total:Number(row.planned_total),unplanned_total:Number(row.unplanned_total),
    paid_count:Number(row.paid_count),paid_total:Number(row.paid_total),overdue_count:Number(row.overdue_count)};
}

export async function markAsPaid(spaceId:string,id:string):Promise<void> {
  validateInput(idSchema,id);
  const {userId}=await requireSpace(spaceId);
  const [rows]=await sql.transaction(txn=>[payMonthlyExpenses(txn,spaceId,userId,{id,month:null,automatic:false})]);
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function markAsUpcoming(spaceId:string,id:string):Promise<void> {
  validateInput(idSchema,id);
  const {userId}=await requireSpace(spaceId);
  const [rows]=await sql.transaction(txn=>[reverseMonthlyPayment(txn,spaceId,userId,id)]);
  const record=requireFinancialRecord(rows[0]);
  if(record.historical_unknown) throw new SpaceAccessError("Le montant déduit de ce versement historique est invérifiable. Son annulation automatique nécessite une vérification.");
  revalidateSpace(spaceId);
}

export async function deferExpenseToMonth(spaceId:string,id:string,targetMonth:string):Promise<void> {
  validateInput(idSchema,id); validateInput(monthSchema,targetMonth);
  const {userId}=await requireSpace(spaceId);
  const rows=await sql`WITH target AS MATERIALIZED (
    SELECT * FROM monthly_expenses WHERE space_id=${spaceId} AND id=${id} FOR UPDATE
  ), changed AS (
    UPDATE monthly_expenses me SET status='DEFERRED',paid_at=NULL,deferred_to_month=${targetMonth}
    FROM target t WHERE me.space_id=${spaceId} AND me.id=t.id AND t.status IN ('UPCOMING','OVERDUE')
      AND ${targetMonth}>t.month AND COALESCE(t.paid_amount,0)=0
      AND NOT EXISTS(SELECT 1 FROM expense_transactions et WHERE et.space_id=t.space_id AND et.monthly_expense_id=t.id)
    RETURNING me.*
  ), inserted AS (
    INSERT INTO monthly_expenses(space_id,user_id,expense_id,debt_id,month,name,amount,due_date,status,section_id,card_id,is_planned,notes,is_progressive,deferred_from_id,manually_edited)
    SELECT ${spaceId},${userId},expense_id,debt_id,${targetMonth},name,amount,(${targetMonth}||'-01')::date,
      'UPCOMING',section_id,card_id,true,'Reporté depuis '||month,is_progressive,id,true FROM changed RETURNING id
  ) SELECT id FROM inserted UNION ALL SELECT id FROM target WHERE status='DEFERRED' AND deferred_to_month=${targetMonth}`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function deleteMonthlyExpense(spaceId:string,id:string):Promise<void> {
  validateInput(idSchema,id);
  await requireSpace(spaceId);
  const rows=await sql`DELETE FROM monthly_expenses me WHERE me.space_id=${spaceId} AND me.id=${id}
    AND me.debt_id IS NULL AND me.status IN ('UPCOMING','OVERDUE') AND COALESCE(me.paid_amount,0)=0
    AND (me.expense_id IS NULL OR EXISTS(SELECT 1 FROM expenses e WHERE e.id=me.expense_id AND e.space_id=me.space_id AND NOT e.is_active))
    AND NOT EXISTS(SELECT 1 FROM expense_transactions t WHERE t.space_id=me.space_id AND t.monthly_expense_id=me.id) RETURNING me.id`;
  requireFinancialRecord(rows[0]);revalidateSpace(spaceId);
}

export async function updateMonthlyExpenseAmount(spaceId:string,id:string,newAmount:number):Promise<void> {
  validateInput(idSchema,id);newAmount=validateInput(nonNegativeAmountSchema,newAmount);
  await requireSpace(spaceId);
  const rows=await sql`UPDATE monthly_expenses SET amount=${newAmount},manually_edited=true
    WHERE space_id=${spaceId} AND id=${id} AND status!='DEFERRED' AND NOT(debt_id IS NOT NULL AND status='PAID') RETURNING id`;
  requireFinancialRecord(rows[0]);revalidateSpace(spaceId);
}

export async function autoMarkOverdue(spaceId:string,month:string):Promise<void> {
  validateInput(monthSchema,month);await requireSpace(spaceId);
  await sql`UPDATE monthly_expenses SET status='OVERDUE' WHERE space_id=${spaceId} AND month=${month}
    AND status='UPCOMING' AND due_date<CURRENT_DATE AND NOT is_auto_charged`;
}

export async function autoMarkPaidForAutoDebit(spaceId:string,month:string):Promise<void> {
  validateInput(monthSchema,month);const {userId}=await requireSpace(spaceId);
  await sql.transaction(txn=>[payMonthlyExpenses(txn,spaceId,userId,{id:null,month,automatic:true})]);
}

export async function getMonthlyExpenseActualsBySection(spaceId:string,month:string):Promise<{section_id:string;total:number}[]> {
  validateInput(monthSchema,month);await requireSpace(spaceId);
  const rows=await sql`SELECT section_id,SUM(CASE WHEN is_progressive THEN COALESCE(paid_amount,0)
      WHEN status='PAID' THEN CASE WHEN debt_id IS NULL THEN amount ELSE COALESCE(debt_paid_amount,amount) END ELSE 0 END) AS total
    FROM monthly_expenses WHERE space_id=${spaceId} AND month=${month} AND section_id IS NOT NULL GROUP BY section_id`;
  return rows.map(row=>({section_id:row.section_id,total:Number(row.total)}));
}

export async function createAdhocExpense(spaceId:string,input:{name:string;amount:number;sectionId:string;month:string;alreadyPaid?:boolean;dueDate?:string;cardId?:string}):Promise<void> {
  const {name,amount,sectionId,month,alreadyPaid,dueDate,cardId}=validateInput(CreateAdhocExpenseSchema,input);
  const {userId}=await requireSpace(spaceId);
  await requireFinancialParents(spaceId,{section_id:sectionId,card_id:cardId});
  await sql`INSERT INTO monthly_expenses(space_id,user_id,section_id,card_id,month,name,amount,status,due_date,paid_at,is_planned)
    VALUES(${spaceId},${userId},${sectionId},${cardId??null},${month},${name},${amount},
      ${alreadyPaid?'PAID':'UPCOMING'},COALESCE(${dueDate??null}::date,CURRENT_DATE),
      CASE WHEN ${alreadyPaid} THEN COALESCE(${dueDate??null}::date,CURRENT_DATE) ELSE NULL END,false)`;
  revalidateSpace(spaceId);
}
