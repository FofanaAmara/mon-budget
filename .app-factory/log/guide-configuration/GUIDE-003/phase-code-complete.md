# GUIDE-003 — Build Report

**Story:** Je celebre la completion du guide et peux le relancer
**Level:** 1 (fast track)
**Date:** 2026-03-06

## Changes

### 1. Server actions (lib/actions/setup-guide.ts)
- Added `completeSetupGuide()` — sets `completed_at = NOW()` when all 4 steps are done (idempotent: only if NULL)
- Added `resetSetupGuide()` — sets `reset_at = NOW()`, clears `completed_at` and `dismissed_at`
- Updated query to fetch `completed_at` from DB
- Updated `computeVisibility()` to use `completed_at`:
  - `completed_at + dismissed_at` both set = hide (fully done)
  - `completed_at` set but no `dismissed_at` = show (celebration in progress)
  - `dismissed_at` set = hide
  - Existing user (all done, no guide row) = hide

### 2. SetupGuide.tsx (orchestrator)
- Added auto-expand: when `isCelebration` becomes true, sheet auto-opens
- Added `completeSetupGuide()` call on celebration trigger (via useEffect)
- Used `useRef` to prevent double-trigger

### 3. ParametresClient.tsx (settings page)
- Added "Revoir le guide de configuration" button with wrench icon
- Calls `resetSetupGuide()` server action
- Shows feedback: "Relance en cours..." then "Guide relance !"

### 4. No migration needed
- `completed_at` and `reset_at` columns already exist in setup_guide table

## Exit Checklist

1. Build passes: YES (next build clean)
2. No migration needed: YES (columns exist)
3. Dev server runs: YES
4. Celebration flow: When all 4 steps complete, `isCelebration=true`, sheet auto-expands, `completeSetupGuide()` persists, celebration UI with confetti shows
5. Dismiss flow: CTA calls `dismissSetupGuide()` + navigates to dashboard. Auto-dismiss after 5s via SetupGuideCelebration timer also calls `onCTA` -> `dismissSetupGuide()`
6. Relaunch: "Revoir le guide de configuration" in /parametres calls `resetSetupGuide()`, guide reappears with current step states
7. Visual scan: No regressions (button follows existing pattern)

## Decisions

- **Auto-expand on celebration:** When all 4 steps complete, the sheet auto-opens to show the celebration. This avoids the user having to manually open it. The `useRef(hasTriggeredCompletion)` prevents the effect from firing multiple times during re-renders.
- **completeSetupGuide is idempotent:** The `WHERE completed_at IS NULL` guard prevents re-setting `completed_at` on subsequent renders or after a reset+re-completion cycle.
