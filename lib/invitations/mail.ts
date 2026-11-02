import nodemailer from "nodemailer";

export type InvitationMail = {
  id: string;
  to: string;
  origin: string;
  token: string;
  spaceName: string;
  inviterName: string;
  from: string;
  templateVersion: number;
};
const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

/** Server only. Never reads EMAIL_TO: the explicit invited address is the recipient. */
/** Version 1 is immutable: retain this renderer while pending v1 invitations exist. */
export function renderInvitationMail(message: InvitationMail) {
  if (message.templateVersion !== 1)
    throw new Error("Unsupported invitation template.");
  const from = message.from;
  if (!from || /[\r\n]/.test(from))
    throw new Error("Invitation sender missing.");
  const link = `${message.origin}/invitation/${message.token}`;
  const subject = `Invitation à rejoindre ${message.spaceName} — Mes Finances`;
  const text = `${message.inviterName} t’invite à rejoindre « ${message.spaceName} » dans Mes Finances.\n\nChaque membre a les mêmes droits pour gérer les finances de cet espace.\n\nOuvre ce lien pour te connecter ou créer ton compte, puis accepter l’invitation :\n${link}\n\nCette invitation est valable 7 jours. Aucun accès n’est accordé avant ton acceptation. Si tu ne connais pas cette invitation, tu peux l’ignorer.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a"><h1>À gérer ensemble.</h1><p>${escapeHtml(message.inviterName)} t’invite à rejoindre <strong>${escapeHtml(message.spaceName)}</strong>.</p><p>Chaque membre a les mêmes droits pour gérer les finances de cet espace.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;background:#0f766e;color:white;padding:14px 20px;border-radius:12px;text-decoration:none">Voir l’invitation</a></p><p>Connecte-toi ou crée ton compte, puis accepte l’invitation. Aucun accès n’est accordé avant ton acceptation.</p><p>Invitation valable 7 jours. Si tu ne la reconnais pas, tu peux ignorer ce courriel.</p></div>`;
  return { from, to: [message.to], subject, text, html };
}

export function invitationSender() {
  const from = process.env.EMAIL_FROM;
  if (!from || /[\r\n]/.test(from))
    throw new Error("Invitation sender missing.");
  return from;
}

export async function sendInvitationMail(
  message: InvitationMail,
): Promise<string> {
  const payload = renderInvitationMail(message);
  const transport = process.env.MES_FINANCES_MAIL_TRANSPORT ?? "resend";
  if (transport === "mailpit") {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    if (
      process.env.MES_FINANCES_DB_DRIVER !== "local-fixture" ||
      !host ||
      !["localhost", "127.0.0.1", "::1"].includes(host) ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    )
      throw new Error(
        "Mailpit requires the local fixture and a loopback SMTP endpoint.",
      );
    const smtp = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      logger: false,
      debug: false,
    });
    const receipt = await smtp.sendMail({
      ...payload,
      messageId: `<space-invitation-${message.id}@mes-finances.local>`,
    });
    if (!receipt.accepted?.length)
      throw new Error("Mailpit did not accept the invitation.");
    return String(receipt.messageId);
  }
  if (transport !== "resend" || !process.env.RESEND_API_KEY)
    throw new Error("Resend is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `space-invitation/${message.id}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error("Invitation email provider rejected the request.");
  const receipt = await response.json();
  if (typeof receipt.id !== "string")
    throw new Error("Invalid invitation email receipt.");
  return receipt.id;
}
