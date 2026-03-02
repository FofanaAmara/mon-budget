'use server';

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { createIncome } from '@/lib/actions/incomes';

// ─── Category → Section mapping ─────────────────────────────────
const CATEGORY_MAP: Record<string, { name: string; icon: string; color: string }> = {
  logement:     { name: 'Logement',     icon: '🏠', color: '#3D3BF3' },
  epicerie:     { name: 'Épicerie',     icon: '🛒', color: '#10B981' },
  transport:    { name: 'Transport',    icon: '🚗', color: '#F59E0B' },
  services:     { name: 'Services',     icon: '💡', color: '#0EA5E9' },
  restos:       { name: 'Restos',       icon: '🍽️', color: '#EC4899' },
  loisirs:      { name: 'Loisirs',      icon: '🎬', color: '#8B5CF6' },
  sante:        { name: 'Santé',        icon: '🏥', color: '#E53E3E' },
  vetements:    { name: 'Vêtements',    icon: '👕', color: '#6B7280' },
  abonnements:  { name: 'Abonnements',  icon: '📱', color: '#7C3AED' },
  education:    { name: 'Éducation',    icon: '🎓', color: '#14B8A6' },
  animaux:      { name: 'Animaux',      icon: '🐶', color: '#D97706' },
  cadeaux:      { name: 'Cadeaux',      icon: '🎁', color: '#F43F5E' },
};

export async function completeOnboarding(data: {
  monthlyRevenue: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  categories: string[];
  objective: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const userId = await requireAuth();

  try {
    // 1. Create the income (if amount provided)
    if (data.monthlyRevenue > 0) {
      await createIncome({
        name: 'Revenu principal',
        source: 'EMPLOYMENT',
        amount: data.monthlyRevenue,
        estimated_amount: null,
        frequency: 'MONTHLY',
      });
    }

    // 2. Delete any auto-created default sections before inserting onboarding ones
    await sql`DELETE FROM sections WHERE user_id = ${userId}`;

    // 3. Create sections from selected categories
    const cats = data.categories
      .map(id => CATEGORY_MAP[id])
      .filter(Boolean);

    if (cats.length > 0) {
      // Build VALUES for bulk insert
      for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        await sql`
          INSERT INTO sections (user_id, name, icon, color, position)
          VALUES (${userId}, ${cat.name}, ${cat.icon}, ${cat.color}, ${i})
        `;
      }
    }

    revalidatePath('/');
    revalidatePath('/revenus');
    revalidatePath('/depenses');
    revalidatePath('/sections');
    revalidatePath('/parametres');

    return { success: true };
  } catch (error) {
    console.error('completeOnboarding error:', error);
    return { success: false, error: 'Erreur lors de la configuration initiale.' };
  }
}
