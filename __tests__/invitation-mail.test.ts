import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import {
  invitationSender,
  renderInvitationMail,
  sendInvitationMail,
  type InvitationMail,
} from "@/lib/invitations/mail";
import {
  InvitationEmail,
  validInvitationReturn,
  invitationToken,
  hashToken,
  appOrigin,
} from "@/lib/invitations/security";
const message: InvitationMail = {
  id: "00000000-0000-4000-8000-000000000001",
  to: "recipient@example.test",
  from: "Mes Finances <from@example.test>",
  origin: "https://finance.example.test",
  token: "fixture-token",
  spaceName: "Couple <&>",
  inviterName: 'Alice "A"',
  templateVersion: 1,
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("invitation security and email contracts", () => {
  it("bounds return paths to invitation links and requires a trusted origin", () => {
    const path = "/invitation/" + message.id + "." + "a".repeat(43);
    expect(validInvitationReturn(path)).toBe(path);
    for (const value of [
      "https://evil.test",
      "//evil.test",
      path + "?redirect=evil",
      path + "#fragment",
      "/espaces",
      "/invitation/bad",
    ])
      expect(validInvitationReturn(value)).toBeNull();
    vi.stubEnv("MES_FINANCES_DB_DRIVER", "neon");
    vi.stubEnv("APP_ORIGIN", "http://example.test");
    expect(() => appOrigin()).toThrow();
    vi.stubEnv("APP_ORIGIN", "https://finance.example.test");
    expect(appOrigin()).toBe("https://finance.example.test");
  });
  it("normalizes case without merging distinct aliases and signs distinct nonces", () => {
    expect(InvitationEmail.parse(" A+couple@EXAMPLE.TEST ")).toBe(
      "a+couple@example.test",
    );
    vi.stubEnv(
      "INVITATION_TOKEN_SECRET",
      "fixture-secret-0123456789abcdef0123456789abcdef",
    );
    const token = invitationToken(message.id, "nonce-a");
    expect(token).toMatch(/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/);
    expect(hashToken(token)).toHaveLength(64);
    expect(invitationToken(message.id, "nonce-b")).not.toBe(token);
  });
  it("keeps the v1 payload stable and escapes untrusted display names", () => {
    const payload = renderInvitationMail(message);
    expect(payload.html).toContain("Couple &lt;&amp;&gt;");
    expect(payload.html).toContain("Alice &quot;A&quot;");
    expect(payload.to).toEqual([message.to]);
    expect(
      createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    ).toBe("6dcb9aebc7780ab08353d08f4a6bdfb746aa5a36278f9b73998713e0d7b2ef99");
    expect(() =>
      renderInvitationMail({ ...message, templateVersion: 2 }),
    ).toThrow();
    vi.stubEnv("EMAIL_FROM", "bad\r\nBcc: stolen@example.test");
    expect(() => invitationSender()).toThrow();
  });
  it("sends only the explicit recipient and frozen payload with the same provider key", async () => {
    vi.stubEnv("EMAIL_TO", "unrelated@example.test");
    vi.stubEnv("EMAIL_FROM", "changed@example.test");
    vi.stubEnv("RESEND_API_KEY", "fixture-key");
    vi.stubEnv("MES_FINANCES_MAIL_TRANSPORT", "resend");
    const fetch = vi
      .fn()
      .mockImplementation(
        async () =>
          new Response(JSON.stringify({ id: "receipt" }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetch);
    expect(await sendInvitationMail(message)).toBe("receipt");
    expect(await sendInvitationMail(message)).toBe("receipt");
    expect(fetch.mock.calls[0][1].body).toBe(fetch.mock.calls[1][1].body);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(
      renderInvitationMail(message),
    );
    expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(
      "space-invitation/" + message.id,
    );
  });
  it("does not leak provider errors or permit remote Mailpit SMTP", async () => {
    vi.stubEnv("MES_FINANCES_MAIL_TRANSPORT", "resend");
    vi.stubEnv("RESEND_API_KEY", "fixture-key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("private-provider-details", { status: 500 }),
        ),
    );
    await expect(sendInvitationMail(message)).rejects.toThrow(
      "Invitation email provider rejected the request.",
    );
    vi.stubEnv("MES_FINANCES_MAIL_TRANSPORT", "mailpit");
    vi.stubEnv("MES_FINANCES_DB_DRIVER", "local-fixture");
    vi.stubEnv("SMTP_HOST", "remote.example.test");
    vi.stubEnv("SMTP_PORT", "1025");
    await expect(sendInvitationMail(message)).rejects.toThrow("loopback");
  });
});
