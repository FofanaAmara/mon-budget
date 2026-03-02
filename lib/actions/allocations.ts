'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import type { IncomeAllocation, MonthlyAllocation } from '@/lib/types';

// ─── Fetch templates ────────────────────────────────────────────────────────

export async function getAllocations(): Promise<IncomeAllocation[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      ia.*,
      s.name  AS section_name,
      s.icon  AS section_icon,
      s.color AS section_color,
      e.name  AS project_name,
      e.target_amount AS project_target_amount,
      e.saved_amount  AS project_saved_amount,
      e.target_date   AS project_target_date
    FROM income_allocations ia
    LEFT JOIN sections s ON ia.section_id = s.id
    LEFT JOIN expenses e ON ia.project_id = e.id
    WHERE ia.is_active = true AND ia.user_id = ${userId}
    ORDER BY ia.position ASC, ia.created_at ASC
  `;
  return rows as IncomeAllocation[];
}

// ─── Create / Update / Delete templates ─────────────────────────────────────

type AllocationInput = {
  label: string;
  amount: number;
  section_id?: string | null;
  project_id?: string | null;
  end_month?: string | null;
  color?: string;
  position?: number;
};

export async function createAllocation(data: AllocationInput): Promise<IncomeAllocation> {
  const userId = await requireAuth();

  // Position defaults to end of list
  const posRows = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
    FROM income_allocations
    WHERE is_active = true AND user_id = ${userId}
  `;
  const position = data.position ?? (posRows[0]?.next_pos ?? 0);

  const rows = await sql`
    INSERT INTO income_allocations
      (user_id, label, amount, section_id, project_id, end_month, color, position)
    VALUES (
      ${userId},
      ${data.label},
      ${data.amount},
      ${data.section_id ?? null},
      ${data.project_id ?? null},
      ${data.end_month ?? null},
      ${data.color ?? '#6B6966'},
      ${position}
    )
    RETURNING *
  `;
  revalidatePath('/parametres/allocation');
  revalidatePath('/revenus');
  return rows[0] as IncomeAllocation;
}

// Update always receives the full object (from modal form) so we can safely update all fields.
export async function updateAllocation(id: string, data: AllocationInput): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE income_allocations SET
      label      = ${data.label},
      amount     = ${data.amount},
      section_id = ${data.section_id ?? null},
      project_id = ${data.project_id ?? null},
      end_month  = ${data.end_month ?? null},
      color      = ${data.color ?? '#6B6966'},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND is_active = true
  `;
  revalidatePath('/parametres/allocation');
  revalidatePath('/revenus');
}

export async function deleteAllocation(id: string): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE income_allocations SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath('/parametres/allocation');
  revalidatePath('/revenus');
}

export async function reorderAllocations(orderedIds: string[]): Promise<void> {
  const userId = await requireAuth();
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE income_allocations SET position = ${i}, updated_at = NOW()
      WHERE id = ${orderedIds[i]} AND user_id = ${userId}
    `;
  }
  revalidatePath('/parametres/allocation');
}

// ─── Monthly generation ──────────────────────────────────────────────────────

// Idempotent — safe to call multiple times.
// Skips: (1) expired temporal allocations (month > end_month)
//        (2) savings allocations where project goal is already reached
export async function generateMonthlyAllocations(month: string): Promise<void> {
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

  for (const alloc of allocations as (IncomeAllocation & { project_target_amount: number | null; project_saved_amount: number | null })[]) {
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

export async function getMonthlyAllocations(month: string): Promise<MonthlyAllocation[]> {
  const userId = await requireAuth();
  const rows = await sql`
    SELECT
      ma.*,
      ia.label,
      ia.color,
      ia.position,
      ia.section_id,
      ia.project_id,
      ia.end_month,
      s.name  AS section_name,
      s.icon  AS section_icon,
      s.color AS section_color,
      e.name  AS project_name,
      e.target_amount AS project_target_amount,
      e.saved_amount  AS project_saved_amount,
      e.target_date   AS project_target_date
    FROM monthly_allocations ma
    JOIN income_allocations ia ON ma.allocation_id = ia.id
    LEFT JOIN sections s ON ia.section_id = s.id
    LEFT JOIN expenses e ON ia.project_id = e.id
    WHERE ma.month = ${month} AND ma.user_id = ${userId}
    ORDER BY ia.position ASC, ia.created_at ASC
  `;
  return rows as MonthlyAllocation[];
}

// ─── Adhoc allocation (one-time, current month only) ─────────────────────────

type AdhocAllocationInput = {
  label: string;
  amount: number;
  section_id?: string | null;
  project_id?: string | null;
  color?: string;
};

export async function createAdhocMonthlyAllocation(
  month: string,
  data: AdhocAllocationInput,
): Promise<void> {
  const userId = await requireAuth();

  // Position at end of list
  const posRows = await sql`
    SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
    FROM income_allocations
    WHERE is_active = true AND user_id = ${userId}
  `;
  const position = posRows[0]?.next_pos ?? 0;

  // Create a one-time template (expires at end of this month)
  const rows = await sql`
    INSERT INTO income_allocations
      (user_id, label, amount, section_id, project_id, end_month, color, position)
    VALUES (
      ${userId},
      ${data.label},
      ${data.amount},
      ${data.section_id ?? null},
      ${data.project_id ?? null},
      ${month},
      ${data.color ?? '#6B6966'},
      ${position}
    )
    RETURNING id
  `;
  const allocId = rows[0].id;

  // Immediately insert the monthly instance for this month
  await sql`
    INSERT INTO monthly_allocations (user_id, allocation_id, month, allocated_amount)
    VALUES (${userId}, ${allocId}, ${month}, ${data.amount})
    ON CONFLICT (allocation_id, month) DO NOTHING
  `;

  revalidatePath('/revenus');
}

// ─── Override monthly allocation ─────────────────────────────────────────────

export async function updateMonthlyAllocation(
  id: string,
  amount: number,
  notes?: string | null,
): Promise<void> {
  const userId = await requireAuth();
  await sql`
    UPDATE monthly_allocations SET
      allocated_amount = ${amount},
      notes = ${notes ?? null}
    WHERE id = ${id} AND user_id = ${userId}
  `;
  revalidatePath('/revenus');
}
