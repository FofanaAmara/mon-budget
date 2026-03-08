# Phase Build — ONBOARD-001

Date: 2026-03-06

## Files Created
- `scripts/migrate-onboarding-carousel.mjs` — Migration: user_onboarding table + backfill existing users
- `lib/actions/onboarding-carousel.ts` — Server actions: hasSeenOnboarding() + markOnboardingSeen()
- `components/onboarding/OnboardingCarouselWrapper.tsx` — Client wrapper wiring callbacks to server action

## Files Modified
- `app/page.tsx` — Added onboarding gate: if !hasSeenOnboarding → render carousel instead of dashboard

## Key Decision
No `users` table exists (Neon Auth manages users externally). Created dedicated `user_onboarding` table following `setup_guide` pattern. Backfill detects existing users via UNION across incomes/expenses/sections/setup_guide tables.

## Build Result
- npm run build: PASS
- Migration: PASS (table created, existing users backfilled)
- Dev server: runs without errors

## Commit
- `feat(onboarding): wire carousel to DB-based visibility [ONBOARD-001]`
