export type InvitationView = {
  id: string;
  spaceId: string;
  spaceName: string;
  inviterName: string;
  recipientEmail: string;
  status: "pending" | "accepted" | "declined" | "expired";
  deliveryStatus: "pending" | "sending" | "sent" | "failed" | "uncertain";
  expiresAt: string;
  lastError: string | null;
};
export type InvitationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
