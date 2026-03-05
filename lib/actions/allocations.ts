"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import type {
  IncomeAllocation,
  MonthlyAllocation,
  AllocationSection,
} from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import {
  idSchema,
  monthSchema,
  orderedIdsSchema,
  nonNegativeAmountSchema,
} from "@/lib/schemas/common";
import {
  CreateAllocationSchema,
  type CreateAllocationInput,
  CreateAdhocAllocationSchema,
  UpdateMonthlyAllocationSchema,
} from "@/lib/schemas/allocation";

// ─── Helpers ────────────────────────────────────────────────────────────────

// Fetch section links for a set of allocation IDs
async function fetchAllocationSections(
  allocationIds: string[],
): Promise<Map<string, AllocationSection[]>> {
  if (allocationIds.length === 0) return new Map();

  const rows = await sql`
    SELECT als.allocation_id, s.id, s.name, s.icon, s.color
    FROM allocation_sections als
    JOIN sections s ON als.section_id = s.id
    WHERE als.allocation_id = ANY(${allocationIds}::uuid[])
    ORDER BY s.name
  `;

  const map = new Map<string, AllocationSection[]>();
  for (const r of rows as {
    allocation_id: string;
    id: string;
    name: string;
    icon: string;
    color: string;
  }[]) {
    const existing = map.get(r.allocation_id) ?? [];
    existing.push({ id: r.id, name: r.name, icon: r.icon, color: r.color });
    map.set(r.allocation_id, existing);
  }
  return map;
}

// Set section links for an allocation (replaces all existing links)
async function setAllocationSections(
  allocationId: string,
  sectionIds: string[],
): Promise<void> {
  // Delete existing links
  await sql`
    DELETE FROM allocation_sections WHERE allocation_id = ${allocationId}
  `;
  // Insert new links
  for (const sid of sectionIds) {
    await sql`
      INSERT INTO allocation_sections (allocation_id, section_id)
      VALUES (${allocationId}, ${sid})
    `;
  }
}

// ─── Fetch templates ────────────────────────────────────────────────────────

export async function getAllocations(): Promise<IncomeAllocation[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      ia.*,
      e.name  AS project_name,
      e.target_amount AS project_target_amount,
      e.saved_amount  AS project_saved_amount,
      e.target_date   AS project_target_date
    FROM income_allocations ia
    LEFT JOIN expenses e ON ia.project_id = e.id
    WHERE ia.is_active = true AND ia.user_id = ${userId}
    ORDER BY ia.position ASC, ia.created_at ASC
  `;

  const allocationIds = (rows as { id: string }[]).map((r) => r.id);
  const sectionsMap = await fetchAllocationSections(allocationIds);

  return (rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    section_ids: (sectionsMap.get(r.id as string) ?? []).map((s) => s.id),
    sections: sectionsMap.get(r.id as string) ?? [],
  })) as IncomeAllocation[];
}

// ─── Create / Update / Delete templates ─────────────────────────────────────

export async function createAllocation(
  data: CreateAllocationInput,
): Promise<IncomeAllocation> {
  validateInput(CreateAllocationSchema, data);
  const userId = await requireAuth();

  // Position defaults to end of list
  const posRows = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
    FROM income_allocations
    WHERE is_active = true AND user_id = ${userId}
  `;
  const position = data.position ?? posRows[0]?.next_pos ?? 0;

  // Still store section_id for first section (backward compat with old queries if any)
  const primarySectionId = data.section_ids?.length
    ? data.section_ids[0]
    : null;

  const rows = await sql`
    INSERT INTO income_allocations
      (user_id, label, amount, section_id, project_id, end_month, color, position)
    VALUES (
      ${userId},
      ${data.label},
      ${data.amount},
      ${primarySectionId},
      ${data.project_id ?? null},
      ${data.end_month ?? null},
      ${data.color ?? "#6B6966"},
      ${position}
    )
    RETURNING *
  `;

  const alloc = rows[0] as Record<string, unknown>;

  // Set junction table links
  if (data.section_ids?.length) {
    await setAllocationSections(alloc.id as string, data.section_ids);
  }

  revalidatePath("/parametres/allocation");
  revalidatePath("/revenus");

  const sectionsMap = await fetchAllocationSections([alloc.id as string]);
  return {
    ...alloc,
    section_ids: (sectionsMap.get(alloc.id as string) ?? []).map((s) => s.id),
    sections: sectionsMap.get(alloc.id as string) ?? [],
  } as IncomeAllocation;
}

// Update always receives the full object (from modal form) so we can safely update all fields.
export async function updateAllocation(
  id: string,
  data: CreateAllocationInput,
): Promise<void> {
  validateInput(idSchema, id);
  validateInput(CreateAllocationSchema, data);
  const userId = await requireAuth();

  const primarySectionId = data.section_ids?.length
    ? data.section_ids[0]
    : null;

  await sql`
    UPDATE income_allocations SET
      label      = ${data.label},
      amount     = ${data.amount},
      section_id = ${primarySectionId},
      project_id = ${data.project_id ?? null},
      end_month  = ${data.end_month ?? null},
      color      = ${data.color ?? "#6B6966"},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND is_active = true
  `;

  // Replace junction table links
  await setAllocationSections(id, data.section_ids ?? []);

  revalidatePath("/parametres/allocation");
  revalidatePath("/revenus");
}

export async function deleteAllocation(id: string): Promise<void> {
  validateInput(idSchema, id);
  const userId = await requireAuth();
  await sql`
    UPDATE income_allocations SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  // Junction table rows stay (harmless), but allocation won't appear in queries
  revalidatePath("/parametres/allocation");
  revalidatePath("/revenus");
}

export async function reorderAllocations(orderedIds: string[]): Promise<void> {
  validateInput(orderedIdsSchema, orderedIds);
  const userId = await requireAuth();
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE income_allocations SET position = ${i}, updated_at = NOW()
      WHERE id = ${orderedIds[i]} AND user_id = ${userId}
    `;
  }
  revalidatePath("/parametres/allocation");
}

// ─── Monthly generation ──────────────────────────────────────────────────────

// Idempotent — safe to call multiple times.
// Skips: (1) expired temporal allocations (month > end_month)
//        (2) savings allocations where project goal is already reached
export async function generateMonthlyAllocations(month: string): Promise<void> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();

  const allocations = await sql`
    SELECT
      ia.*,
      e.target_amount AS project_target_amount,
      e.saved_amount  AS project_saved_amount
    FROM income_allocations ia
    LEFT JOIN expenses e ON ia.project_id = e.id
    WHERE ia.is_active = true AND ia.user_id = ${userId}
    ORDER BY ia.position ASC
  `;

  for (const alloc of allocations as (IncomeAllocation & {
    project_target_amount: number | null;
    project_saved_amount: number | null;
  })[]) {
    // Skip if temporal allocation has expired
    if (alloc.end_month && month > alloc.end_month) continue;

    // Skip if linked savings project already reached its goal
    if (alloc.project_id && alloc.project_target_amount !== null) {
      const saved = Number(alloc.project_saved_amount ?? 0);
      const target = Number(alloc.project_target_amount);
      if (saved >= target) continue;
    }

    await sql`
      INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
      VALUES (${userId}, ${alloc.id}, ${month}, ${alloc.amount})
      ON CONFLICT (allocation_id, month) DO NOTHING
    `;
  }
  // No revalidatePath — called during page render
}

// ─── Fetch monthly instances ─────────────────────────────────────────────────

export async function getMonthlyAllocations(
  month: string,
): Promise<MonthlyAllocation[]> {
  validateInput(monthSchema, month);
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      ma.*,
      ia.label,
      ia.color,
      ia.position,
      ia.project_id,
      ia.end_month,
      e.name  AS project_name,
      e.target_amount AS project_target_amount,
      e.saved_amount  AS project_saved_amount,
      e.target_date   AS project_target_date
    FROM monthly_allocations ma
    JOIN income_allocations ia ON ma.allocation_id = ia.id
    LEFT JOIN expenses e ON ia.project_id = e.id
    WHERE ma.month = ${month} AND ma.user_id = ${userId}
    ORDER BY ia.position ASC, ia.created_at ASC
  `;

  // Fetch section links for all allocations
  const allocationIds = (rows as { allocation_id: string }[]).map(
    (r) => r.allocation_id,
  );
  const sectionsMap = await fetchAllocationSections(allocationIds);

  return (rows as Record<string, unknown>[]).map((r) => ({
    ...r,
    section_ids: (sectionsMap.get(r.allocation_id as string) ?? []).map(
      (s) => s.id,
    ),
    sections: sectionsMap.get(r.allocation_id as string) ?? [],
  })) as MonthlyAllocation[];
}

// ─── Adhoc allocation (one-time, current month only) ─────────────────────────

export async function createAdhocMonthlyAllocation(
  month: string,
  data: {
    label: string;
    amount: number;
    section_ids?: string[];
    project_id?: string | null;
    color?: string;
  },
): Promise<void> {
  validateInput(CreateAdhocAllocationSchema, { month, data });
  const userId = await requireAuth();

  // Position at end of list
  const posRows = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
    FROM income_allocations
    WHERE is_active = true AND user_id = ${userId}
  `;
  const position = posRows[0]?.next_pos ?? 0;

  const primarySectionId = data.section_ids?.length
    ? data.section_ids[0]
    : null;

  // Create a one-time template (expires at end of this month)
  const rows = await sql`
    INSERT INTO income_allocations
      (user_id, label, amount, section_id, project_id, end_month, color, position)
    VALUES (
      ${userId},
      ${data.label},
      ${data.amount},
      ${primarySectionId},
      ${data.project_id ?? null},
      ${month},
      ${data.color ?? "#6B6966"},
      ${position}
    )
    RETURNING id
  `;
  const allocId = rows[0].id;

  // Set junction table links
  if (data.section_ids?.length) {
    await setAllocationSections(allocId, data.section_ids);
  }

  // Immediately insert the monthly instance for this month
  await sql`
    INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
    VALUES (${userId}, ${allocId}, ${month}, ${data.amount})
    ON CONFLICT (allocation_id, month) DO NOTHING
  `;

  revalidatePath("/revenus");
}

// ─── Override monthly allocation ─────────────────────────────────────────────

export async function updateMonthlyAllocation(
  id: string,
  amount: number,
  notes?: string | null,
): Promise<void> {
  validateInput(UpdateMonthlyAllocationSchema, { id, amount, notes });
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_allocations SET
      allocated_amount = ${amount},
      notes = ${notes ?? null}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath("/revenus");
}
