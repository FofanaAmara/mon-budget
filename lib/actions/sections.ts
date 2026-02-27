'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import type { Section } from '@/lib/types';

export async function getSections(): Promise<Section[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT * FROM sections WHERE user_id = ${userId} ORDER BY position ASC, created_at ASC
  `;
  return rows as Section[];
}

export async function createSection(data: {
  name: string;
  icon: string;
  color: string;
}): Promise<Section> {
  const userId = await requireAuth();
  const maxPos = await sql`SELECT COALESCE(MAX(position), -1) as max FROM sections WHERE user_id = ${userId}`;
  const position = (maxPos[0].max as number) + 1;

  const rows = await sql`
    INSERT INTO sections (user_id, name, icon, color, position)
    VALUES (${userId}, ${data.name}, ${data.icon}, ${data.color}, ${position})
    RETURNING *
  `;
  revalidatePath('/sections');
  revalidatePath('/');
  return rows[0] as Section;
}

export async function updateSection(
  id: string,
  data: Partial<{ name: string; icon: string; color: string }>
): Promise<Section> {
  const userId = await requireAuth();
  const rows = await sql`
    UPDATE sections
    SET
      name = COALESCE(${data.name ?? null}, name),
      icon = COALESCE(${data.icon ?? null}, icon),
      color = COALESCE(${data.color ?? null}, color),
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;
  revalidatePath('/sections');
  revalidatePath('/');
  return rows[0] as Section;
}

export async function deleteSection(id: string): Promise<void> {
  const userId = await requireAuth();
  await sql`DELETE FROM sections WHERE id = ${id} AND user_id = ${userId}`;
  revalidatePath('/sections');
  revalidatePath('/');
}

export async function reorderSections(
  orderedIds: string[]
): Promise<void> {
  const userId = await requireAuth();
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`UPDATE sections SET position = ${i}, updated_at = NOW() WHERE id = ${orderedIds[i]} AND user_id = ${userId}`;
  }
  revalidatePath('/sections');
  revalidatePath('/');
}
