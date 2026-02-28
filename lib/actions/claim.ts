'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';

// Checks if there are any orphaned rows with user_id = 'unclaimed'
export async function hasOrphanedData(): Promise<boolean> {
  const rows = await sql`SELECT COUNT(*) as count FROM sections WHERE user_id = 'unclaimed'`;
  return Number(rows[0].count) > 0;
}

// Claims all orphaned data (user_id = 'unclaimed') for the current user.
// This is a ONE-TIME action for the first user (Amara) to claim pre-existing data.
export async function claimOrphanedData(): Promise<{ claimed: number }> {
  const userId = await requireAuth();

  try {
    // Delete auto-created data that would conflict with claimed data:
    // - ensureDefaultSections() may have created default sections for this user
    // - getSettings() may have auto-created a settings row (UNIQUE constraint on user_id)
    await sql`DELETE FROM sections WHERE user_id = ${userId}`;
    await sql`DELETE FROM settings WHERE user_id = ${userId}`;

    // Claim all 10 tables — use RETURNING id to get actual count
    const r1 = await sql`UPDATE sections SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r2 = await sql`UPDATE cards SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r3 = await sql`UPDATE expenses SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r4 = await sql`UPDATE incomes SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r5 = await sql`UPDATE settings SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r6 = await sql`UPDATE monthly_expenses SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r7 = await sql`UPDATE monthly_incomes SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r8 = await sql`UPDATE savings_contributions SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r9 = await sql`UPDATE push_subscriptions SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r10 = await sql`UPDATE notification_log SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;
    const r11 = await sql`UPDATE debts SET user_id = ${userId} WHERE user_id = 'unclaimed' RETURNING id`;

    const total = r1.length + r2.length + r3.length + r4.length + r5.length +
      r6.length + r7.length + r8.length + r9.length + r10.length + r11.length;

    // Revalidate all pages
    revalidatePath('/');
    revalidatePath('/depenses');
    revalidatePath('/revenus');
    revalidatePath('/projets');
    revalidatePath('/parametres');
    revalidatePath('/cartes');
    revalidatePath('/sections');

    return { claimed: total };
  } catch (error) {
    console.error('Claim error:', error);
    throw new Error('Erreur lors de la recuperation des donnees');
  }
}

// Ensures the user has default sections. Called for new users on first visit.
const DEFAULT_SECTIONS = [
  { name: 'Maison',    icon: '🏠', color: '#3D3BF3', position: 0 },
  { name: 'Perso',     icon: '👤', color: '#8B5CF6', position: 1 },
  { name: 'Famille',   icon: '👨‍👩‍👧‍👦', color: '#EC4899', position: 2 },
  { name: 'Transport', icon: '🚗', color: '#F59E0B', position: 3 },
  { name: 'Business',  icon: '💼', color: '#10B981', position: 4 },
  { name: 'Projets',   icon: '🎯', color: '#EF4444', position: 5 },
];

export async function ensureDefaultSections(): Promise<void> {
  const userId = await requireAuth();
  const existing = await sql`SELECT COUNT(*) as count FROM sections WHERE user_id = ${userId}`;
  if (Number(existing[0].count) > 0) return; // already has sections

  for (const s of DEFAULT_SECTIONS) {
    await sql`
      INSERT INTO sections (user_id, name, icon, color, position)
      VALUES (${userId}, ${s.name}, ${s.icon}, ${s.color}, ${s.position})
    `;
  }
}
