"use server";

import { randomUUID, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import {
  requireIdentity,
  requireSpace,
  requireSpacesReady,
  SpaceAccessError,
} from "@/lib/spaces/context";
import { idSchema } from "@/lib/schemas/common";
import {
  InvitationEmail,
  invitationToken,
  hashToken,
  appOrigin,
} from "@/lib/invitations/security";
import { sendInvitationMail, invitationSender } from "@/lib/invitations/mail";
import type { InvitationView, InvitationResult } from "@/lib/invitations/types";

type Row = {
  id: string;
  space_id: string;
  space_name: string;
  inviter_name: string;
  recipient_email: string;
  status: InvitationView["status"];
  delivery_status: InvitationView["deliveryStatus"];
  expires_at: string | Date;
  last_error: string | null;
};
const view = (row: Row): InvitationView => ({
  id: row.id,
  spaceId: row.space_id,
  spaceName: row.space_name,
  inviterName: row.inviter_name,
  recipientEmail: row.recipient_email,
  status:
    row.status === "pending" && new Date(row.expires_at).getTime() <= Date.now()
      ? "expired"
      : row.status,
  deliveryStatus: row.delivery_status,
  expiresAt: new Date(row.expires_at).toISOString(),
  lastError: row.last_error,
});
const invalid =
  "Cette invitation est introuvable, expirée ou indisponible pour ce compte.";

export async function getSentInvitations(
  spaceId: string,
): Promise<InvitationView[]> {
  await requireSpace(spaceId);
  const rows =
    await sql`SELECT i.*,s.name AS space_name,i.inviter_name_snapshot AS inviter_name FROM space_invitations i
    JOIN financial_spaces s ON s.id=i.space_id WHERE i.space_id=${spaceId} AND i.status='pending' ORDER BY i.created_at DESC`;
  return rows.map((row) => view(row as Row));
}

export async function getReceivedInvitations(): Promise<{
  verified: boolean;
  invitations: InvitationView[];
}> {
  const identity = await requireIdentity();
  await requireSpacesReady();
  if (!identity.emailVerified || !identity.email)
    return { verified: false, invitations: [] };
  const email = InvitationEmail.parse(identity.email);
  const rows =
    await sql`SELECT i.*,s.name AS space_name,i.inviter_name_snapshot AS inviter_name FROM space_invitations i
    JOIN financial_spaces s ON s.id=i.space_id
    WHERE i.recipient_email=${email} AND i.status='pending' AND i.expires_at>now() ORDER BY i.created_at DESC`;
  return { verified: true, invitations: rows.map((row) => view(row as Row)) };
}

export async function getPublicInvitation(token: string): Promise<{
  id: string;
  spaceName: string;
  inviterName: string;
  status: string;
  recipientMatches: boolean;
  verified: boolean;
  authenticated: boolean;
} | null> {
  if (!/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  await requireSpacesReady();
  const [row] =
    await sql`SELECT i.id,s.name,i.inviter_name_snapshot,i.recipient_email,i.status,i.expires_at,i.responded_by
    FROM space_invitations i JOIN financial_spaces s ON s.id=i.space_id WHERE i.token_hash=${hashToken(token)}`;
  if (!row) return null;
  let identity: Awaited<ReturnType<typeof requireIdentity>> | null = null;
  try {
    identity = await requireIdentity();
  } catch (error) {
    if (!(error instanceof SpaceAccessError)) throw error;
  }
  return {
    id: row.id,
    spaceName: row.name,
    inviterName: row.inviter_name_snapshot,
    status:
      row.status === "pending" &&
      new Date(row.expires_at).getTime() <= Date.now()
        ? "expired"
        : row.status,
    recipientMatches: Boolean(
      identity?.email &&
      identity.email.trim().toLowerCase() === row.recipient_email,
    ),
    verified: identity?.emailVerified === true,
    authenticated: Boolean(identity),
  };
}

export async function inviteToSpace(
  spaceId: string,
  emailInput: string,
): Promise<InvitationResult<InvitationView>> {
  const context = await requireSpace(spaceId);
  const identity = await requireIdentity();
  const parsed = InvitationEmail.safeParse(emailInput);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const email = parsed.data;
  if (identity.email?.trim().toLowerCase() === email)
    return { ok: false, error: "Tu fais déjà partie de cet espace." };
  const sender = invitationSender(),
    origin = appOrigin(),
    id = randomUUID(),
    nonce = randomBytes(32).toString("hex"),
    token = invitationToken(id, nonce);
  const results = await sql.transaction((txn) => [
    txn`SELECT pg_advisory_xact_lock(hashtextextended(${`space-invitation-create:${identity.id}`},0))`,
    txn`SELECT id FROM financial_spaces WHERE id=${spaceId} FOR NO KEY UPDATE`,
    txn`UPDATE space_invitations SET status='expired' WHERE space_id=${spaceId} AND recipient_email=${email} AND status='pending' AND expires_at<=now()`,
    txn`WITH existing AS (SELECT id FROM space_invitations WHERE space_id=${spaceId} AND recipient_email=${email} AND status='pending'),
      inserted AS (
        INSERT INTO space_invitations(id,space_id,recipient_email,invited_by,token_nonce,token_hash,origin,space_name_snapshot,inviter_name_snapshot,mail_from)
        SELECT ${id},${spaceId},${email},${identity.id},${nonce},${hashToken(token)},${origin},s.name,${identity.name || "Un membre"},${sender} FROM financial_spaces s
        WHERE s.id=${spaceId} AND NOT EXISTS(SELECT 1 FROM existing)
          AND NOT EXISTS(SELECT 1 FROM space_memberships m JOIN user_display_profiles p ON p.user_id=m.user_id WHERE m.space_id=${spaceId} AND p.email_verified AND lower(btrim(p.email))=${email})
          AND (SELECT count(*) FROM space_invitations WHERE invited_by=${identity.id} AND created_at>now()-interval '1 hour')<20
        ON CONFLICT(space_id,recipient_email) WHERE status='pending' DO NOTHING RETURNING id
      ) SELECT id FROM inserted UNION ALL SELECT id FROM existing`,
  ]);
  const invitationId = results[3][0]?.id;
  if (!invitationId)
    return {
      ok: false,
      error:
        "Cette personne est déjà membre ou la limite d’invitations est atteinte. Réessaie plus tard.",
    };
  const delivery = await retryInvitationDelivery(spaceId, invitationId);
  const sent = await getSentInvitations(spaceId);
  const invitation = sent.find((row) => row.id === invitationId);
  if (!invitation)
    return {
      ok: false,
      error: "L’invitation a déjà été traitée. Actualise cet espace.",
    };
  if (
    !delivery.ok &&
    invitation.deliveryStatus !== "sent" &&
    !invitation.lastError
  )
    invitation.lastError = delivery.error;
  revalidatePath(`/espaces/${context.spaceId}`, "layout");
  return { ok: true, data: invitation };
}

/** Durable pending row is committed before the bounded external send. Any member can retry. */
export async function retryInvitationDelivery(
  spaceId: string,
  invitationId: string,
): Promise<InvitationResult<{ state: string }>> {
  const { userId } = await requireSpace(spaceId);
  if (!idSchema.safeParse(invitationId).success)
    return { ok: false, error: invalid };
  const lease = randomUUID(),
    attempt = randomUUID();
  const results = await sql.transaction((txn) => [
    txn`SELECT pg_advisory_xact_lock(hashtextextended('space-invitation-delivery-rate',0))`,
    txn`UPDATE space_invitations SET delivery_status='uncertain',last_error='L’envoi reste incertain. Aucun nouveau courriel ne sera envoyé automatiquement ; vérifie la réception avec le destinataire.'
      WHERE id=${invitationId} AND space_id=${spaceId} AND status='pending'
        AND delivery_status IN ('failed','sending') AND first_attempt_at<=now()-interval '23 hours'
        AND (delivery_status<>'sending' OR lease_until<now())`,
    txn`WITH claimed AS (
      UPDATE space_invitations i SET delivery_status='sending',delivery_lease=${lease},lease_until=now()+interval '60 seconds',last_attempt_at=now(),first_attempt_at=COALESCE(first_attempt_at,now()),last_error=NULL
      WHERE i.id=${invitationId} AND i.space_id=${spaceId} AND i.status='pending' AND i.expires_at>now()
        AND (i.delivery_status IN ('pending','failed') OR (i.delivery_status='sending' AND i.lease_until<now()))
        AND (i.first_attempt_at IS NULL OR i.first_attempt_at>now()-interval '23 hours')
        AND (i.last_attempt_at IS NULL OR i.last_attempt_at<now()-interval '60 seconds')
        AND (SELECT count(*) FROM space_invitation_delivery_attempts WHERE created_at>=date_trunc('day',now()))<80
        AND (SELECT count(*) FROM space_invitation_delivery_attempts WHERE invitation_id=i.id AND created_at>now()-interval '1 hour')<3
      RETURNING *
    ), logged AS (
      INSERT INTO space_invitation_delivery_attempts(id,invitation_id,requested_by,lease)
      SELECT ${attempt},id,${userId},${lease} FROM claimed RETURNING id
    ) SELECT * FROM claimed WHERE EXISTS(SELECT 1 FROM logged)`,
  ]);
  const row = results[2][0];
  if (!row) {
    const [existing] =
      await sql`SELECT delivery_status,status,expires_at,last_error FROM space_invitations WHERE id=${invitationId} AND space_id=${spaceId}`;
    if (
      !existing ||
      existing.status !== "pending" ||
      new Date(existing.expires_at).getTime() <= Date.now()
    )
      return { ok: false, error: invalid };
    if (existing.delivery_status === "uncertain")
      return { ok: false, error: existing.last_error };
    if (existing.delivery_status === "sent")
      return { ok: true, data: { state: "sent" } };
    return {
      ok: false,
      error:
        "Un envoi est en cours ou la limite est atteinte. Attends une minute avant de réessayer.",
    };
  }
  let providerId: string;
  try {
    const token = invitationToken(row.id, row.token_nonce);
    if (hashToken(token) !== row.token_hash)
      throw new Error("Invitation signing configuration changed.");
    providerId = await sendInvitationMail({
      from: row.mail_from,
      templateVersion: row.template_version,
      id: row.id,
      to: row.recipient_email,
      origin: row.origin,
      token,
      spaceName: row.space_name_snapshot,
      inviterName: row.inviter_name_snapshot,
    });
  } catch {
    await sql.transaction((txn) => [
      txn`UPDATE space_invitations SET delivery_status='failed',lease_until=NULL,last_error='Le courriel n’a pas pu être confirmé. Tu peux réessayer dans une minute.' WHERE id=${invitationId} AND delivery_lease=${lease}`,
      txn`UPDATE space_invitation_delivery_attempts SET outcome='failed' WHERE id=${attempt} AND lease=${lease}`,
    ]);
    revalidatePath(`/espaces/${spaceId}`, "layout");
    return {
      ok: false,
      error:
        "L’invitation est enregistrée, mais le courriel n’a pas pu être confirmé. Réessaie dans une minute.",
    };
  }
  await sql.transaction((txn) => [
    txn`UPDATE space_invitations SET delivery_status='sent',lease_until=NULL,last_error=NULL WHERE id=${invitationId} AND delivery_lease=${lease}`,
    txn`UPDATE space_invitation_delivery_attempts SET outcome='sent',provider_message_id=${providerId} WHERE id=${attempt} AND lease=${lease}`,
  ]);
  revalidatePath(`/espaces/${spaceId}`, "layout");
  return { ok: true, data: { state: "sent" } };
}

export async function respondToInvitation(
  invitationId: string,
  response: "accept" | "decline",
): Promise<
  InvitationResult<{ spaceId: string; spaceName: string; accepted: boolean }>
> {
  const identity = await requireIdentity();
  await requireSpacesReady();
  if (!identity.emailVerified || !identity.email)
    return {
      ok: false,
      error:
        "Vérifie l’adresse courriel de ton compte avant de répondre à cette invitation.",
    };
  if (
    !idSchema.safeParse(invitationId).success ||
    !["accept", "decline"].includes(response)
  )
    return { ok: false, error: invalid };
  const email = InvitationEmail.parse(identity.email),
    status = response === "accept" ? "accepted" : "declined";
  const rows = await sql`WITH target AS MATERIALIZED (
    SELECT * FROM space_invitations WHERE id=${invitationId} AND recipient_email=${email} FOR UPDATE
  ), changed AS (
    UPDATE space_invitations i SET status=${status},responded_by=${identity.id},responded_at=now()
    FROM target t WHERE i.id=t.id AND t.status='pending' AND t.expires_at>now() RETURNING i.*
  ), membership AS (
    INSERT INTO space_memberships(space_id,user_id) SELECT space_id,${identity.id} FROM changed WHERE status='accepted'
    ON CONFLICT(space_id,user_id) DO NOTHING
  ), profile AS (
    INSERT INTO user_display_profiles(user_id,display_name,email,email_verified)
    SELECT ${identity.id},${identity.name},${identity.email},true FROM changed WHERE status='accepted'
    ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,email=EXCLUDED.email,email_verified=true,updated_at=now()
  ), result AS (
    SELECT space_id FROM changed
    UNION ALL SELECT space_id FROM target WHERE status=${status} AND responded_by=${identity.id}
  ) SELECT s.id,s.name FROM financial_spaces s JOIN result r ON r.space_id=s.id LIMIT 1`;
  if (!rows[0]) return { ok: false, error: invalid };

  revalidatePath(`/espaces/${rows[0].id}`, "layout");
  return {
    ok: true,
    data: {
      spaceId: rows[0].id,
      spaceName: rows[0].name,
      accepted: response === "accept",
    },
  };
}

/** Confirmation survives refresh and is visible only to the responding verified account. */
export async function getInvitationResponse(invitationId: string) {
  const identity = await requireIdentity();
  await requireSpacesReady();
  if (
    !identity.emailVerified ||
    !identity.email ||
    !idSchema.safeParse(invitationId).success
  )
    return null;
  const [row] =
    await sql`SELECT s.id,s.name,i.status FROM space_invitations i JOIN financial_spaces s ON s.id=i.space_id
 WHERE i.id=${invitationId} AND i.responded_by=${identity.id} AND i.recipient_email=${InvitationEmail.parse(identity.email)} AND i.status IN ('accepted','declined')`;
  return row
    ? {
        spaceId: row.id as string,
        spaceName: row.name as string,
        accepted: row.status === "accepted",
      }
    : null;
}
