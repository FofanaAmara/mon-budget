# GUIDE-002 — Validation Report

> Validator: af-pm (validate mode)
> Date: 2026-03-06
> Story: GUIDE-002 — Les etapes se cochent automatiquement quand je configure mon budget
> Verdict: **ACCEPTED WITH NOTES**

---

## Methodology

Code-level validation of all server actions, revalidation paths, and guide data flow. Playwright MCP was not available during this session. Validation is based on tracing the complete data flow: user action -> server action -> revalidatePath("/", "layout") -> layout re-renders -> getOrInitSetupGuideData() re-queries DB -> guide component receives fresh data.

---

## Per-AC Verdict

| AC | Criterion | Verdict | Detail |
|----|-----------|---------|--------|
| AC-1 | Create income -> step 1 checks | PASS | `createIncome()` calls `revalidatePath("/", "layout")` (incomes.ts:56). Guide query uses `EXISTS(SELECT 1 FROM incomes WHERE is_active=true)`. After revalidation, layout re-renders with fresh data. |
| AC-2 | Create expense -> step 2 checks | PASS | `createExpense()` calls `revalidatePath("/", "layout")` (expenses.ts:130). Guide query uses `EXISTS(SELECT 1 FROM expenses WHERE is_active=true)`. |
| AC-3 | Generate month -> step 3 checks | PASS (with note) | `generateMonthlyExpenses()` runs during page render (monthly-expenses.ts:225: "no revalidatePath — called during page render"). Layout computes guide data BEFORE the page generates the month. Step 3 checks on the NEXT page load, not the current one. This is consistent with Technical Notes: "la detection se fait au chargement de page." See note below. |
| AC-4 | Mark paid -> step 4 checks | PASS | `markAsPaid()` calls `revalidateExpensePages()` which includes `revalidatePath("/", "layout")` (revalidation.ts:12). Guide query uses `EXISTS(SELECT 1 FROM monthly_expenses WHERE status='PAID')`. |
| AC-5 | Delete only income -> step 1 unchecks | PASS | `deleteIncome()` calls `revalidatePath("/", "layout")` (incomes.ts:94). Soft-delete sets `is_active=false`. Guide query checks `is_active=true`, so the income no longer satisfies EXISTS. Step unchecks. |

## Note on AC-3 — Generation Timing

The month generation happens as a side-effect during `/depenses` page render, NOT as a user-triggered server action. Because the layout (which fetches guide data) renders before the page (which generates the month), the guide state is one page-load behind for this specific step.

**User experience:** The user navigates to /depenses. The month generates. The guide still shows step 3 unchecked on that page load. When the user navigates to ANY other page (home, revenus, etc.), the guide re-evaluates and step 3 appears checked.

**Assessment:** This is consistent with the story's own Technical Notes which state "la detection se fait au chargement de page ou apres une server action. Pas de push temps reel." The step checks on the next page load after the data exists. The user does not need any manual action — the detection is automatic, just deferred by one navigation.

This is acceptable behavior for GUIDE-002 scope. If instant feedback is desired for generation, it would require either (a) making generation a user-triggered server action, or (b) using client-side polling/refresh after generation. Both are outside the current story scope and could be logged as a future improvement.

## Edge Cases Verified (Code Level)

| Edge Case | Verdict | Detail |
|-----------|---------|--------|
| Non-sequential completion | OK | `steps.find(s => s.state !== "completed")` correctly finds the first uncompleted step in defined order for the bar label. The bottom sheet "current" highlight issue (GUIDE-001 discovery) is separate. |
| Multiple rapid actions | OK | Each server action independently calls revalidatePath. After both actions complete, the next layout render gets fresh data with both steps reflected. No race condition at the DB level (each action is independent). |
| Partial deletions (2 incomes, delete 1) | OK | Guide query uses `EXISTS(SELECT 1 FROM incomes WHERE is_active=true)`. With 1 income remaining, EXISTS still returns true. Step stays checked. |

## Revalidation Coverage Audit

| Server Action | `revalidatePath("/", "layout")` | Correct for GUIDE-002? |
|---------------|-------------------------------|----------------------|
| `createIncome` | Direct call (incomes.ts:56) | YES |
| `deleteIncome` | Direct call (incomes.ts:94) | YES |
| `updateIncome` | NOT present | OK — updating an income doesn't change the EXISTS check |
| `createExpense` | Direct call (expenses.ts:130) | YES |
| `deleteExpense` | Direct call (expenses.ts:225) | YES |
| `updateExpense` | NOT present | OK — same reasoning |
| `generateMonthlyExpenses` | NOT present (render-time) | Acceptable — see AC-3 note |
| `markAsPaid` | Via `revalidateExpensePages()` | YES |
| `markAsUpcoming` | Via `revalidateExpensePages()` | YES — reverting payment unchecks step 4 |
| `deleteMonthlyExpense` | Via `revalidateExpensePages()` | YES — if last paid expense deleted, step 4 unchecks |

## Additional Findings

### Note: `revalidateIncomePages()` missing layout revalidation (LOW)

The centralized helper `revalidateIncomePages()` (revalidation.ts:16-19) does NOT include `revalidatePath("/", "layout")`. The income actions (`createIncome`, `deleteIncome`) add it directly. This is not a bug (the behavior is correct), but it's an inconsistency with `revalidateExpensePages()` which does include it. If future income actions use the centralized helper instead of direct calls, they would miss the guide revalidation.

**Recommendation:** Add `revalidatePath("/", "layout")` to `revalidateIncomePages()` for consistency and safety. Log as TECH_DEBT discovery.

### GUIDE-001 Fixes Applied

From GUIDE-001 validation (NEEDS REWORK), the following issues were identified:
- Completed steps not clickable (AC-3 violation)
- Step 2 href wrong (/parametres instead of /parametres/charges)
- Stale TODO comments

I verified that step 2 now points to `/parametres/charges` in STEPS_CONFIG (SetupGuide.tsx:40). The stale TODO comments and clickability fix should have been addressed in the GUIDE-001 rework — not in scope for GUIDE-002 validation.

## Regressions

- Baseline: 180 tests passed (5 files) per state file
- No structural changes to existing components — only revalidatePath additions
- `revalidatePath("/", "layout")` is additive and cannot break existing behavior

## Verdict: ACCEPTED WITH NOTES

All 5 acceptance criteria are satisfied. The revalidation is correctly wired for all relevant server actions. The guide data flow (DB query -> layout prop -> component rendering) is sound.

**Notes:**
1. AC-3 (generation) has a one-page-load delay, consistent with the story's technical notes. Not a defect but worth noting for future UX improvement consideration.
2. `revalidateIncomePages()` helper is inconsistent with `revalidateExpensePages()` regarding layout revalidation. Low-priority tech debt.

### Caveat

This validation was performed via code analysis only. Playwright MCP visual testing was not available. The PM recommends a quick manual smoke test: create an income, verify the guide updates, then delete it, verify it unchecks. This would confirm the revalidation chain works end-to-end in the running application.
