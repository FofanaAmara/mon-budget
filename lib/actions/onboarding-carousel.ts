"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAuth } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/server";

/**
 * Checks whether the current user has already seen the onboarding carousel.
 * Returns false for new users (no row in user_onboarding = hasn't seen it).
 * Uses safe auth pattern (no throw) since this is a read-only query called from a server page.
 */
export async function hasSeenOnboarding(): Promise<boolean> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return false;
  const userId = session.user.id;

  const rows = await sql`
    SELECT has_seen_onboarding
    FROM user_onboarding
    WHERE user_id = ${userId}
  `;

  if (rows.length === 0) return false;
  return Boolean(rows[0].has_seen_onboarding);
}

/**
 * Marks the onboarding carousel as seen for the current user.
 * Called on both "C'est parti !" (complete) and "Passer" (skip).
 * Idempotent: uses ON CONFLICT to handle duplicate calls.
 */
export async function markOnboardingSeen(): Promise<void> {
  const userId = await requireAuth();

  await sql`
    INSERT INTO user_onboarding (user_id, has_seen_onboarding)
    VALUES (${userId}, true)
    ON CONFLICT (user_id)
    DO UPDATE SET has_seen_onboarding = true
  `;

  revalidatePath("/", "layout");
}
