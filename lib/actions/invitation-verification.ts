"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import {
  requireIdentity,
  requireSpacesReady,
  SpaceAccessError,
} from "@/lib/spaces/context";
import { hashToken, InvitationEmail } from "@/lib/invitations/security";

const requestSchema = z.object({
  token: z.string().regex(/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/),
  expectedActorId: z.string().min(1).max(256),
});
const codeSchema = requestSchema.extend({ code: z.string().trim().regex(/^\d{4,12}$/) });
type VerificationRequest = z.infer<typeof requestSchema>;
export type VerificationOutcome =
  | { ok: true; status: "sent" | "verified" }
  | { ok: false; error: string };

const unavailable = "Cette invitation est introuvable, expirée ou indisponible pour ce compte.";
const changed = "La session a changé. Recharge cette invitation avant de continuer.";
const sendFailure = "L’envoi du code n’a pas pu être confirmé. Si un courriel arrive, utilise son code ; sinon, réessaie dans une minute.";
const verifyFailure = "La vérification n’a pas pu être confirmée. Réessaie ou demande un nouveau code.";

async function recipient(input: VerificationRequest) {
  const identity = await requireIdentity({ fresh: true });
  if (identity.id !== input.expectedActorId) throw new SpaceAccessError(changed);
  const email = InvitationEmail.safeParse(identity.email);
  if (!email.success) throw new SpaceAccessError(unavailable);
  await requireSpacesReady();
  const rows = await sql`
    SELECT id FROM space_invitations
    WHERE token_hash=${hashToken(input.token)} AND recipient_email=${email.data}
      AND status='pending' AND expires_at>now()
  `;
  if (!rows[0]) throw new SpaceAccessError(unavailable);
  return { ...identity, email: email.data };
}

function verificationError(code: string | undefined) {
  if (code === "TOO_MANY_ATTEMPTS" || code === "TOO_MANY_REQUESTS")
    return "Trop de tentatives. Attends une minute avant de demander un nouveau code.";
  if (code === "INVALID_OTP" || code === "OTP_EXPIRED" || code === "OTP_NOT_FOUND")
    return "Ce code est incorrect ou a expiré. Vérifie le dernier courriel reçu ou demande un nouveau code.";
  return verifyFailure;
}

export async function requestInvitationVerification(
  input: VerificationRequest,
): Promise<VerificationOutcome> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: unavailable };
  try {
    const identity = await recipient(parsed.data);
    if (identity.emailVerified) return { ok: true, status: "verified" };
    const result = await auth.emailOtp.sendVerificationOtp({
      email: identity.email,
      type: "email-verification",
    });
    if (result.error || result.data?.success !== true)
      return { ok: false, error: result.error?.code === "TOO_MANY_REQUESTS" ? verificationError(result.error.code) : sendFailure };
    return { ok: true, status: "sent" };
  } catch (error) {
    return { ok: false, error: error instanceof SpaceAccessError ? error.message : sendFailure };
  }
}

export async function verifyInvitationEmail(
  input: VerificationRequest & { code: string },
): Promise<VerificationOutcome> {
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Entre le code numérique reçu par courriel." };
  try {
    const identity = await recipient(parsed.data);
    if (identity.emailVerified) return { ok: true, status: "verified" };
    const result = await auth.emailOtp.verifyEmail({
      email: identity.email,
      otp: parsed.data.code,
    });
    if (result.error || result.data?.status !== true)
      return { ok: false, error: verificationError(result.error?.code) };
    // Provider tokens are never serialized. Only a fresh session proves ownership.
    const current = await requireIdentity({ fresh: true });
    if (current.id !== identity.id || current.email?.trim().toLowerCase() !== identity.email)
      return { ok: false, error: changed };
    if (!current.emailVerified) return { ok: false, error: verifyFailure };
    return { ok: true, status: "verified" };
  } catch (error) {
    return { ok: false, error: error instanceof SpaceAccessError ? error.message : verifyFailure };
  }
}
