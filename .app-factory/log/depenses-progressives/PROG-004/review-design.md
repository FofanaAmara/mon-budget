# PROG-004 — Review Design : UI suivi progressif dans la page depenses

**Reviewer :** af-reviewer
**Date :** 2026-03-06
**Story :** PROG-004 (Niveau 2, scope frontend + backend)
**Design :** `.app-factory/log/depenses-progressives/PROG-004/design.md`

---

## Verdict : APPROVED WITH NOTES

Zero CRITICAL, zero HIGH. Design is sound and well-reasoned. Three MEDIUM findings and two LOW findings that should be addressed during build but do not block implementation.

---

## Migration Safety : SAFE (no migration required)

PROG-004 requires no schema changes. All DB columns (`is_progressive` on `expenses`, `paid_amount` on `monthly_expenses`, `expense_transactions` table) were delivered in PROG-001. The design only adds JOINs to existing queries. Classification: **SAFE**.

---

## Findings

### MEDIUM

#### M1 — `getDisplayGroup()` does not handle OVERDUE/DEFERRED priority correctly in the documented code

**File :** design.md § 4, `getDisplayGroup()` function
**Skill :** `af-clean-code` § Fonctions — single responsibility / correctness
**Problem :** The documented `getDisplayGroup()` checks `is_progressive` first, then derives the group from `paid_amount`. But a progressive expense that has been marked OVERDUE by `autoMarkOverdue()` (due_date passed) should remain in the OVERDUE group. The current code would classify it as IN_PROGRESS if `paid_amount > 0 && paid_amount < amount`, overriding the DB status.

The design itself acknowledges this in R3: "Adapter `getDisplayGroup()` pour respecter OVERDUE/DEFERRED meme pour les progressives." But the code sample in section 4 does NOT implement this.

**Impact :** A progressive expense past its due date with partial payment would show as "En cours" instead of "En retard," misleading the user.
**Fix :** Update the `getDisplayGroup()` specification to check `expense.status === "OVERDUE" || expense.status === "DEFERRED"` BEFORE the progressive logic. The risk mitigation R3 acknowledges this but the code sample contradicts it. The Builder should implement the R3 mitigation version, not the section 4 code.

---

#### M2 — `autoMarkPaidForAutoDebit` will mark auto-debit progressives as PAID prematurely

**File :** design.md (not addressed), `lib/actions/monthly-expenses.ts` lines 483-498
**Skill :** `af-data-modeling` § data integrity
**Problem :** `autoMarkPaidForAutoDebit()` marks all UPCOMING auto-charged expenses as PAID when `due_date <= today`. A progressive expense with `auto_debit=true` would be marked PAID regardless of `paid_amount`, which contradicts the progressive workflow (paid_amount accumulates over time, status remains UPCOMING).

The design addresses `autoMarkOverdue` (R3) but does not mention `autoMarkPaidForAutoDebit`. This function currently has no guard for progressive expenses.

**Impact :** If a user has a progressive expense with auto_debit=true, it would be force-marked PAID by the automation, bypassing the progressive accumulation flow.
**Fix :** During build, add an exclusion clause to `autoMarkPaidForAutoDebit`: exclude monthly expenses linked to progressive templates (requires the same JOIN on `expenses` to check `is_progressive`). Alternatively, document that `is_progressive` and `auto_debit` are mutually exclusive and validate this at template creation time (simpler).

---

#### M3 — `ExpenseGroupKey` type belongs in `lib/types.ts`, not `lib/constants.ts`

**File :** design.md § 4
**Skill :** `af-clean-architecture` § Separation of Concerns
**Problem :** The design places `ExpenseGroupKey` type definition in `lib/constants.ts`. Types and constants are different concerns. `lib/types.ts` already contains `MonthlyExpenseStatus`. Adding a derived union type (`MonthlyExpenseStatus | "IN_PROGRESS"`) in `constants.ts` breaks the convention where types live in `types.ts`.
**Impact :** Minor inconsistency — but if more code imports `ExpenseGroupKey`, having it in `constants.ts` creates a confusing import pattern.
**Fix :** Define `ExpenseGroupKey` in `lib/types.ts` alongside `MonthlyExpenseStatus`. Import it in `lib/constants.ts` for use in `GROUP_ORDER` and `GROUP_LABELS`.

---

### LOW

#### L1 — `getDisplayGroup()` location: DepensesTrackingClient.tsx vs utility module

**File :** design.md § 4
**Skill :** `af-clean-code` § Testabilite — logique metier dans des fonctions pures
**Problem :** `getDisplayGroup()` contains display-level business logic (deriving visual grouping from data state). Placing it directly in `DepensesTrackingClient.tsx` makes it harder to unit test without rendering the component. `lib/expense-display-utils.ts` already exists as the home for expense display logic.
**Impact :** Minor — the function is small and testable in context, but the convention would place it in the utility module.
**Fix :** Builder's discretion. If placed in `DepensesTrackingClient.tsx`, acceptable for now. If the function grows or is needed elsewhere, extract to `lib/expense-display-utils.ts`.

---

#### L2 — Hardcoded strings in GROUP_LABELS for "En cours"

**File :** design.md § 4
**Skill :** `af-conventions` § consistency
**Problem :** The existing `STATUS_LABELS` and `GROUP_LABELS` use non-accented strings ("Paye", "Reporte") while the design introduces "En cours" (correctly accented). Minor inconsistency — the existing labels are a pre-existing issue, not introduced by this design.
**Impact :** Cosmetic. The inconsistency is pre-existing.
**Fix :** No action required for this story. Note as pre-existing tech debt.

---

## Architecture Assessment

### D1 — Frontend-derived grouping (APPROVED)
Correct decision. The DB status represents the payment lifecycle, not the visual grouping. Adding `IN_PROGRESS` as a DB status would pollute all existing queries (`autoMarkOverdue`, `autoMarkPaidForAutoDebit`, `markAsPaid`, aggregation functions) for zero benefit. The frontend derivation is clean and localized.

### D2 — JOIN expenses for is_progressive (APPROVED)
Correct decision. Denormalization of `is_progressive` onto `monthly_expenses` would create a sync risk (user changes the flag after generation). The JOIN on a PK index is negligible cost. Consistent with the existing pattern of not denormalizing template attributes.

### D3 — Inline progress bar, no separate component (APPROVED)
YAGNI applied correctly. One usage does not justify a reusable component. The pattern (div with width%) is trivial. Extract if a third usage appears.

### D4 — getMonthSummary CASE WHEN (APPROVED)
The SQL is correct. The CASE WHEN handles all three cases:
- Progressive: contributes `paid_amount` (not full `amount`) to `paid_total`
- Non-progressive PAID: contributes `amount` to `paid_total`
- Everything else: contributes 0

Edge case (debt payments with expense_id=NULL): correctly handled — `e.is_progressive` will be NULL, falls to the `WHEN me.status = 'PAID'` branch.

---

## Security Assessment

### Authentication: OK
All server actions (`addExpenseTransaction`, `getExpenseTransactions`, `getMonthlyExpenses`, `getMonthSummary`) use `requireAuth()` and filter by `user_id`. No IDOR risk.

### Input validation: OK
`AddExpenseTransactionSchema` uses `idSchema` (UUID validation) and `positiveAmountSchema`. The note field uses `notesSchema`. All validated with `validateInput()`.

### Authorization: OK
The `addExpenseTransaction` function updates `monthly_expenses` with a `WHERE user_id = ${userId}` clause, preventing cross-user data manipulation. The transaction INSERT also specifies `user_id`.

### No new attack surface
This story introduces no new API endpoints, no new env vars, no new external service integrations.

---

## Risk Assessment Review

| Risk | Design Assessment | Reviewer Assessment |
|------|------------------|---------------------|
| R1 — Performance | Low, mitigated | **Agree.** Small table, PK-indexed JOIN. |
| R2 — Progressive + debt_id | Not possible | **Agree.** Progressive is RECURRING-only, debts have expense_id=NULL. |
| R3 — autoMarkOverdue | Medium, needs code adaptation | **Agree, but code sample in section 4 contradicts the mitigation.** See finding M1. |
| R4 — paid_amount coherence | Hors scope | **Agree.** Transactional atomicity in PROG-002 prevents drift in normal usage. |
| R5 — UI delegation | Low | **Agree.** Modifications to existing components, no new page or component. Pattern reuse. |

**Missing risk: autoMarkPaidForAutoDebit** — See finding M2. The design does not address this automation's interaction with progressives.

---

## Summary for Builder

1. **M1**: Implement `getDisplayGroup()` with OVERDUE/DEFERRED priority check BEFORE progressive logic (as described in R3, not as shown in the section 4 code sample).
2. **M2**: Guard `autoMarkPaidForAutoDebit` against progressive expenses, or validate that `is_progressive` + `auto_debit` are mutually exclusive at creation time.
3. **M3**: Define `ExpenseGroupKey` in `lib/types.ts`, not `lib/constants.ts`.
4. **L1/L2**: Builder's discretion.
