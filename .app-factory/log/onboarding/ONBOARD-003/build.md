# ONBOARD-003 — Build Report

> **Story:** Ajout de l'etape categories au guide de configuration
> **Level:** 2 | **Scope:** frontend, backend, data
> **Branch:** feature/onboarding
> **Commit:** `[ONBOARD-003] add categories step to setup guide`
> **Date:** 2026-03-06

## Changes Summary

### Backend (`lib/actions/setup-guide.ts`)
- Added EXISTS clause for `sections` table in the SQL query (position: after `has_income`, before `has_expense`)
- Added `sections: boolean` to `GuideStepCompletion` type
- Added `hasSections` to `allCompleted` computation
- Updated comments referencing "4 steps" to "all steps"

### Frontend orchestrator (`components/setup-guide/SetupGuide.tsx`)
- Added "sections" step to `STEPS_CONFIG` at index 1 (between income and expense)
- Exported `TOTAL_STEPS = STEPS_CONFIG.length` (5)
- Fixed `buildStepData()`: changed from `i === completedCount` to "first uncompleted = current" logic. This handles non-sequential completions during 4-to-5 migration (e.g. step 1 done, step 2 not done, step 3 done)
- Passed `totalSteps` prop to `SetupGuideBar` and `SetupGuideSheet`

### Sub-components
- `SetupGuideBar.tsx`: Added `totalSteps` prop, replaced hardcoded `4` in aria-labels and `total` prop
- `SetupGuideSheet.tsx`: Added `totalSteps` prop, replaced `getSubtitle()` switch-case with generic logic using `totalSteps` parameter (addresses reviewer M-1)
- `SetupGuideProgressRing.tsx`: Changed default `total` from 4 to 5
- `SetupGuideCelebration.tsx`: Updated JSDoc comment ("all 4 steps" -> "all steps")

## Decisions

### buildStepData fix (design section 9 — HIGH risk)
The old logic `i === completedCount` assumed linear progression. With migration from 4 to 5 steps, a user can have `[true, false, true, false, false]`, causing the "current" marker to land on an already-completed step. Fixed by using "first uncompleted = current" which is correct regardless of completion order.

### getSubtitle generic (reviewer M-1)
Replaced the switch/case with threshold-based logic: 0 = initial, totalSteps-1 = almost done, >= half = midway, else = start. This scales without modification if more steps are added.

### ensureDefaultSections ordering (reviewer M-2)
Verified: `getOrInitSetupGuideData()` runs in `layout.tsx`, `ensureDefaultSections()` runs in `page.tsx`. On first load, sections may not exist yet, but on next navigation the data refreshes. Design explicitly accepted this (Option A — any section counts). No code change needed.

## Reviewer Notes Resolution

| Note | Status | Action |
|------|--------|--------|
| M-1: getSubtitle generic pattern | DONE | Replaced switch with threshold-based logic |
| M-2: ensureDefaultSections ordering | VERIFIED | Existing ordering is acceptable per design decision |
| M-3: Update aria-labels | DONE | aria-labels now use `${totalSteps}` instead of hardcoded "4" |

## Exit Checklist

| Item | Status | Evidence |
|------|--------|----------|
| Implementation matches design | PASS | All 6 files modified as specified in design sections 3-8 |
| Build passes | PASS | `npm run build` succeeds, all routes rendered |
| Tests pass (no regression) | PASS | 177/177 tests pass (baseline: 177) |
| New tests written | N/A | No existing test suite for setup guide components; unit tests for pure functions (buildStepData, getSubtitle) would require test infrastructure not in scope |
| AC-1: New step in guide | IMPLEMENTED | "sections" step at index 1, title "Creer tes categories de depenses", href "/sections" |
| AC-2: Auto-detection | IMPLEMENTED | EXISTS on sections table in SQL query |
| AC-3: Order of 5 steps | IMPLEMENTED | STEPS_CONFIG order: income, sections, expense, generate, pay |
| AC-4: Progression on 5 | IMPLEMENTED | TOTAL_STEPS = 5, all components use totalSteps prop |
| AC-5: Retrocompatibility | IMPLEMENTED | Dynamic detection, buildStepData handles non-sequential, computeVisibility unchanged |
| Commit created | PASS | `[ONBOARD-003] add categories step to setup guide` |
| Visual validation (Playwright) | BLOCKED | Playwright MCP tools not available in this session |

## Discoveries

None.
