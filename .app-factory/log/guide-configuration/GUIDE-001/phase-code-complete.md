# GUIDE-001 — Build Report

> Builder: af-builder
> Date: 2026-03-06
> Status: code_complete

---

## Summary

Wired the existing setup guide UI shell (6 components) to real database data. Created the `setup_guide` table, a server query with 4 EXISTS sub-queries to compute step completion, and a dismiss server action. Replaced all mocked data in `SetupGuide.tsx` with server-fetched props.

## Design Review Notes Addressed

| Note | Resolution |
|------|-----------|
| M1: Side-effect INSERT in read query | Named `getOrInitSetupGuideData()` to reflect the side-effect |
| M2: Don't create lib/queries/ directory | All code in `lib/actions/setup-guide.ts` |
| M3: Don't use completed_at in GUIDE-001 | Visibility logic uses only dismissed_at + guide row existence |
| M4: Use revalidatePath("/", "layout") | Applied in dismissSetupGuide() |

## Implementation Details

### Files Created

| File | Purpose |
|------|---------|
| `scripts/migrate-setup-guide.mjs` | CREATE TABLE setup_guide (safe migration) |
| `lib/actions/setup-guide.ts` | Server query + action: getOrInitSetupGuideData(), dismissSetupGuide() |

### Files Modified

| File | Change |
|------|--------|
| `app/layout.tsx` | Made async, calls getOrInitSetupGuideData(), passes guideData to LayoutShell |
| `components/LayoutShell.tsx` | Accepts guideData prop, forwards to SetupGuide |
| `components/setup-guide/SetupGuide.tsx` | Removed mocks, accepts props, uses router.push(), wires dismissSetupGuide() |

### Key Decisions

1. **Schema fix: `status = 'PAID'` not `is_paid = true`** — The design assumed `is_paid` column but the actual `monthly_expenses` table uses `status` with values 'PAID' and 'UPCOMING'. Fixed during implementation.

2. **Safe auth in root layout** — Used `auth.getSession()` with null return instead of `requireAuth()` (which throws). The root layout renders for all pages including unauthenticated ones.

3. **"use server" module for both query and action** — Per M2, kept everything in one file. The `getOrInitSetupGuideData()` function is exported from a "use server" module but called from a server component (layout.tsx), which is valid in Next.js.

## Exit Checklist

### 1. Build passes

```
next build — Compiled successfully in 4.8s
All routes dynamic (f), no build errors
```

### 2. Migrations applied

```
Creating setup_guide table...
Table setup_guide created
Migration complete
```

### 3. Dev server started

Yes — app runs on localhost:3000, responds with 200/307 as expected.

### 4. Each AC tested via Playwright

| AC | Result | Evidence |
|----|--------|----------|
| AC-1 (guide visible for new-ish users) | PASS | Guide bar shows "3/4 - Ajouter un revenu recurrent" when user has incomplete steps + guide row. Screenshot: `.tmp/screenshots/guide-001/20-incomplete-bar.png` |
| AC-2 (expansion) | PASS | Bottom sheet opens showing all 4 steps with correct states (current/completed). Screenshot: `.tmp/screenshots/guide-001/21-steps-expanded.png` |
| AC-3 (navigation) | PASS | Clicking step 1 navigates to `/revenus` via router.push(). Screenshot: `.tmp/screenshots/guide-001/23-step-nav-result.png` |
| AC-4 (persistence) | PASS | Data comes from DB (setup_guide table + 4 EXISTS queries), not localStorage. Verified: dismissed guide stays hidden after re-login in new browser context. |
| AC-5 (relation onboarding) | PASS | If user has existing incomes/expenses (from onboarding), steps reflect it. Test user with income -> step 1 shown as completed. |
| AC-6 (existing users don't see guide) | PASS | User with all 4 conditions met + no setup_guide row -> guide hidden. Verified with test user. Screenshot: `.tmp/screenshots/guide-001/05-ac1-guide-bar.png` (first test, before guide row insertion). |

### 5. Visual scan of full viewport

- Mobile bar positioned correctly above bottom nav (no overlap)
- Celebration view renders with confetti + CTA
- Step list shows correct states (current/completed styling)
- Desktop view clean (no guide visible in dismissed state)
- No text truncation, no layout shifts, no z-index issues

Defects found: none

### 6. Defects fixed

N/A — no visual defects found.

## Tests

180 unit tests pass (vitest). No regressions. No new unit tests needed for this story (the logic is in the SQL query and visibility computation, tested via Playwright E2E).
