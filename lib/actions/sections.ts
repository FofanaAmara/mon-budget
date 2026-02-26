'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import type { Section } from '@/lib/types';

export async function getSections(): Promise<Section[]> {
  const rows = await sql`
    SELECT * FROM sections ORDER BY position ASC, created_at ASC
  `;
  return rows as Section[];
}

export async function createSection(data: {
  name: string;
  icon: string;
  color: string;
}): Promise<Section> {
  const maxPos = await sql`SELECT COALESCE(MAX(position), -1) as max FROM sections`;
  const position = (maxPos[0].max as number) + 1;

  const rows = await sql`
    INSERT INTO sections (name, icon, color, position)
    VALUES (${data.name}, ${data.icon}, ${data.color}, ${position})
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
  const rows = await sql`
    UPDATE sections
    SET
      name = COALESCE(${data.name ?? null}, name),
      icon = COALESCE(${data.icon ?? null}, icon),
      color = COALESCE(${data.color ?? null}, color),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/sections');
  revalidatePath('/');
  return rows[0] as Section;
}

export async function deleteSection(id: string): Promise<void> {
  await sql`DELETE FROM sections WHERE id = ${id}`;
  revalidatePath('/sections');
  revalidatePath('/');
}

export async function reorderSections(
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`UPDATE sections SET position = ${i}, updated_at = NOW() WHERE id = ${orderedIds[i]}`;
  }
  revalidatePath('/sections');
  revalidatePath('/');
}
