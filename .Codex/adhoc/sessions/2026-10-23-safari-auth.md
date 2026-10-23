# Session - 2026-10-23 - Safari login and Auth failure during expense test

**Plan :** `.Codex/plans/safari-local-auth.md`, extended after the user's Chrome error screenshot.

## Outcomes
- Safari transport root cause reproduced: Chromium145 accepts Secure/__Secure cookies on HTTP localhost; WebKit26 rejects them while accepting a nonsecure control. Installed native Safari26.6.2 was identified, but native authenticated Safari was not automated.
- Owned recipe now starts Next HTTPS3443 with explicit project key/cert, APP_ORIGINhttpslocalhost3443 and HTTP3002 redirect preserving old URLs/invitation tokens. No source finance reset, Auth cookie downgrade, browser security change or system CA install. A first browser certificate approval remains necessary. Local HSTS omitted only in development+owned fixture; production HSTS preserved.
- User's Chrome screenshot independently showed Auth reader receiving non-2xx on expenses. Historical numeric status unavailable, no unproven claim of429. Reproduction with true Next RSC found10upstream reads for10calls; React.cache makes1perrender without sharing identities or failures between requests. Explicit fresh mutation checks unchanged.
- Safe numeric status diagnostics added; no provider payload/cookie/user logging. Parent spaces error boundary displays generic recovery without private data. Production browser test caught that reset alone did not refetch failed server output; button now reloads sameURL/query, actual recovery verified.

## Validation
- http-before.json and https-after.json: both engines preserve Secure cookies under HTTPS, old app link reaches real HTTPS login. Captured/visually scanned full desktop login screens.
- New actualNext production fixture:10calls->1upstream; separate users isolated; another request rechecks;503thennewrequestrecovers; actual client retry button recovers. Captured/scanned desktop1280x720 and mobile375x812 error state, no overflow/overlap. Synthetic HTTPS upstream, no hosted Auth or DB. Successful fixture removed before CI typegen; failed attempts retained privately.
-265unit/20files pass;99PostgreSQL services on synthetic disposable clones pass;9delivery tests pass. Final isolated buildWebpack/types/lint0warning/delivery session99062exit0. Source tests queued into existing CI workflow; no remote CI run or push.
- Actual recipe health: HTTPS login200 verified with the project certificate, no localHSTS header, oldHTTP307preservespath/query. Runtime32915 remains active. Certificate trust in user Safari and a full hosted login are not claimed by synthetic tests.

## Files
scripts/financial-spaces/local-https.mjs and dev.mjs/README; lib/auth/server.ts; app/espaces/error.tsx; next.config.ts; package.json; workflow; actualRSC browser regression; delivery certificate/redirect tests; HSTS unit tests; auth-status test; discoveries010/011; plan/state/tasks/memory and evidence reference. Private keys, screenshots, fixture apps and diagnostics only under ignored.local/safari-auth or financial-spaces/https. Preexistingserena/next-env/CS excluded.

## Limits and follow-up
Exact upstream incident status remains unknown, now recorded safely if repeated. No new retry loop or fake session. Real hosted Safari login must be retried by the user at https://localhost:3443 after approving the local certificate. Financial feature goal remains incomplete; actual two-member invitation, external Resend receipt, global PlaywrightMCP/review and remote CI are separate requirements. No unilateral push/deployment or financial source mutation.
