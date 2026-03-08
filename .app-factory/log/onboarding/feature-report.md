# Feature Report: onboarding (Refonte)

Date: 2026-03-06
Stories: 3
Validation attempts: 1

## Story Summary

| Story | Title | Level | Scope | Files Changed | Tests Delta |
|-------|-------|-------|-------|---------------|-------------|
| ONBOARD-001 | Carousel educatif avec visibilite DB-based | 2 | data, backend, frontend | 8 | +0 (schema test removed) |
| ONBOARD-002 | Suppression ancien onboarding wizard + localStorage | 2 | data, backend, frontend | 7 | -35 (obsolete tests removed) |
| ONBOARD-003 | Ajout etape categories au guide de configuration | 1 | frontend, backend | 6 | +0 |

## Aggregate Metrics

| Metric | Total |
|--------|-------|
| Files created | 3 (OnboardingCarouselWrapper, onboarding-carousel.ts, migrate script) |
| Files modified | 13 |
| Files deleted | 3 (Onboarding.tsx, onboarding.ts, onboarding.ts schema) |
| Net lines | -1113 (major cleanup) |
| Tests final | 177 passed |
| Code review findings | 1 MEDIUM (fixed), 1 LOW (accepted) |
| Discoveries | 1 (ensureDefaultSections by design) |

## What Was Built

1. **Carousel educatif** — 4-slide educational carousel explaining the app's value proposition. DB-based visibility (user_onboarding table). Renders before dashboard for new users.

2. **Legacy cleanup** — Removed 1113-line Onboarding.tsx wizard, all localStorage references, server actions, and Zod schemas. Zero dead code remaining.

3. **5-step guide** — Added "Creer tes categories de depenses" as step 2 in the setup guide. Auto-detection via sections table. Celebration triggers at 5/5. Retrocompatible with existing users.

## Cross-Story Flow
New user -> Carousel (educatif) -> Dashboard + 5-step Guide (configuration) -> Celebration at 5/5

## Commits
- `0525bdc` [ONBOARD-001] add OnboardingCarousel visual shell
- `17b6122` feat(onboarding): wire carousel to DB-based visibility
- `34ac0f4` [ONBOARD-001] fix review findings
- `e75b266` [ONBOARD-002] remove legacy onboarding code
- `0b7f2b4` [ONBOARD-003] add categories step to setup guide
- `ca4f311` [ONBOARD-003] remove temporary debug code
- `1df842c` [ONBOARD-003] fix duplicate comment (review finding)

## Discoveries to Triage
- ensureDefaultSections() auto-creates 6 default sections on home page load (by design, M-2)
