"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { Card } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema } from "@/lib/schemas/common";
import { CreateCardSchema } from "@/lib/schemas/card";

export async function getCards(spaceId: string): Promise<Card[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT * FROM cards WHERE space_id = ${spaceId} ORDER BY created_at ASC
  `;
  return rows as Card[];
}

export async function getCardById(spaceId: string, id: string): Promise<Card | null> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows =
    await sql`SELECT * FROM cards WHERE id = ${id} AND space_id = ${spaceId}`;
  return (rows[0] as Card) ?? null;
}

export async function createCard(spaceId: string, data: {
  name: string;
  last_four?: string;
  bank?: string;
  color?: string;
}): Promise<Card> {
  data = validateInput(CreateCardSchema, data);
  const { userId } = await requireSpace(spaceId);
  const rows = await sql`
    INSERT INTO cards (space_id, user_id, name, last_four, bank, color)
    VALUES (
      ${spaceId}, ${userId},
      ${data.name},
      ${data.last_four ?? null},
      ${data.bank ?? null},
      ${data.color ?? "#6366F1"}
    )
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Card;
}

export async function updateCard(
  spaceId: string,
  id: string,
  data: Partial<{
    name: string;
    last_four: string;
    bank: string;
    color: string;
  }>,
): Promise<Card> {
  validateInput(idSchema, id);
  data = validateInput(CreateCardSchema.partial(), data);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE cards
    SET
      name = COALESCE(${data.name ?? null}, name),
      last_four = COALESCE(${data.last_four ?? null}, last_four),
      bank = COALESCE(${data.bank ?? null}, bank),
      color = COALESCE(${data.color ?? null}, color),
      updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId}
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Card;
}

export async function deleteCard(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`DELETE FROM cards WHERE id = ${id} AND space_id = ${spaceId} RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}
