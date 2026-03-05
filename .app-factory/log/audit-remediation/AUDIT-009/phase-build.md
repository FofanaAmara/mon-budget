# AUDIT-009 — Build : middleware + security headers

**Story :** AUDIT-009
**Agent :** Builder/Build
**Date :** 2026-03-05
**Niveau :** 2

---

## Deviation from design

The design assumed no middleware existed and prescribed creating a new `middleware.ts`. During build, I discovered that a `proxy.ts` file already exists at the project root. In Next.js 16, `proxy.ts` replaces `middleware.ts` — they cannot coexist (build error: "Both middleware file and proxy file detected").

**Decision:** Modify the existing `proxy.ts` instead of creating `middleware.ts`. The proxy already:
- Delegates auth to `auth.middleware()` from Neon Auth
- Skips server action POST requests
- Excludes static assets and auth routes via `config.matcher`
- Redirects unauthenticated users to `/landing` (the app's login page)

The only missing piece was bypassing `/api/cron` routes — added to the matcher regex.

**Note on login URL:** The story AC references `/auth/sign-in` but no such page exists. The app's login page is `/landing`. The proxy correctly uses `/landing` as `loginUrl`. This is a story imprecision, not a code issue.

---

## Changes

### 1. `proxy.ts` (MODIFIED)

Added `api/cron` to the matcher exclusion regex so cron endpoints (authenticated by Bearer token, not session) bypass the auth proxy.

### 2. `next.config.ts` (MODIFIED)

Added global security headers via `async headers()` with source `/(.*)'`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=63072000; includeSubDomains (no `preload` per review L2)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
- Content-Security-Policy-Report-Only (no `unsafe-eval` per review H1)

Existing headers for `/sw.js` and `/manifest.json` preserved.

### 3. `lib/actions/claim.ts` (MODIFIED)

Added `await requireAuth()` at the start of `hasOrphanedData()` — defense in depth.

---

## Review action items applied

| Item | Status |
|------|--------|
| H1: No `unsafe-eval` in CSP | Applied — not included |
| M1: Test root path `/` | Tested — redirects to `/landing` (307) |
| L2: No `preload` in HSTS | Applied — `max-age=63072000; includeSubDomains` only |

---

## Verification

| Check | Result |
|-------|--------|
| Build (`npm run build`) | PASS — 0 errors |
| Tests (`npx vitest run`) | PASS — 74/74 |
| Unauthenticated `/depenses` | 307 redirect to `/landing` |
| Unauthenticated `/` | 307 redirect to `/landing` |
| Public `/landing` | 200 OK |
| `/api/cron/push` (no session) | 401 (handler auth, not proxy — bypass works) |
| Security headers on response | All 6 headers present |
| CSP has no `unsafe-eval` | Confirmed |
| HSTS has no `preload` | Confirmed |

---

## Exit Checklist

1. [x] Build passes
2. [x] Migrations applied — N/A (no schema change)
3. [x] Dev server runs without runtime errors
4. [x] Each AC tested (curl verification for redirect, public access, headers)
5. [x] Visual scan — N/A (backend/infra story, no UI changes)
6. [x] Defects fixed — none found
