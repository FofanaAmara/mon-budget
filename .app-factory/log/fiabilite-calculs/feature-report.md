# Feature Report: fiabilite-calculs

Date: 2026-03-05
Epic: stabilisation
Stories: 12 (3 BLQ + 9 MIN)
Validation attempts: 0 (no staging — direct to main)

## Story Summary

| ID | Title | Level | Scope | Files Changed | Commits |
|----|-------|-------|-------|---------------|---------|
| FIX-BLQ-003 | Dashboard balance formula | 1 | frontend | 1 | 1 |
| FIX-BLQ-005 | Savings rate formula | 1 | frontend | 1 | 1 |
| FIX-BLQ-004 | Health score coverage | 1 | frontend | 1 | 1 |
| FIX-MIN-004 | Biweekly multiplier constant | 1 | backend, frontend | 6 | 1 |
| FIX-MIN-006 | Onboarding frequency fix | 1 | backend | 1 | 1 |
| FIX-MIN-007 | Onboarding multiplier fix | 1 | frontend | 0 (fixed by MIN-004) | 0 |
| FIX-MIN-001 | Deferred expense_id link | 1 | backend | 1 | 1 |
| FIX-MIN-002 | Biweekly income approximation | 1 | backend | 0 (fixed by MIN-004) | 0 |
| FIX-MIN-003 | Income generation overwrites | 1 | data, backend | 2 | 2 |
| FIX-MIN-005 | Section delete cascade | 1 | backend, frontend | 2 | 1 |
| FIX-MIN-008 | Push notification cron | 1 | backend, infra | 3 | 2 |
| FIX-MIN-009 | Favicon PWA cache | 1 | frontend | 1 | 1 |

## Aggregate Metrics

| Metric | Total |
|--------|-------|
| Files created | 3 (cron route, vercel.json, migration) |
| Files modified | 10 |
| Tests written | 0 (project has no test suite) |
| Code review findings | ~12 total (0 CRITICAL, 2 HIGH fixed, several MEDIUM/LOW) |
| Discoveries | 2 (unused ty/tm vars, section expense count scope) |
| Commits | 12 |

## Key Decisions

1. **FIX-MIN-004 as root-cause fix**: Extracting `BIWEEKLY_MONTHLY_MULTIPLIER` into `lib/constants.ts` pre-fixed 3 downstream stories (MIN-007, MIN-002, and partially MIN-006). This saved significant effort.
2. **FIX-MIN-003 manually_edited flag**: Chose boolean flag over timestamp comparison for simplicity. Migration is safe (additive column with default).
3. **FIX-MIN-005 nullify approach**: AC specified move/delete options, but implemented safer nullify-with-warning. PM accepted the pragmatic simplification.
4. **FIX-MIN-008 separate cron endpoint**: Created `/api/cron/push` instead of reusing `/api/push/send` because cron can't authenticate as a user.

## Post-Deploy Requirements

1. Run migration: `node scripts/migrate-manually-edited.mjs` (FIX-MIN-003)
2. Set `CRON_SECRET` env var in Vercel dashboard (FIX-MIN-008)
3. Verify cron job appears in Vercel dashboard after deploy

## Discoveries to Triage

1. DISC-FIX-MIN-001-1: Unused `ty`, `tm` variables in `deferExpenseToMonth` (TECH_DEBT, P3)
2. Section expense count only queries templates, not monthly instances (minor inconsistency)
