'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import type { Settings } from '@/lib/types';

export async function getSettings(): Promise<Settings> {
  const rows = await sql`SELECT * FROM settings LIMIT 1`;
  if (rows.length === 0) {
    // Create default singleton if missing
    const created = await sql`
      INSERT INTO settings (default_currency, default_reminder_offsets, notify_push)
      VALUES ('CAD', '{1, 3, 7}', true)
      RETURNING *
    `;
    return created[0] as Settings;
  }
  return rows[0] as Settings;
}

export async function updateSettings(
  id: string,
  data: Partial<{
    email: string | null;
    phone: string | null;
    default_currency: string;
    default_reminder_offsets: number[];
    notify_push: boolean;
    notify_email: boolean;
    notify_sms: boolean;
  }>
): Promise<Settings> {
  const rows = await sql`
    UPDATE settings SET
      email        = CASE WHEN ${data.email !== undefined} THEN ${data.email ?? null} ELSE email END,
      phone        = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END,
      default_currency       = COALESCE(${data.default_currency ?? null}, default_currency),
      default_reminder_offsets = COALESCE(
        ${data.default_reminder_offsets ? JSON.stringify(data.default_reminder_offsets) : null}::integer[],
        default_reminder_offsets
      ),
      notify_push  = COALESCE(${data.notify_push  ?? null}, notify_push),
      notify_email = COALESCE(${data.notify_email ?? null}, notify_email),
      notify_sms   = COALESCE(${data.notify_sms   ?? null}, notify_sms),
      updated_at   = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidatePath('/parametres');
  return rows[0] as Settings;
}
