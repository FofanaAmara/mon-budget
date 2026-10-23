"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { DEFAULT_SECTIONS } from "@/lib/constants";
import { requireIdentity, requireSpace, requireSpacesReady, SpaceAccessError, SpacesUnavailableError } from "@/lib/spaces/context";
import { CreateSpaceSchema, SpaceNameSchema } from "@/lib/spaces/schemas";
import type { FinancialSpace, SpaceMember, SpaceMutationResult } from "@/lib/spaces/types";

const timestamp = (value: string | Date) => value instanceof Date ? value.toISOString() : value;

async function mutation<T>(work: () => Promise<T>): Promise<SpaceMutationResult<T>> {
  try { return { ok: true, data: await work() }; }
  catch (error) {
    if (error instanceof SpaceAccessError || error instanceof SpacesUnavailableError) return { ok: false, error: error.message };
    throw error;
  }
}

async function syncProfile(identity: Awaited<ReturnType<typeof requireIdentity>>) {
  await sql`INSERT INTO user_display_profiles(user_id,display_name,email,email_verified)
    VALUES(${identity.id},${identity.name},${identity.email},${identity.emailVerified})
    ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,email=EXCLUDED.email,email_verified=EXCLUDED.email_verified,updated_at=now()
    WHERE (user_display_profiles.display_name,user_display_profiles.email,user_display_profiles.email_verified)
      IS DISTINCT FROM (EXCLUDED.display_name,EXCLUDED.email,EXCLUDED.email_verified)`;
}

export async function getSpaces(): Promise<FinancialSpace[]> {
  const identity = await requireIdentity();
  await requireSpacesReady();
  await syncProfile(identity);
  const rows = await sql`SELECT s.id,s.name,s.created_at,
      (SELECT count(*) FROM space_memberships members WHERE members.space_id=s.id) AS member_count
    FROM financial_spaces s JOIN space_memberships m ON m.space_id=s.id
    WHERE m.user_id=${identity.id} ORDER BY m.joined_at,s.id`;
  return rows.map(row => ({ id: row.id, name: row.name, createdAt: timestamp(row.created_at), memberCount: Number(row.member_count) }));
}

export async function getLastSpace(): Promise<FinancialSpace | null> {
  const identity = await requireIdentity();
  await requireSpacesReady();
  const rows = await sql`SELECT s.id,s.name,s.created_at,(s.id=p.last_space_id) AS is_preferred,
      (SELECT count(*) FROM space_memberships members WHERE members.space_id=s.id) AS member_count
    FROM space_memberships m JOIN financial_spaces s ON s.id=m.space_id
    LEFT JOIN user_space_preferences p ON p.user_id=m.user_id
    WHERE m.user_id=${identity.id}
    ORDER BY (s.id=p.last_space_id) DESC NULLS LAST,m.joined_at,s.id LIMIT 2`;
  const chosen = rows[0] && (rows[0].is_preferred || rows.length === 1) ? rows[0] : null;
  return chosen ? { id: chosen.id, name: chosen.name, createdAt: timestamp(chosen.created_at), memberCount: Number(chosen.member_count) } : null;
}

export async function createSpace(input: { name: string; creationKey: string; expectedActorId: string }): Promise<SpaceMutationResult<FinancialSpace>> {
  return mutation(async () => {
    const identity = await requireIdentity();
    const parsed = CreateSpaceSchema.safeParse(input);
    if (!parsed.success) throw new SpaceAccessError(parsed.error.issues[0].message);
    if (parsed.data.expectedActorId !== identity.id)
      throw new SpaceAccessError("La session a changé. Recharge tes espaces avant de continuer.");
    await requireSpacesReady();
    const { name, creationKey } = parsed.data;
    const fingerprint = createHash("sha256").update(JSON.stringify({ name })).digest("hex");
    // The settings insert is a durable provisioning marker. Only its winner
    // seeds defaults, so concurrent same-key requests cannot duplicate sections.
    const rows = await sql`
      WITH space AS (
        INSERT INTO financial_spaces(name,created_by,creation_key,creation_fingerprint)
        SELECT ${name},${identity.id},${creationKey},${fingerprint}
        FROM financial_space_rollout WHERE singleton AND phase='ready'
        ON CONFLICT(created_by,creation_key) DO UPDATE SET updated_at=financial_spaces.updated_at
          WHERE financial_spaces.creation_fingerprint=EXCLUDED.creation_fingerprint
        RETURNING id,name,created_at
      ), membership AS (
        INSERT INTO space_memberships(space_id,user_id) SELECT id,${identity.id} FROM space
        ON CONFLICT(space_id,user_id) DO NOTHING
      ), settings AS (
        INSERT INTO space_settings(space_id) SELECT id FROM space
        ON CONFLICT(space_id) DO NOTHING RETURNING space_id
      ), guide AS (
        INSERT INTO space_setup_guide(space_id) SELECT space_id FROM settings
      ), sections AS (
        INSERT INTO sections(space_id,user_id,name,icon,color,position)
        SELECT s.space_id,${identity.id},d.name,d.icon,d.color,d.position
        FROM settings s CROSS JOIN jsonb_to_recordset(${JSON.stringify(DEFAULT_SECTIONS)}::jsonb)
          AS d(name text,icon text,color text,position integer)
      ), profile AS (
        INSERT INTO user_display_profiles(user_id,display_name,email,email_verified)
        SELECT ${identity.id},${identity.name},${identity.email},${identity.emailVerified} FROM space
        ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,email=EXCLUDED.email,email_verified=EXCLUDED.email_verified,updated_at=now()
      ), preference AS (
        INSERT INTO user_space_preferences(user_id,last_space_id) SELECT ${identity.id},space_id FROM settings
        ON CONFLICT(user_id) DO UPDATE SET last_space_id=EXCLUDED.last_space_id,updated_at=now()
      ) SELECT id,name,created_at FROM space
    `;
    if (!rows[0]) throw new SpaceAccessError("Cette demande a déjà servi à créer un autre espace. Réessaie avec une nouvelle demande.");
    const members = await sql`SELECT count(*) AS count FROM space_memberships WHERE space_id=${rows[0].id}`;
    const space: FinancialSpace = { id: rows[0].id, name: rows[0].name, createdAt: timestamp(rows[0].created_at), memberCount: Number(members[0].count) };
    revalidatePath(`/espaces/${space.id}`, "layout");
    return space;
  });
}

export async function renameSpace(spaceId: string, name: string): Promise<SpaceMutationResult<{ id: string; name: string }>> {
  return mutation(async () => {
    const context = await requireSpace(spaceId);
    const parsed = SpaceNameSchema.safeParse(name);
    if (!parsed.success) throw new SpaceAccessError(parsed.error.issues[0].message);
    const rows = await sql`UPDATE financial_spaces s SET name=${parsed.data},updated_at=now()
      WHERE s.id=${context.spaceId} AND EXISTS(SELECT 1 FROM space_memberships m WHERE m.space_id=s.id AND m.user_id=${context.userId})
      RETURNING id,name`;
    if (!rows[0]) throw new SpaceAccessError("Cet espace est introuvable ou inaccessible.");
    revalidatePath(`/espaces/${context.spaceId}`, "layout");
    return { id: rows[0].id, name: rows[0].name };
  });
}

export async function rememberSpace(spaceId: string): Promise<SpaceMutationResult<{ id: string }>> {
  return mutation(async () => {
    const context = await requireSpace(spaceId);
    await sql`INSERT INTO user_space_preferences(user_id,last_space_id) VALUES(${context.userId},${context.spaceId})
      ON CONFLICT(user_id) DO UPDATE SET last_space_id=EXCLUDED.last_space_id,updated_at=now()`;
    return { id: context.spaceId };
  });
}

export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const context = await requireSpace(spaceId);
  const rows = await sql`SELECT m.user_id,m.joined_at,p.display_name,p.email FROM space_memberships m
    LEFT JOIN user_display_profiles p ON p.user_id=m.user_id
    WHERE m.space_id=${context.spaceId} ORDER BY m.joined_at,m.user_id`;
  return rows.map(row => ({ userId: row.user_id, name: row.display_name || "Membre", email: row.email || null,
    joinedAt: timestamp(row.joined_at), isCurrentUser: row.user_id === context.userId }));
}
