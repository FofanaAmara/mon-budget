# AUDIT-009 — Code Review : middleware + security headers

**Story :** AUDIT-009 — Add middleware.ts + security headers
**Reviewer :** af-reviewer/review
**Date :** 2026-03-05
**Commit reviewed :** e892923
**Niveau :** 2
**Scope :** backend, infra

---

## Verdict : APPROVED WITH NOTES

Zero CRITICAL. Zero HIGH. 2 MEDIUM. 2 LOW.

**Totaux :** 0 CRITICAL | 0 HIGH | 2 MEDIUM | 2 LOW

---

## Step 0 — Git Reality Check

| Check | Result |
|-------|--------|
| Files declared modified in build log | proxy.ts, next.config.ts, lib/actions/claim.ts |
| Files actually changed in git diff | proxy.ts, next.config.ts, lib/actions/claim.ts + 4 log files |
| Undeclared code changes? | NONE — log files are expected SDLC artifacts |
| Uncommitted changes? | NONE — clean working tree (only untracked log files from other stories) |
| Tasks marked done without file change? | No discrepancy |

**Verdict : CLEAN.** Git state matches build claims exactly.

### Design deviation check

The design prescribed creating `middleware.ts`. The Builder modified `proxy.ts` instead, with a documented rationale: Next.js 16 uses `proxy.ts` instead of `middleware.ts` and they cannot coexist. This is a **legitimate deviation** — the Builder adapted to the actual runtime environment rather than blindly following a design based on an incorrect assumption. The deviation is well-documented in `phase-build.md`.

---

## Acceptance Criteria Cross-Check

| AC | Description | Met? |
|----|-------------|------|
| AC1 | Unauthenticated user on `/depenses` -> redirect to login | YES — 307 to `/landing` (proxy delegates to `auth.middleware()`) |
| AC2 | Unauthenticated user on `/landing` -> normal access | YES — `/landing` excluded by matcher regex |
| AC3 | `/api/cron/push` accessible without session | YES — `api/cron` added to matcher exclusion; handler returns 401 for invalid Bearer token |
| AC4 | Security headers present on responses | YES — 6 headers configured in `next.config.ts` |
| AC5 | `hasOrphanedData()` calls `requireAuth()` | YES — line 9 of `lib/actions/claim.ts` |
| AC6 | No regression (build passes, auth users access pages) | YES — 74/74 tests, build clean |

**Note:** AC1 references `/auth/sign-in` but the app uses `/landing` as the login page. The proxy correctly redirects to `/landing`. This is a story AC imprecision, not a code defect.

---

## MEDIUM — 2 findings

### M1 — Quote style reformatting in claim.ts inflates the diff

**File:** `lib/actions/claim.ts` (entire file)
**Rule:** `af-conventions` § commit conventions — one commit = one atomic logical change
**Problem:** The commit changes ALL single quotes to double quotes throughout `claim.ts`. This reformats ~40 lines that have nothing to do with the story (adding `requireAuth()`). The actual functional change is 1 line (`await requireAuth()`), but the diff shows 92 insertions and 45 deletions.
**Impact:** Makes the diff harder to review, hides the real change in formatting noise, and makes `git blame` less useful on every reformatted line.
**Fix:** Formatting changes should be a separate commit (`chore(lint): apply consistent quote style`) or applied project-wide via a linter. The functional change should stand alone.

### M2 — CSP `connect-src` may need Vercel domains when enforced

**File:** `next.config.ts:16`
**Rule:** `af-security` § Content Security Policy completeness
**Problem:** `connect-src` is `'self' https://*.neon.tech`. When this CSP is promoted from report-only to enforced, any Vercel-specific connections (analytics, preview deployment URLs, Vercel toolbar in preview) will be blocked. The app is deployed on Vercel.
**Impact:** No runtime impact now (report-only mode). Will cause blocked connections when CSP is promoted to enforced without adjustment.
**Fix:** Before promoting CSP to enforced: (1) deploy with report-only, (2) monitor browser console for `connect-src` violations on Vercel, (3) add required domains. Log this as an action item for the CSP enforcement story.

---

## LOW — 2 findings

### L1 — Same quote reformatting in proxy.ts and next.config.ts

**File:** `proxy.ts`, `next.config.ts`
**Rule:** `af-conventions` § commit conventions — one commit = one atomic logical change
**Problem:** Same as M1 — single-to-double quote reformatting mixed with functional changes across all three modified files.
**Impact:** Same as M1 but lower severity since the functional changes in these files are more substantial relative to the formatting noise.
**Fix:** Same as M1.

### L2 — Missing `upgrade-insecure-requests` CSP directive

**File:** `next.config.ts:10-22`
**Rule:** `af-security` § Content Security Policy
**Problem:** The CSP omits `upgrade-insecure-requests`, which would automatically upgrade HTTP requests to HTTPS. Since HSTS is configured, this provides belt-and-suspenders protection.
**Impact:** Minimal — HSTS already handles this for repeat visitors. First-time visitors on HTTP would not be upgraded by CSP (though Vercel likely redirects HTTP anyway).
**Fix:** Consider adding `upgrade-insecure-requests` when promoting CSP from report-only to enforced. Low priority.

---

## Dismissed Concerns

### proxy.ts — Server action POST bypass

The proxy skips authentication for POST requests with a `next-action` header (line 7). This is correct: server actions have their own `requireAuth()` calls, and forcing middleware auth on them would break the flow (server actions don't redirect, they throw). This is a legitimate defense-in-depth trade-off, not a security gap — each server action individually enforces auth.

### CSP `unsafe-inline` for script-src and style-src

`unsafe-inline` is required for Next.js App Router hydration scripts and inline styles. Since the CSP is in report-only mode, this is acceptable. When promoting to enforced, nonce-based CSP should be evaluated (Next.js 14+ supports `nonce` via `generateNonce()`). Not a finding for this story.

### HSTS max-age of 2 years

63072000 seconds (2 years) is the standard recommended value. Combined with the removal of `preload` (per design review L2), this is appropriate for an alpha app.

### Reformatted claim.ts lines — no functional regression

The quote style change from single to double quotes across `claim.ts` is purely cosmetic. I verified every line: no logical change other than the addition of `await requireAuth()` on line 9. No regression risk from the reformatting.

---

## Code Quality Assessment

### Security Headers (next.config.ts)

**Good:**
- All 6 required headers present with correct values
- CSP deployed in report-only mode — prudent approach
- No `unsafe-eval` in CSP (review-design H1 applied)
- No `preload` in HSTS (review-design L2 applied)
- CSP directives well-structured as array joined with semicolons — readable and maintainable
- Existing `/sw.js` and `/manifest.json` headers preserved

**Correct values verified:**
- `X-Frame-Options: DENY` — standard
- `X-Content-Type-Options: nosniff` — standard
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` — standard sans preload
- `Referrer-Policy: strict-origin-when-cross-origin` — balanced between privacy and functionality
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` — disables unused APIs
- CSP report-only with appropriate directives

### Proxy (proxy.ts)

**Good:**
- Minimal change — only `api/cron` added to matcher regex
- Regex is correct: `api/cron` matches `/api/cron/push` and any future cron routes
- No functional logic change beyond the matcher

### Auth Fix (claim.ts)

**Good:**
- `requireAuth()` added correctly at line 9, before any DB query
- Return value not used (correct — the function checks for `user_id = 'unclaimed'`, not the current user's data)
- Defense in depth principle properly applied

### Overall

The implementation is clean, minimal, and correct. The design deviation (proxy.ts instead of middleware.ts) was the right call. Review-design action items (H1, L2) were properly applied. The only concern is the formatting noise mixed with functional changes (M1/L1), which is a process issue, not a security or correctness issue.

---

## Discoveries

None. No issues outside the story scope were identified during this review.
