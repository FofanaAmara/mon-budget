# Feature Report: audit-remediation

Date: 2026-03-05
Stories: 15
Validation attempts: 1 (Playwright visual smoke test)

## Story Summary

| Story | Title | Level | Scope | Key Changes |
|-------|-------|-------|-------|-------------|
| AUDIT-001 | Install Vitest + configure test infrastructure | 1 | frontend | vitest.config.ts, 46 tests |
| AUDIT-010 | Document current DB schema | 1 | docs | data-model.md |
| AUDIT-014 | Fix documentation gaps | 1 | docs | architecture.md, runbook.md |
| AUDIT-004 | Add Zod validation schemas to all server actions | 2 | backend, frontend | lib/schemas.ts, 69 schema tests, 20+ actions validated |
| AUDIT-007 | Add DB transactions for financial operations | 1 | backend | sql.transaction() in 6 actions |
| AUDIT-008 | Add FK indexes and composite indexes | 1 | data | 6 indexes via migration |
| AUDIT-009 | Add middleware + security headers | 2 | backend, frontend | proxy.ts, security headers |
| AUDIT-002 | Write unit tests for financial calculations | 1 | frontend | 33 tests for calcDueDateForMonth, utils |
| AUDIT-003 | Extract calcDueDateForMonth + write tests | 1 | frontend | lib/month-utils.ts, 22 tests |
| AUDIT-005 | Batch INSERTs in generation functions | 1 | backend | Promise.all in 6 files |
| AUDIT-015 | Misc quick fixes (timing-safe, VAPID checks) | 1 | backend | crypto.timingSafeEqual, runtime env checks |
| AUDIT-006 | Fix critical accessibility | 1 | frontend | 59 htmlFor/id pairs, ARIA dialogs, Escape handlers, auto-focus in 18 files |
| AUDIT-012 | Extract duplicated code | 1 | backend, frontend | 3 files created (expense-display-utils, icons, revalidation), 13+ modified |
| AUDIT-013 | Split God Files | 1 | backend, frontend | savings.ts created, monthly-expenses.ts reorganized, object params |
| AUDIT-011 | Decompose God Components | 1 | frontend | 16 sub-components created, 3 God components reduced from 1275/1196/876 to 200/153/204 lines |

## Aggregate Metrics

| Metric | Total |
|--------|-------|
| Files created | ~30 |
| Files modified | ~60 |
| Tests written | 148 (from 0) |
| Code review findings fixed | ~15 (across all stories) |
| Discoveries | 2 (near-duplicate CSS animations, 7 action files not migrated to revalidation helpers) |

## Playwright Visual Smoke Test

| Page | Result | Screenshot |
|------|--------|------------|
| /accueil (dashboard) | PASS | .tmp/smoke-accueil.png |
| /depenses | PASS | .tmp/smoke-depenses.png |
| /revenus | PASS | .tmp/smoke-revenus.png |
| /projets | PASS | .tmp/smoke-projets.png |

**Zero visual regressions detected.** All pages render correctly with proper French accents (Épargne, déficit), correct data, and functional interactive elements.

## Key Patterns Established

1. **Test infrastructure**: Vitest configured, 148 tests covering schemas, utilities, date calculations
2. **Validation layer**: Zod schemas on all server actions (input validation at system boundary)
3. **Security**: timing-safe token comparison, security headers via proxy.ts, VAPID env runtime checks
4. **Performance**: Promise.all batch pattern for DB inserts, FK indexes
5. **Accessibility**: ARIA dialogs, htmlFor/id pairs, Escape handlers, auto-focus
6. **DRY**: Shared icons, display utils, revalidation helpers, centralized constants
7. **Clean Architecture**: God files split by responsibility, God components decomposed to <300 lines

## Recurring Issue: Accent Regression

The most common review finding across the feature was **dropped French accents** when extracting/moving code:
- AUDIT-013: "Épargne libre" → "Epargne libre" in savings.ts
- AUDIT-011: "Épargne", "En déficit" → "Epargne", "En deficit" in 4 sub-components

**Root cause**: `replace_all` operations that match both code identifiers (no accents) and user-visible text (with accents). **Mitigation**: Always handle UI strings and code identifiers separately when doing bulk text operations.
