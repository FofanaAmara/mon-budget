"use server";

import { sql } from "@/lib/db";
import { requireSpace } from "@/lib/spaces/context";
import { requireFinancialRecord, revalidateSpace } from "@/lib/spaces/financial";
import type { Section } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema, orderedIdsSchema } from "@/lib/schemas/common";
import { CreateSectionSchema } from "@/lib/schemas/section";

export async function getSections(spaceId: string): Promise<Section[]> {
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT * FROM sections WHERE space_id = ${spaceId} ORDER BY position ASC, created_at ASC, id ASC
  `;
  return rows as Section[];
}

export async function createSection(spaceId: string, data: {
  name: string;
  icon: string;
  color: string;
}): Promise<Section> {
  data = validateInput(CreateSectionSchema, data);
  const { userId } = await requireSpace(spaceId);
  const maxPos =
    await sql`SELECT COALESCE(MAX(position), -1) as max FROM sections WHERE space_id = ${spaceId}`;
  const position = (maxPos[0].max as number) + 1;

  const rows = await sql`
    INSERT INTO sections (space_id, user_id, name, icon, color, position)
    VALUES (${spaceId}, ${userId}, ${data.name}, ${data.icon}, ${data.color}, ${position})
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Section;
}

export async function updateSection(
  spaceId: string,
  id: string,
  data: Partial<{ name: string; icon: string; color: string }>,
): Promise<Section> {
  validateInput(idSchema, id);
  data = validateInput(CreateSectionSchema.partial(), data);
  await requireSpace(spaceId);
  const rows = await sql`
    UPDATE sections
    SET
      name = COALESCE(${data.name ?? null}, name),
      icon = COALESCE(${data.icon ?? null}, icon),
      color = COALESCE(${data.color ?? null}, color),
      updated_at = NOW()
    WHERE id = ${id} AND space_id = ${spaceId}
    RETURNING *
  `;
  revalidateSpace(spaceId);
  return requireFinancialRecord(rows[0]) as Section;
}

export async function getSectionExpenseCount(spaceId: string, id: string): Promise<number> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM expenses
    WHERE section_id = ${id} AND space_id = ${spaceId}
  `;
  return rows[0].count;
}

export async function deleteSection(spaceId: string, id: string): Promise<void> {
  validateInput(idSchema, id);
  await requireSpace(spaceId);
  // Composite foreign keys unlink only the reference, preserving every space ID.
  const rows = await sql`DELETE FROM sections WHERE id = ${id} AND space_id = ${spaceId} RETURNING id`;
  requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
}

export async function reorderSections(spaceId: string, orderedIds: string[]): Promise<void> {
  validateInput(orderedIdsSchema, orderedIds);
  await requireSpace(spaceId);
  if (new Set(orderedIds).size !== orderedIds.length) throw new Error("Les catégories doivent être distinctes.");
  const rows = await sql`WITH requested AS (
    SELECT id::uuid, (position-1)::integer AS position
    FROM jsonb_array_elements_text(${JSON.stringify(orderedIds)}::jsonb) WITH ORDINALITY AS r(id,position)
  ), locked AS MATERIALIZED (
    SELECT s.id FROM sections s JOIN requested r ON r.id=s.id
    WHERE s.space_id=${spaceId} ORDER BY s.id FOR UPDATE OF s
  ), valid AS (
    SELECT count(*)=${orderedIds.length} AS ok FROM locked
  ) UPDATE sections s SET position=r.position,updated_at=now() FROM requested r, valid v
    WHERE v.ok AND s.id=r.id AND s.space_id=${spaceId} RETURNING s.id`;
  requireFinancialRecord(rows.length === orderedIds.length ? rows[0] : undefined);
  revalidateSpace(spaceId);
}
