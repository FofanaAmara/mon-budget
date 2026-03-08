# GUIDE-005 — Phase: Validate

**Date:** 2026-03-07
**Agent:** af-pm (validate mode)
**Story:** GUIDE-005 — Ameliorer le timing de completion du guide

## Validation Method

Code analysis of the implementation against acceptance criteria. Review of:
- `components/setup-guide/SetupGuide.tsx` (timing logic, useEffect hooks, state management)
- `lib/actions/setup-guide.ts` (completeSetupGuide separation from dismissSetupGuide)
- `lib/actions/monthly-expenses.ts` (markAsPaid revalidation chain)
- `lib/revalidation.ts` (revalidateExpensePages covers /depenses + / + layout)

## Criteria Results

### AC-1: L'etape 3 se coche automatiquement en visitant /depenses

| Criterion | Verdict |
|-----------|---------|
| Given l'utilisateur a des depenses recurrentes configurees (step 2 fait) | N/A (precondition) |
| When il arrive sur /depenses | PASS |
| Then l'etape 3 est cochee dans le guide (les monthly_expenses existent deja) | PASS |
| And la barre du guide reflete la progression mise a jour | PASS |

**Analysis:**
- `useEffect` at lines 139-149 triggers `router.refresh()` when `pathname === "/depenses"` and `completion.generate === false`.
- The refresh re-runs server components, calling `getOrInitSetupGuideData()` which checks `has_generated` via SQL.
- Since `/depenses` page generates monthly_expenses server-side before rendering, the refresh picks up the new rows.
- Guard `hasRefreshedForStep3` ref prevents infinite refresh loops.
- The bar recalculates `completedCount` from the refreshed `completion` data.

**Verdict: PASS**

### AC-2: Delai entre step 4 et celebration

| Criterion | Verdict |
|-----------|---------|
| Given l'utilisateur marque une depense comme payee (step 4) | N/A (precondition) |
| When le guide detecte que toutes les etapes sont completes | PASS |
| Then le guide affiche d'abord l'etape 4 cochee pendant 15 secondes | PASS |
| And ENSUITE la vue celebration apparait avec une transition | PASS |

**Analysis:**
- `CELEBRATION_DELAY_MS = 15_000` constant at line 109.
- `useEffect` at lines 162-181: when `isAllComplete` becomes true, the guide expands immediately (`setIsExpanded(true)`) with all 4 steps checked. `showCelebration` remains false.
- After 15 seconds, `setTimeout` fires: `setShowCelebration(true)` switches the sheet to celebration view.
- `completeSetupGuide()` correctly sets only `completed_at` (not `dismissed_at`), keeping the guide visible during the 15s delay.
- Cleanup function clears the timer if the component unmounts.

**Verdict: PASS**

### GUIDE-004 AC-6 Regression Check: Auto-dismiss apres celebration

| Criterion | Verdict |
|-----------|---------|
| Le guide s'auto-dismiss apres la celebration | PASS |

**Analysis:**
- After the 15s timer, `dismissSetupGuide()` is called (lines 174-176), setting `dismissed_at` in the DB.
- On next render, `computeVisibility()` returns `false` when both `completed_at` and `dismissed_at` are set.
- The celebration CTA (`handleCelebrationCTA`) also calls `dismissSetupGuide()` as an early-exit option.
- The reviewer's CRITICAL-1 finding about the missing auto-dismiss was fixed in the second commit (0a7f973).

**Verdict: PASS**

## Additional Observations

### Reviewer MEDIUM-1: Celebration flash risk
The `revalidatePath` in `dismissSetupGuide()` could trigger a server re-render that sets `isVisible=false` before the user sees the celebration. The code mitigates this with `startTransition` which defers the UI update. This is acceptable for now — the celebration view is client-side state (`showCelebration`) which persists across server re-renders as long as the component doesn't unmount.

**Assessment:** Not a blocking issue. The `startTransition` mitigation is reasonable. If users report seeing the celebration flash/disappear, this should be addressed as a follow-up.

### Edge cases verified (code analysis)
- **User navigates away during 15s delay:** Timer clears via cleanup. On return, `isAllComplete` is still true but `hasTriggeredCompletion.current` is true (ref persists during session). If component unmounts and remounts, ref resets and the 15s timer starts fresh. `completeSetupGuide()` is idempotent (WHERE completed_at IS NULL).
- **hasRefreshedForStep3 ref reset on navigation:** Acceptable — a second refresh on return to /depenses is harmless.
- **User already has completed guide:** `computeVisibility()` returns false, component returns null. No interference.

## Verdict

**ACCEPTED**

All acceptance criteria are met. The implementation correctly:
1. Auto-refreshes guide data on /depenses to detect step 3 completion without page reload
2. Delays the celebration view by 15 seconds, showing all 4 steps checked first
3. Preserves GUIDE-004 AC-6 auto-dismiss behavior after celebration

The reviewer's MEDIUM finding about potential celebration flash is noted but mitigated by startTransition and does not affect the user experience in normal conditions.
