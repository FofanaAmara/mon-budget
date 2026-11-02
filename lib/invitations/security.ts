import { createHmac, createHash } from "node:crypto";
import { z } from "zod";

export const InvitationEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Entre un courriel valide.")
  .max(254);
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function invitationToken(id: string, nonce: string) {
  const secret =
    process.env.INVITATION_TOKEN_SECRET ?? process.env.NEON_AUTH_COOKIE_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Invitation signing secret is not configured.");
  return `${id}.${createHmac("sha256", secret).update(`financial-space-invitation:v1:${id}:${nonce}`).digest("base64url")}`;
}
export function appOrigin() {
  const configured =
    process.env.APP_ORIGIN ??
    (process.env.MES_FINANCES_DB_DRIVER === "local-fixture"
      ? "http://localhost:3002"
      : null);
  if (!configured) throw new Error("APP_ORIGIN is not configured.");
  const url = new URL(configured);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        process.env.MES_FINANCES_DB_DRIVER === "local-fixture" &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  )
    throw new Error("APP_ORIGIN must be a trusted application origin.");
  return url.origin;
}
export { validInvitationReturn } from "./return-path";
