# GUIDE-001 — Validation Report

> Validator: af-pm (validate mode)
> Date: 2026-03-06
> Story: GUIDE-001 — Je vois le guide de configuration et les etapes a completer
> Verdict: **NEEDS REWORK**

---

## Per-AC Verdict

| AC | Criterion | Verdict | Detail |
|----|-----------|---------|--------|
| AC-1 | Affichage initial du guide | PASS | Bar visible, correct label, correct positioning (mobile above nav, desktop bottom-right) |
| AC-2 | Expansion de la checklist | PASS | Bottom sheet opens, shows 4 steps with correct states, current step highlighted |
| AC-3 | Navigation vers l'etape | FAIL | Completed steps are NOT clickable (AC says "completee ou non"). Step 2 navigates to /parametres instead of /parametres/charges |
| AC-4 | Persistance multi-appareil | PASS | Data from DB (4 EXISTS queries), no localStorage |
| AC-5 | Relation onboarding | PASS | Steps reflect actual data (income/expense from onboarding counted) |
| AC-6 | Existing users don't see guide | PASS | computeVisibility() correctly hides for users with all 4 conditions + no guide row |

## AC-3 Failure Detail

### Issue 1: Completed steps not clickable

AC-3 states: "When l'utilisateur tape sur une etape (completee ou non)"

Implementation in SetupGuideStep.tsx line 114:
```
onClick={state !== "completed" ? onClick : undefined}
```

Completed steps have no click handler and cursor is "default". This directly violates the AC.

**Fix required:** Remove the `state !== "completed"` guard. All steps should navigate on click regardless of completion state.

### Issue 2: Step 2 navigation target

Step 2 ("Ajouter une charge fixe") navigates to `/parametres` (general settings) instead of `/parametres/charges` (charges page). The user needs an extra tap.

**Fix required:** Change step 2 href from `/parametres` to `/parametres/charges` in STEPS_CONFIG.

## Additional Findings (non-blocking)

### Stale TODO comments (LOW)

- SetupGuideSheet.tsx line 25: "TODO for developer: the onStepClick should use router.push(href)..."
- SetupGuideStep.tsx line 17: "TODO for developer: wire onClick to router.push(step.href)..."

These are from the design-integrator phase and are now stale (builder already wired the functionality).

### Discovery: Non-sequential completion highlight bug (MEDIUM)

buildStepData() uses `i === completedCount` to determine the "current" step. This assumes steps complete in order. If income=false but expense=true (user configured expenses before income), no step gets the "current" highlight.

Logged as discovery for PM triage. Not blocking for GUIDE-001.

## Visual Scan

Code-level inspection (Playwright MCP visual validation not available this session):
- Mobile bar positioned correctly (above nav, z-index 100 vs nav 50)
- Bottom sheet with backdrop, proper z-index stacking
- Desktop widget bottom-right, 360px
- Text truncation with ellipsis on bar
- Builder screenshots in build report show no visual defects

## Regressions

- 180 unit tests pass
- Root layout async with .catch(() => null) for safety
- No interference with existing pages

## Verdict: NEEDS REWORK

### Must fix before ACCEPTED:
1. Completed steps must be clickable (AC-3 explicit requirement)
2. Step 2 href: `/parametres` -> `/parametres/charges`
3. Remove stale TODO comments in SetupGuideSheet.tsx and SetupGuideStep.tsx
