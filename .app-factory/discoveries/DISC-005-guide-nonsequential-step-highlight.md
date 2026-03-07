# DISC-005 — Guide: Non-sequential step completion breaks "current" highlight

| Champ | Valeur |
|-------|--------|
| ID | DISC-005 |
| Type | BUG |
| Severity | P2 |
| Discovered by | af-pm |
| During | GUIDE-001 validation |
| Status | Open |

## Description

`buildStepData()` in `SetupGuide.tsx` uses `i === completedCount` to determine which step is "current" (teal highlighted). This assumes steps are completed in sequential order.

If a user completes steps out of order (e.g., has an expense but no income: income=false, expense=true), `completedCount=1` but the first incomplete step is at index 0 (income). The logic checks `i(0) === completedCount(1)` which is false, so no step gets the "current" state. The first incomplete step shows as "upcoming" (gray) instead of "current" (teal).

## Impact

Visual only. The bar label is correct (uses `steps.find(s => s.state !== "completed")`). The expanded step list shows all steps but the "current" highlight is missing or on the wrong step.

## Recommendation

Replace `i === completedCount` with a check for the first non-completed step:

```ts
const firstIncompleteIndex = STEPS_CONFIG.findIndex(
  (step) => !completionMap[step.id]
);
// then: state = (i === firstIncompleteIndex) ? "current" : "upcoming"
```

## Resolution

To be triaged by PM. Can be fixed in GUIDE-001 rework or as a separate fix.
