import { createNeonAuth } from "@neondatabase/auth/next/server";
import { BETTER_AUTH_VERSION } from "@neondatabase/auth";
import {
  extractNeonAuthCookies,
  NEON_AUTH_SERVER_PROXY_HEADER,
  parseSessionData,
  resolveNeonAuthLogging,
  type SessionData,
} from "@neondatabase/auth/server";
import { headers } from "next/headers";
import { cache } from "react";

const config = {
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    sameSite: "lax" as const,
  },
};

/** Actions and route handlers may persist refreshed cookies. */
export const auth = createNeonAuth(config);
export class AuthSessionUnavailableError extends Error {
  constructor(readonly status?: number) {
    super(
      "La session ne peut pas être vérifiée pour le moment. Réessaie dans un instant.",
    );
  }
}

/**
 * RSC-only authoritative read. The SDK's server method also mints a local cache
 * after Set-Cookie, which writes cookies and makes a second unbounded refresh
 * request. Use the same public endpoint without either mutation side effect.
 */
async function readSession(): Promise<{
  data: SessionData | null;
  error: null;
}> {
  const requestHeaders = await headers();
  const url = new URL(
    "get-session",
    config.baseUrl.endsWith("/") ? config.baseUrl : config.baseUrl + "/",
  );
  if (url.protocol !== "https:" || url.username || url.password)
    throw new AuthSessionUnavailableError();
  url.searchParams.set("disableCookieCache", "true");
  url.searchParams.set("disableRefresh", "true");
  const origin =
    requestHeaders.get("origin") ||
    requestHeaders.get("referer")?.split("/").slice(0, 3).join("/") ||
    "";
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Cookie: extractNeonAuthCookies(requestHeaders),
        Origin: origin,
        [NEON_AUTH_SERVER_PROXY_HEADER]: "nextjs",
        "X-Neon-Client-Info": JSON.stringify({
          betterAuthVersion: BETTER_AUTH_VERSION,
        }),
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new AuthSessionUnavailableError();
  }
  if (response.status === 401) return { data: null, error: null };
  if (!response.ok) {
    console.warn("[auth] Session verification failed", { status: response.status });
    throw new AuthSessionUnavailableError(response.status);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AuthSessionUnavailableError();
  }
  if (payload === null) return { data: null, error: null };
  const session = parseSessionData(
    payload,
    resolveNeonAuthLogging({ logLevel: "silent" }),
  );
  if (
    !session.user ||
    !session.session ||
    typeof session.user.id !== "string" ||
    !session.user.id ||
    session.session.userId !== session.user.id ||
    !Number.isFinite(session.session.expiresAt.getTime()) ||
    session.session.expiresAt.getTime() <= Date.now()
  )
    throw new AuthSessionUnavailableError();
  return { data: session, error: null };
}
// React scopes this memoization to one server render, including concurrent
// layout/page reads. No identity or failure is retained across requests.
// Explicit fresh mutation checks continue to use the mutable SDK above.
export const authSessionReader = { getSession: cache(readSession) };
