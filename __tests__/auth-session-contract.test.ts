import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createHmac } from "node:crypto";
import {
  NEON_AUTH_SESSION_COOKIE_NAME,
  NEON_AUTH_SESSION_DATA_COOKIE_NAME,
} from "@neondatabase/auth/server";
const state = vi.hoisted(() => {
  const original = {
    url: process.env.NEON_AUTH_BASE_URL,
    secret: process.env.NEON_AUTH_COOKIE_SECRET,
  };
  process.env.NEON_AUTH_BASE_URL = "https://auth.example.test/neondb/auth";
  process.env.NEON_AUTH_COOKIE_SECRET =
    "fixture-session-contract-only-0123456789abcdef";
  return {
    original,
    cookie: "",
    forbidWrites: true,
    cookieReads: 0,
    written: [] as Array<{
      name: string;
      options: { sameSite?: string; secure?: boolean };
    }>,
  };
});
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ cookie: state.cookie, origin: "https://app.example.test" }),
  cookies: async () => {
    state.cookieReads++;
    return {
      set: (
        name: string,
        _value: string,
        options: { sameSite?: string; secure?: boolean },
      ) => {
        if (state.forbidWrites)
          throw Error(
            "Cookies can only be modified in a Server Action or Route Handler.",
          );
        state.written.push({ name, options });
      },
    };
  },
}));
vi.mock("@/lib/db", () => ({
  sql: () => {
    throw Error("No database calls in auth contract test");
  },
}));
import { requireIdentity } from "@/lib/spaces/context";
import { auth } from "@/lib/auth/server";
import { hasSeenOnboarding } from "@/lib/actions/onboarding-carousel";
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const date = new Date().toISOString();
const cached = {
  user: {
    id: "fixture-user",
    name: "Fixture",
    email: "fixture@example.test",
    emailVerified: true,
    createdAt: date,
    updatedAt: date,
  },
  session: {
    id: "fixture-session",
    userId: "fixture-user",
    token: "fixture-token",
    createdAt: date,
    updatedAt: date,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
};
function signedCache() {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      ...cached,
      exp: Math.floor(Date.now() / 1000) + 300,
      iat: Math.floor(Date.now() / 1000),
      sub: cached.user.id,
    }),
  ).toString("base64url");
  return `${header}.${payload}.${createHmac("sha256", "fixture-session-contract-only-0123456789abcdef").update(`${header}.${payload}`).digest("base64url")}`;
}
const cookieHeader = () =>
  `${NEON_AUTH_SESSION_COOKIE_NAME}=fixture-token; Path=/; HttpOnly; SameSite=None; Partitioned; Secure`;
beforeEach(() => {
  state.cookie = `${NEON_AUTH_SESSION_COOKIE_NAME}=fixture-token; ${NEON_AUTH_SESSION_DATA_COOKIE_NAME}=${signedCache()}`;
  state.cookieReads = 0;
  state.forbidWrites = true;
  state.written = [];
});
afterEach(() => vi.unstubAllGlobals());
afterAll(() => {
  for (const [key, value] of Object.entries({
    NEON_AUTH_BASE_URL: state.original.url,
    NEON_AUTH_COOKIE_SECRET: state.original.secret,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
describe("production Neon adapter session/cookie contract", () => {
  it("uses the dedicated email-verification OTP endpoints through the installed server SDK", async () => {
    const calls: Array<{ path: string; method: string; body: unknown }> = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
      const path = new URL(url).pathname;
      calls.push({ path, method: options?.method || "GET", body: JSON.parse(String(options?.body)) });
      return Response.json(path.endsWith("send-verification-otp") ? { success: true } : { status: true, token: null, user: cached.user });
    }));
    expect((await auth.emailOtp.sendVerificationOtp({ email: "fixture@example.test", type: "email-verification" })).data?.success).toBe(true);
    expect((await auth.emailOtp.verifyEmail({ email: "fixture@example.test", otp: "123456" })).data?.status).toBe(true);
    expect(calls).toEqual([
      { path: "/neondb/auth/email-otp/send-verification-otp", method: "POST", body: { email: "fixture@example.test", type: "email-verification" } },
      { path: "/neondb/auth/email-otp/verify-email", method: "POST", body: { email: "fixture@example.test", otp: "123456" } },
    ]);
    expect(state.written).toEqual([]);
  });
  it("the home-page onboarding read accepts a cleared session without mutating RSC cookies", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(null, {
      headers: { "Set-Cookie": `${NEON_AUTH_SESSION_COOKIE_NAME}=; Max-Age=0; Secure` },
    })));
    await expect(hasSeenOnboarding()).resolves.toBe(false);
    expect(state.cookieReads).toBe(0);
    expect(state.written).toEqual([]);
  });
  it("fresh mutation identity ignores a valid signed but stale verification bit", async () => {
    const requests: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        requests.push(url);
        return Response.json({
          ...cached,
          user: { ...cached.user, emailVerified: false },
        });
      }),
    );
    expect((await auth.getSession()).data?.user.emailVerified).toBe(true);
    expect(requests).toHaveLength(0);
    expect((await requireIdentity({ fresh: true })).emailVerified).toBe(false);
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0]).searchParams.get("disableCookieCache")).toBe(
      "true",
    );
  });
  it("RSC identity stays authoritative even when upstream sends Set-Cookie and Next forbids writes", async () => {
    const requests: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        requests.push(url);
        return Response.json(
          { ...cached, user: { ...cached.user, emailVerified: false } },
          { headers: { "Set-Cookie": cookieHeader() } },
        );
      }),
    );
    expect((await requireIdentity()).emailVerified).toBe(
      false,
    );
    expect(state.cookieReads).toBe(0);
    expect(state.written).toEqual([]);
    expect(requests).toHaveLength(1);
    const query = new URL(requests[0]).searchParams;
    expect(query.get("disableCookieCache")).toBe("true");
    expect(query.get("disableRefresh")).toBe("true");
    expect(new URL(requests[0]).pathname).toBe("/neondb/auth/get-session");
  });
  it("RSC identity rejects a revoked session even if a signed cache remains and upstream clears cookies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(null, {
          headers: {
            "Set-Cookie": `${NEON_AUTH_SESSION_COOKIE_NAME}=; Max-Age=0; SameSite=None; Secure`,
          },
        }),
      ),
    );
    await expect(requireIdentity({ readOnly: true })).rejects.toThrow(
      "Connecte-toi",
    );
    expect(state.cookieReads).toBe(0);
    expect(state.written).toEqual([]);
  });
  it("the mutation adapter applies Lax and Secure without the former response rewrite", async () => {
    state.forbidWrites = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(cached, { headers: { "Set-Cookie": cookieHeader() } }),
      ),
    );
    await requireIdentity({ fresh: true });
    expect(
      state.written.some((x) => x.name === NEON_AUTH_SESSION_COOKIE_NAME),
    ).toBe(true);
    expect(
      state.written.every(
        (x) => x.options.sameSite === "lax" && x.options.secure === true,
      ),
    ).toBe(true);
  });
  it("RSC reads fail closed on upstream errors, invalid JSON and malformed sessions", async () => {
    for (const response of [
      new Response("private failure", { status: 503 }),
      new Response("invalid-json"),
      Response.json({ user: { id: "fixture-user" } }),
    ]) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => response),
      );
      await expect(requireIdentity({ readOnly: true })).rejects.toThrow(
        "La session ne peut pas être vérifiée",
      );
    }
    expect(state.cookieReads).toBe(0);
  });
  it("RSC requests are uncached, bounded, refuse redirects and transmit only Neon cookies", async () => {
    state.cookie += "; unrelated=private-value";
    const request = vi.fn<typeof fetch>(async () => Response.json(cached));
    vi.stubGlobal("fetch", request);
    await requireIdentity({ readOnly: true });
    const options = request.mock.calls[0][1];
    expect(options).toMatchObject({
      method: "GET",
      cache: "no-store",
      redirect: "error",
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(options?.headers).get("cookie")).not.toContain(
      "unrelated",
    );
  });
});
