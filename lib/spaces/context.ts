import { auth, authSessionReader } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import { SpaceIdSchema } from "./schemas";

export class SpaceAccessError extends Error {}
export class UnauthenticatedSpaceError extends SpaceAccessError {}
export class SpacesUnavailableError extends Error {}

export async function requireIdentity(
  options: { fresh?: boolean; readOnly?: boolean } = {},
) {
  const { data: session } = await (options.fresh && !options.readOnly
    ? auth.getSession({ query: { disableCookieCache: "true" } })
    : authSessionReader.getSession());
  if (!session?.user?.id)
    throw new UnauthenticatedSpaceError("Connecte-toi pour continuer.");
  return {
    id: session.user.id,
    name: session.user.name || null,
    email: session.user.email || null,
    emailVerified: session.user.emailVerified === true,
  };
}

export async function requireSpacesReady() {
  const rows =
    await sql`SELECT phase,EXISTS(SELECT 1 FROM financial_space_migrations WHERE name='006-invitations.sql') AS complete FROM financial_space_rollout WHERE singleton`;
  if (rows[0]?.phase !== "ready" || !rows[0]?.complete) {
    throw new SpacesUnavailableError(
      "Les espaces sont en cours de préparation. Réessaie dans un instant.",
    );
  }
}

/** Explicit URL/action target only. Never replace a forbidden target with a last space. */
export async function requireSpace(spaceId: string) {
  const identity = await requireIdentity();
  const parsed = SpaceIdSchema.safeParse(spaceId);
  if (!parsed.success)
    throw new SpaceAccessError("Cet espace est introuvable ou inaccessible.");
  const rows = await sql`
    SELECT s.id, s.name, s.created_by FROM financial_spaces s
    JOIN space_memberships m ON m.space_id=s.id AND m.user_id=${identity.id}
    CROSS JOIN financial_space_rollout r
    WHERE s.id=${parsed.data} AND r.singleton AND r.phase='ready' AND EXISTS(SELECT 1 FROM financial_space_migrations WHERE name='006-invitations.sql')
  `;
  if (!rows[0])
    throw new SpaceAccessError("Cet espace est introuvable ou inaccessible.");
  return {
    spaceId: rows[0].id as string,
    userId: identity.id,
    name: rows[0].name as string,
    createdByCurrentUser: rows[0].created_by === identity.id,
  };
}
