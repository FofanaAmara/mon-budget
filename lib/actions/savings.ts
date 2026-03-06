"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import type {
  Expense,
  SavingsContribution,
  MonthlySavingsSummary,
} from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import {
  idSchema,
  monthSchema,
  nonNegativeAmountSchema,
} from "@/lib/schemas/common";
import {
  AddSavingsContributionSchema,
  TransferSavingsSchema,
} from "@/lib/schemas/expense";

export async function getPlannedExpenses(): Promise<Expense[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      e.*,
      row_to_json(s.*) as section,
      row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true
      AND e.type = 'PLANNED'
      AND e.user_id = ${userId}
    ORDER BY e.created_at DESC
  `;
  return rows as Expense[];
}

export async function updateSavedAmount(
  id: string,
  savedAmount: number,
): Promise<Expense> {
  validateInput(idSchema, id);
  validateInput(nonNegativeAmountSchema, savedAmount);
  const userId = await requireAuth();
  const rows = await sql`
    UPDATE expenses SET
      saved_amount = ${savedAmount},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  revalidatePath("/projets");
  revalidatePath("/");
  return rows[0] as Expense;
}

export async function addSavingsContribution(
  expenseId: string,
  amount: number,
  note?: string | null,
): Promise<void> {
  validateInput(AddSavingsContributionSchema, { expenseId, amount, note });
  const userId = await requireAuth();
  // Atomic: insert contribution + update running total
  await sql.transaction((txn) => [
    txn`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note)
      VALUES (${userId}, ${expenseId}, ${amount}, ${note ?? null})
    `,
    txn`
      UPDATE expenses SET
        saved_amount = saved_amount + ${amount},
        updated_at = NOW()
      WHERE id = ${expenseId} AND user_id = ${userId}
    `,
  ]);
  revalidatePath("/projets");
  revalidatePath("/");
}

export async function getSavingsContributions(
  expenseId: string,
): Promise<SavingsContribution[]> {
  validateInput(idSchema, expenseId);
  const userId = await requireAuth();
  const rows = await sql`
    SELECT * FROM savings_contributions
    WHERE expense_id = ${expenseId} AND user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows as SavingsContribution[];
}

export async function transferSavings({
  fromId,
  toId,
  amount,
  fromName,
  toName,
}: {
  fromId: string;
  toId: string;
  amount: number;
  fromName: string;
  toName: string;
}): Promise<void> {
  validateInput(TransferSavingsSchema, {
    fromId,
    toId,
    amount,
    fromName,
    toName,
  });
  const userId = await requireAuth();

  // Pre-validation: verify source has sufficient funds
  const sourceRows = await sql`
    SELECT saved_amount FROM expenses
    WHERE id = ${fromId} AND user_id = ${userId}
  `;
  if (sourceRows.length === 0) {
    throw new Error("Projet source introuvable");
  }
  if (Number(sourceRows[0].saved_amount) < amount) {
    throw new Error("Fonds insuffisants dans le projet source");
  }

  // Atomic: debit source + credit destination (4 writes)
  await sql.transaction((txn) => [
    txn`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note)
      VALUES (${userId}, ${fromId}, ${-amount}, ${"Transfert vers " + toName})
    `,
    txn`
      UPDATE expenses SET saved_amount = saved_amount - ${amount}, updated_at = NOW()
      WHERE id = ${fromId} AND user_id = ${userId}
    `,
    txn`
      INSERT INTO savings_contributions (user_id, expense_id, amount, note)
      VALUES (${userId}, ${toId}, ${amount}, ${"Transfert depuis " + fromName})
    `,
    txn`
      UPDATE expenses SET saved_amount = saved_amount + ${amount}, updated_at = NOW()
      WHERE id = ${toId} AND user_id = ${userId}
    `,
  ]);
  revalidatePath("/projets");
  revalidatePath("/");
}

// Returns the single "Épargne libre" pot, creating it if it doesn't exist.
export async function getOrCreateFreeSavings(): Promise<Expense> {
  const userId = await requireAuth();
  const existing = await sql`
    SELECT e.*, row_to_json(s.*) as section, row_to_json(c.*) as card
    FROM expenses e
    LEFT JOIN sections s ON e.section_id = s.id
    LEFT JOIN cards c ON e.card_id = c.id
    WHERE e.is_active = true AND e.type = 'PLANNED' AND e.name = 'Épargne libre' AND e.user_id = ${userId}
    LIMIT 1
  `;
  if (existing.length > 0) return existing[0] as Expense;

  const rows = await sql`
    INSERT INTO expenses (user_id, name, amount, type, saved_amount)
    VALUES (${userId}, 'Épargne libre', 0, 'PLANNED', 0)
    RETURNING *, NULL as section, NULL as card
  `;
  return rows[0] as Expense;
}

export async function getMonthlySavingsSummary(
  month: string,
): Promise<MonthlySavingsSummary> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthEnd = `${year}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const rows = await sql`
    SELECT
      sc.expense_id,
      e.name,
      SUM(sc.amount) as total
    FROM savings_contributions sc
    JOIN expenses e ON sc.expense_id = e.id
    WHERE sc.user_id = ${userId}
      AND sc.created_at >= ${monthStart}::date
      AND sc.created_at < (${monthEnd}::date + INTERVAL '1 day')
    GROUP BY sc.expense_id, e.name
    ORDER BY total DESC
  `;

  const byProject = (
    rows as { expense_id: string; name: string; total: number }[]
  ).map((r) => ({
    expense_id: r.expense_id,
    name: r.name,
    total: Number(r.total),
  }));

  const totalContributions = byProject.reduce((s, p) => s + p.total, 0);
  const contributionCountRows = await sql`
    SELECT COUNT(*) as cnt
    FROM savings_contributions
    WHERE user_id = ${userId}
      AND created_at >= ${monthStart}::date
      AND created_at < (${monthEnd}::date + INTERVAL '1 day')
  `;

  return {
    totalContributions,
    contributionCount: Number(contributionCountRows[0].cnt),
    byProject,
  };
}
