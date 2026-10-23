import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  test,
  expect,
  vi,
} from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { DatabaseSql } from "@/lib/database/types";
import { createLocalDatabase } from "@/lib/database/local";
import { localConnection, testBaseline } from "../../scripts/financial-spaces/local-fixture.mjs";
import {
  runMigrations,
  legacyFingerprint,
} from "../../scripts/financial-spaces/migrate.mjs";
import type { InvitationMail } from "@/lib/invitations/mail";
const state = vi.hoisted(() => ({
  identity: null as null | {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
  },
  sql: null as DatabaseSql | null,
  messages: [] as InvitationMail[],
  sessionRequests: [] as unknown[],
  fail: false,
  handler: null as null | ((message: InvitationMail) => Promise<string>),
  verificationRequests: [] as unknown[],
  verificationError: false,
}));
vi.mock("@/lib/auth/server", () => ({
  authSessionReader: {
    getSession: async () => ({
      data: state.identity ? { user: state.identity } : null,
    }),
  },
  auth: {
    emailOtp: {
      sendVerificationOtp: async (input: unknown) => {
        state.verificationRequests.push({ send: input });
        return { data: { success: true }, error: null };
      },
      verifyEmail: async (input: unknown) => {
        state.verificationRequests.push({ verify: input });
        if (state.verificationError) return { data: null, error: { code: "INVALID_OTP" } };
        if (state.identity) state.identity = { ...state.identity, emailVerified: true };
        return { data: { status: true }, error: null };
      },
    },
    getSession: async (options: unknown) => {
      state.sessionRequests.push(options);
      return {
        data: state.identity ? { user: state.identity } : null,
      };
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  sql: Object.assign(
    (s: TemplateStringsArray, ...v: unknown[]) => state.sql!(s, ...v),
    {
      transaction: (...args: Parameters<DatabaseSql["transaction"]>) =>
        state.sql!.transaction(...args),
    },
  ),
}));
vi.mock("@/lib/invitations/mail", () => ({
  invitationSender: () =>
    process.env.EMAIL_FROM || "Mes Finances <fixture@example.test>",
  sendInvitationMail: async (message: InvitationMail) => {
    state.messages.push(message);
    if (state.handler) return state.handler(message);
    if (state.fail) throw Error("fixture provider failure");
    return "fixture-provider-" + message.id;
  },
}));
import * as invitations from "@/lib/actions/invitations";
import { requestInvitationVerification, verifyInvitationEmail } from "@/lib/actions/invitation-verification";
import { createSpace, getSpaces, getLastSpace } from "@/lib/actions/spaces";
import { createCard, getCards } from "@/lib/actions/financial/cards";
import { requireSpace } from "@/lib/spaces/context";
const a = {
    id: "fixture-invite-a",
    name: "Alice",
    email: "alice@example.test",
    emailVerified: true,
  },
  b = {
    id: "fixture-invite-b",
    name: "Bob",
    email: "bob@example.test",
    emailVerified: true,
  },
  c = {
    id: "fixture-invite-c",
    name: "Camille",
    email: "camille@example.test",
    emailVerified: true,
  };
const database = "spaces_migration_test_" + randomBytes(4).toString("hex");
let native: Awaited<ReturnType<typeof localConnection>>,
  adapter: ReturnType<typeof createLocalDatabase>;
let common: string, personal: string;
async function space(name: string) {
  const result = await createSpace({ expectedActorId: state.identity?.id || "signed-out", name, creationKey: randomUUID() });
  if (!result.ok) throw Error(result.error);
  return result.data.id;
}
async function invite(email: string, spaceId = common) {
  const result = await invitations.inviteToSpace(spaceId, email, state.identity?.id || "signed-out");
  if (!result.ok) throw Error(result.error);
  return result.data;
}
async function row(id: string) {
  return (
    await native.query("SELECT * FROM space_invitations WHERE id=$1", [id])
  ).rows[0];
}
async function waitUntil(check: () => boolean) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if (check()) return;
    await delay(10);
  }
  throw Error("Expected asynchronous fixture boundary was not reached.");
}

describe("space invitations — real PostgreSQL, Auth/transport edges simulated", () => {
  beforeAll(async () => {
    process.env.INVITATION_TOKEN_SECRET =
      "fixture-secret-only-0123456789abcdef0123456789abcdef";
    process.env.MES_FINANCES_DB_DRIVER = "local-fixture";
    process.env.APP_ORIGIN = "http://localhost:3002";
    const admin = await localConnection();
    try {
      await admin.query(
        `CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`,
      );
    } finally {
      await admin.end();
    }
    native = await localConnection(database);
    const before = await legacyFingerprint(native);
    await runMigrations(native, {
      through: "006",
      dryRun: false,
      allowCutover: true,
    });
    expect(await legacyFingerprint(native)).toEqual(before);
    const identifier = (
      await native.query(
        "SELECT system_identifier::text FROM pg_control_system()",
      )
    ).rows[0].system_identifier;
    adapter = createLocalDatabase(
      `postgresql://budget_test:local-fixture-only@127.0.0.1:55437/${database}`,
      identifier,
    );
    state.sql = adapter.sql;
    state.identity = a;
    common = await space("Notre couple");
    personal = await space("Personnel Alice");
  });
  test("rejects a stale actor before invitation persistence or delivery, even for a shared member", async () => {
    state.identity = b;
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [common,b.id]);
    const before = (await native.query("SELECT count(*) FROM space_invitations")).rows[0].count;
    const messages = state.messages.length;
    const result = await invitations.inviteToSpace(common, "stale-actor@example.test", a.id);
    expect(result).toMatchObject({ ok: false });
    expect((await native.query("SELECT count(*) FROM space_invitations")).rows[0].count).toBe(before);
    expect(state.messages.length).toBe(messages);
    await native.query("DELETE FROM space_memberships WHERE space_id=$1 AND user_id=$2", [common,b.id]);
  });

  beforeEach(() => {
    state.identity = a;
    state.fail = false;
    state.handler = null;
    state.verificationRequests = [];
    state.verificationError = false;
  });
  afterAll(async () => {
    if (adapter) await adapter.close();
    if (native) await native.end();
    const admin = await localConnection();
    try {
      await admin.query(`DROP DATABASE "${database}"`);
    } finally {
      await admin.end();
    }
  });
  test("normalizes only case/space, persists one pending invitation and stores no bearer token", async () => {
    const count = state.messages.length;
    const invitation = await invite("  BOB@EXAMPLE.TEST  ");
    expect(invitation).toMatchObject({
      recipientEmail: b.email,
      deliveryStatus: "sent",
      status: "pending",
      spaceId: common,
    });
    expect(state.messages).toHaveLength(count + 1);
    const mail = state.messages.at(-1)!;
    const stored = await row(invitation.id);
    expect(mail.to).toBe(b.email);
    expect(mail.token).toHaveLength(80);
    expect(JSON.stringify(stored)).not.toContain(mail.token);
    expect(stored.token_hash).toHaveLength(64);
    state.identity = b;
    await expect(requireSpace(common)).rejects.toThrow();
    expect(await getSpaces()).toEqual([]);
    expect(
      (await invitations.getReceivedInvitations()).invitations.map((x) => x.id),
    ).toContain(invitation.id);
  });
  test("bearer landing reveals no recipient address/finances and refuses tampering", async () => {
    const mail = state.messages.find((x) => x.to === b.email)!;
    state.identity = null;
    const landing = await invitations.getPublicInvitation(mail.token);
    expect(landing).toMatchObject({
      spaceName: "Notre couple",
      inviterName: "Alice",
      authenticated: false,
      recipientMatches: false,
    });
    expect(JSON.stringify(landing)).not.toContain(b.email);
    expect(
      await invitations.getPublicInvitation(mail.token.slice(0, -1) + "!"),
    ).toBeNull();
    expect(
      await invitations.getPublicInvitation(
        randomUUID() + "." + "x".repeat(43),
      ),
    ).toBeNull();
  });
  test("neither wrong account nor unverified recipient gets membership; contact settings are irrelevant", async () => {
    const id = state.messages.find((x) => x.to === b.email)!.id;
    state.identity = c;
    expect((await invitations.respondToInvitation(id, "accept")).ok).toBe(
      false,
    );
    state.identity = { ...b, emailVerified: false };
    expect((await invitations.respondToInvitation(id, "accept")).ok).toBe(
      false,
    );
    expect(await invitations.getReceivedInvitations()).toEqual({
      verified: false,
      invitations: [],
    });
    expect(
      (
        await native.query(
          "SELECT count(*) FROM space_memberships WHERE space_id=$1 AND user_id=ANY($2::text[])",
          [common, [b.id, c.id]],
        )
      ).rows[0].count,
    ).toBe("0");
  });
  test("concurrent acceptance is atomic, creates one membership and no personal space; all rights are equal", async () => {
    const id = state.messages.find((x) => x.to === b.email)!.id;
    state.identity = b;
    state.sessionRequests = [];
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        invitations.respondToInvitation(id, "accept"),
      ),
    );
    expect(state.sessionRequests).toEqual(
      Array.from({ length: 3 }, () => ({
        query: { disableCookieCache: "true" },
      })),
    );
    expect(results.every((x) => x.ok)).toBe(true);
    expect(
      (
        await native.query(
          "SELECT count(*) FROM space_memberships WHERE space_id=$1 AND user_id=$2",
          [common, b.id],
        )
      ).rows[0].count,
    ).toBe("1");
    expect((await getSpaces()).map((x) => x.id)).toEqual([common]);
    expect((await getLastSpace())?.id).toBe(common);
    await createCard(common, { name: "Ajout de Bob" });
    state.identity = a;
    expect(
      (await getCards(common)).some((x) => x.name === "Ajout de Bob"),
    ).toBe(true);
    expect(await getCards(personal)).toEqual([]);
    state.identity = b;
    expect((await invite(c.email)).deliveryStatus).toBe("sent");
  });
  test("duplicate requests, including different members, reuse the invitation and do not resend a confirmed email", async () => {
    const before = state.messages.length;
    const first = await invite("dedup@example.test");
    state.identity = b;
    const second = await invite("DEDUP@example.test");
    expect(second.id).toBe(first.id);
    expect(state.messages.length).toBe(before + 1);
    const results = await Promise.all([
      invite("parallel@example.test"),
      invite("parallel@example.test"),
    ]);
    expect(results[0].id).toBe(results[1].id);
    expect(
      state.messages.filter((x) => x.to === "parallel@example.test"),
    ).toHaveLength(1);
  });
  test("delivery failure survives and retry keeps the same invitation/token and requires the cooldown", async () => {
    state.fail = true;
    const first = await invite("retry@example.test");
    expect(first.deliveryStatus).toBe("failed");
    expect(first.lastError).toBeTruthy();
    state.fail = false;
    const count = state.messages.length;
    expect(
      (await invitations.retryInvitationDelivery(common, first.id)).ok,
    ).toBe(false);
    expect(state.messages.length).toBe(count);
    await native.query(
      "UPDATE space_invitations SET last_attempt_at=now()-interval '2 minutes' WHERE id=$1",
      [first.id],
    );
    expect(
      await invitations.retryInvitationDelivery(common, first.id),
    ).toMatchObject({ ok: true });
    expect((await row(first.id)).delivery_status).toBe("sent");
    const mails = state.messages.filter((x) => x.id === first.id);
    expect(mails).toHaveLength(2);
    expect(mails[0].token).toBe(mails[1].token);
    expect(mails[0].origin).toBe(mails[1].origin);
  });
  test("expired invitation grants no access and a new request can replace only the expired pending row", async () => {
    const old = await invite("expired@example.test");
    const mail = state.messages.find((x) => x.id === old.id)!;
    await native.query(
      "UPDATE space_invitations SET expires_at=now()-interval '1 minute' WHERE id=$1",
      [old.id],
    );
    state.identity = { ...c, email: "expired@example.test" };
    expect((await invitations.respondToInvitation(old.id, "accept")).ok).toBe(
      false,
    );
    expect((await invitations.getPublicInvitation(mail.token))?.status).toBe(
      "expired",
    );
    state.identity = a;
    const replacement = await invite("expired@example.test");
    expect(replacement.id).not.toBe(old.id);
    expect((await row(old.id)).status).toBe("expired");
  });
  test("decline is terminal, idempotent and never creates access; reinvitation uses a new pending ID", async () => {
    const invited = await invite("decline@example.test");
    state.identity = { ...c, email: "decline@example.test" };
    expect(
      (await invitations.respondToInvitation(invited.id, "decline")).ok,
    ).toBe(true);
    expect(
      (await invitations.respondToInvitation(invited.id, "decline")).ok,
    ).toBe(true);
    expect(
      (await invitations.respondToInvitation(invited.id, "accept")).ok,
    ).toBe(false);
    await expect(requireSpace(common)).rejects.toThrow();
    state.identity = a;
    expect((await invite("decline@example.test")).id).not.toBe(invited.id);
  });
  test("failure while adding membership rolls back response and profile together", async () => {
    const invited = await invite("rollback@example.test");
    state.identity = {
      ...c,
      id: "fixture-membership-failure",
      email: "rollback@example.test",
    };
    await native.query(
      "CREATE FUNCTION fixture_fail_join() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id='fixture-membership-failure' THEN RAISE EXCEPTION 'fixture rollback'; END IF; RETURN NEW; END $$",
    );
    await native.query(
      "CREATE TRIGGER fixture_fail_join BEFORE INSERT ON space_memberships FOR EACH ROW EXECUTE FUNCTION fixture_fail_join()",
    );
    try {
      await expect(
        invitations.respondToInvitation(invited.id, "accept"),
      ).rejects.toThrow();
      expect((await row(invited.id)).status).toBe("pending");
      expect(
        (
          await native.query(
            "SELECT count(*) FROM user_display_profiles WHERE user_id='fixture-membership-failure'",
          )
        ).rows[0].count,
      ).toBe("0");
    } finally {
      await native.query("DROP TRIGGER fixture_fail_join ON space_memberships");
      await native.query("DROP FUNCTION fixture_fail_join()");
    }
  });
  test("every management entry refuses a third party and crossed invitation ID", async () => {
    const id = state.messages.find((x) => x.to === "retry@example.test")!.id;
    state.identity = c;
    for (const call of [
      () => invitations.inviteToSpace(common, "other@example.test", state.identity?.id || "signed-out"),
      () => invitations.getSentInvitations(common),
      () => invitations.retryInvitationDelivery(common, id),
    ])
      await expect(call()).rejects.toThrow();
    state.identity = a;
    expect((await invitations.retryInvitationDelivery(personal, id)).ok).toBe(
      false,
    );
    state.identity = null;
    await expect(invitations.getReceivedInvitations()).rejects.toThrow();
    await expect(
      invitations.respondToInvitation(id, "accept"),
    ).rejects.toThrow();
  });
  test("an expired delivery lease cannot let an old failed result overwrite a newer successful send", async () => {
    let rejectOld!: () => void;
    let started = false;
    state.handler = async () => {
      if (!started) {
        started = true;
        await new Promise<void>((resolve) => {
          rejectOld = resolve;
        });
        throw Error("late fixture timeout");
      }
      return "fixture-new-attempt";
    };
    const pending = invite("lease@example.test");
    try {
      await waitUntil(() => started);
      const current = (
        await native.query(
          "SELECT id FROM space_invitations WHERE recipient_email='lease@example.test'",
        )
      ).rows[0];
      await native.query(
        "UPDATE space_invitations SET last_attempt_at=now()-interval '2 minutes',lease_until=now()-interval '1 second' WHERE id=$1",
        [current.id],
      );
      expect(
        (await invitations.retryInvitationDelivery(common, current.id)).ok,
      ).toBe(true);
      rejectOld();
      expect((await pending).deliveryStatus).toBe("sent");
      expect((await row(current.id)).last_error).toBeNull();
    } finally {
      rejectOld?.();
      await pending.catch(() => undefined);
      state.handler = null;
    }
  });
  test("freezes sender/template/names across retries and refuses a rotated signing secret", async () => {
    state.fail = true;
    process.env.EMAIL_FROM = "First <first@example.test>";
    const first = await invite("snapshot@example.test");
    process.env.EMAIL_FROM = "Changed <changed@example.test>";
    await native.query(
      "UPDATE space_invitations SET last_attempt_at=now()-interval '2 minutes' WHERE id=$1",
      [first.id],
    );
    state.fail = false;
    expect(
      (await invitations.retryInvitationDelivery(common, first.id)).ok,
    ).toBe(true);
    const messages = state.messages.filter((x) => x.id === first.id);
    expect(messages[0]).toEqual(messages[1]);
    expect(messages[1].from).toBe("First <first@example.test>");
    expect(messages[1].templateVersion).toBe(1);
    state.fail = true;
    const rotated = await invite("rotation@example.test");
    await native.query(
      "UPDATE space_invitations SET last_attempt_at=now()-interval '2 minutes' WHERE id=$1",
      [rotated.id],
    );
    const secret = process.env.INVITATION_TOKEN_SECRET;
    const before = state.messages.length;
    try {
      process.env.INVITATION_TOKEN_SECRET =
        "different-fixture-secret-0123456789abcdef0123456789";
      expect(
        (await invitations.retryInvitationDelivery(common, rotated.id)).ok,
      ).toBe(false);
      expect(state.messages).toHaveLength(before);
    } finally {
      process.env.INVITATION_TOKEN_SECRET = secret;
      delete process.env.EMAIL_FROM;
    }
  });
  test("never resends an ambiguous result after the provider deduplication window; original link still works", async () => {
    state.fail = true;
    const invited = await invite("uncertain@example.test");
    const mail = state.messages.at(-1)!;
    await native.query(
      "UPDATE space_invitations SET first_attempt_at=now()-interval '25 hours',last_attempt_at=now()-interval '25 hours' WHERE id=$1",
      [invited.id],
    );
    state.fail = false;
    const before = state.messages.length;
    expect(
      (await invitations.retryInvitationDelivery(common, invited.id)).ok,
    ).toBe(false);
    expect((await row(invited.id)).delivery_status).toBe("uncertain");
    expect((await invite("uncertain@example.test")).id).toBe(invited.id);
    expect(state.messages.length).toBe(before);
    state.identity = { ...c, email: "uncertain@example.test" };
    expect((await invitations.getPublicInvitation(mail.token))?.status).toBe(
      "pending",
    );
    expect(
      (await invitations.respondToInvitation(invited.id, "accept")).ok,
    ).toBe(true);
  });
  test("response confirmation is persistent and restricted to the verified responder", async () => {
    const id = state.messages.find(
      (x) => x.to === "uncertain@example.test",
    )!.id;
    state.identity = { ...c, email: "uncertain@example.test" };
    expect(await invitations.getInvitationResponse(id)).toMatchObject({
      spaceId: common,
      accepted: true,
    });
    state.identity = a;
    expect(await invitations.getInvitationResponse(id)).toBeNull();
    state.identity = {
      ...c,
      email: "uncertain@example.test",
      emailVerified: false,
    };
    expect(await invitations.getInvitationResponse(id)).toBeNull();
  });
  test("verifies only the invited email and still requires a separate acceptance — real SQL, simulated Auth OTP", async () => {
    state.identity = { ...a, id: "fixture-verification-owner" };
    const target = await space("Verification fixture");
    const recipient = { ...b, id: "fixture-verification-recipient", email: "verification@example.test", emailVerified: false };
    const invited = await invite(recipient.email, target);
    const token = state.messages.at(-1)!.token;
    state.identity = recipient;
    const before = (await native.query("SELECT count(*) FROM financial_spaces")).rows[0].count;
    const input = { token, expectedActorId: recipient.id };
    expect(await invitations.getPublicInvitation(token)).toMatchObject({ actorId: recipient.id, recipientMatches: true, verified: false });
    expect(await requestInvitationVerification(input)).toEqual({ ok: true, status: "sent" });
    expect(state.verificationRequests).toEqual([{ send: { email: recipient.email, type: "email-verification" } }]);
    expect((await row(invited.id)).status).toBe("pending");
    state.verificationError = true;
    expect(await verifyInvitationEmail({ ...input, code: "123456" })).toMatchObject({ ok: false });
    state.verificationError = false;
    expect(await verifyInvitationEmail({ ...input, code: "123456" })).toEqual({ ok: true, status: "verified" });
    expect((await native.query("SELECT 1 FROM space_memberships WHERE space_id=$1 AND user_id=$2", [target, recipient.id])).rowCount).toBe(0);
    expect((await row(invited.id)).status).toBe("pending");
    expect((await native.query("SELECT count(*) FROM financial_spaces")).rows[0].count).toBe(before);
    expect(await invitations.respondToInvitation(invited.id, "accept")).toMatchObject({ ok: true });
    expect((await native.query("SELECT 1 FROM space_memberships WHERE space_id=$1 AND user_id=$2", [target, recipient.id])).rowCount).toBe(1);
    const calls = state.verificationRequests.length;
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    expect(state.verificationRequests).toHaveLength(calls);
  });
  test("OTP requests cannot use a foreign, expired, answered or forged invitation or a stale actor", async () => {
    state.identity = { ...a, id: "fixture-verification-guard-owner" };
    const target = await space("Verification guard fixture");
    const recipient = { ...b, id: "fixture-verification-guard-recipient", email: "verification-guard@example.test", emailVerified: false };
    const invited = await invite(recipient.email, target);
    const token = state.messages.at(-1)!.token;
    const input = { token, expectedActorId: recipient.id };
    state.identity = { ...c, emailVerified: false };
    expect(await requestInvitationVerification({ ...input, expectedActorId: c.id })).toMatchObject({ ok: false });
    state.identity = recipient;
    expect(await requestInvitationVerification({ ...input, expectedActorId: a.id })).toMatchObject({ ok: false });
    expect(await requestInvitationVerification({ ...input, token: randomUUID() + "." + "a".repeat(43) })).toMatchObject({ ok: false });
    await native.query("UPDATE space_invitations SET expires_at=now()-interval '1 second' WHERE id=$1", [invited.id]);
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    expect(await verifyInvitationEmail({ ...input, code: "123456" })).toMatchObject({ ok: false });
    await native.query("UPDATE space_invitations SET expires_at=now()+interval '1 day' WHERE id=$1", [invited.id]);
    state.identity = { ...recipient, emailVerified: true };
    expect(await invitations.respondToInvitation(invited.id, "decline")).toMatchObject({ ok: true });
    state.identity = recipient;
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    state.identity = null;
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    expect(state.verificationRequests).toEqual([]);
  });
});
