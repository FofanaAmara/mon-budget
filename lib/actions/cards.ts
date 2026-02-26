'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import type { Card } from '@/lib/types';

export async function getCards(): Promise<Card[]> {
  const rows = await sql`
    SELECT * FROM cards ORDER BY created_at ASC
  `;
  return rows as Card[];
}

export async function getCardById(id: string): Promise<Card | null> {
  const rows = await sql`SELECT * FROM cards WHERE id = ${id}`;
  return rows[0] as Card ?? null;
}

export async function createCard(data: {
  name: string;
  last_four?: string;
  bank?: string;
  color?: string;
}): Promise<Card> {
  const rows = await sql`
    INSERT INTO cards (name, last_four, bank, color)
    VALUES (
      ${data.name},
      ${data.last_four ?? null},
      ${data.bank ?? null},
      ${data.color ?? '#6366F1'}
    )
    RETURNING *
  `;
  revalidatePath('/cartes');
  return rows[0] as Card;
}

export async function updateCard(
  id: string,
  data: Partial<{ name: string; last_four: string; bank: string; color: string }>
): Promise<Card> {
  const rows = await sql`
    UPDATE cards
    SET
      name = COALESCE(${data.name ?? null}, name),
      last_four = COALESCE(${data.last_four ?? null}, last_four),
      bank = COALESCE(${data.bank ?? null}, bank),
      color = COALESCE(${data.color ?? null}, color),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/cartes');
  return rows[0] as Card;
}

export async function deleteCard(id: string): Promise<void> {
  await sql`DELETE FROM cards WHERE id = ${id}`;
  revalidatePath('/cartes');
}
