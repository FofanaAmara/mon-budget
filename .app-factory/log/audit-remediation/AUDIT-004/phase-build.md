# AUDIT-004 — Build: Add Zod validation schemas to all server actions

**Date:** 2026-03-05
**Agent:** af-builder/build
**Level:** 2
**Scope:** backend, security
**Commit:** 9ab0f3f

---

## Implementation Summary

Added Zod runtime input validation to all 57 mutation/query functions across 13 server action files and 2 API routes. Zero behavior changes -- validation is strictly additive at function entry points.

### Files Created (16)

| File | Content |
|------|---------|
| `lib/schemas/common.ts` | 15 shared primitives (idSchema, monthSchema, nameSchema, positiveAmountSchema, etc.) |
| `lib/schemas/validate.ts` | ValidationError class + validateInput() helper |
| `lib/schemas/expense.ts` | CreateExpenseSchema, AddSavingsContributionSchema, TransferSavingsSchema, CreateAdhocExpenseSchema |
| `lib/schemas/income.ts` | CreateIncomeSchema, CreateAdhocIncomeSchema |
| `lib/schemas/debt.ts` | CreateDebtSchema, MakeExtraPaymentSchema |
| `lib/schemas/debt-transaction.ts` | AddDebtTransactionSchema |
| `lib/schemas/monthly-expense.ts` | DeferExpenseSchema, UpdateMonthlyExpenseAmountSchema |
| `lib/schemas/monthly-income.ts` | MarkIncomeReceivedSchema, UpdateMonthlyIncomeAmountSchema, MarkVariableIncomeReceivedSchema |
| `lib/schemas/allocation.ts` | CreateAllocationSchema, CreateAdhocAllocationSchema, UpdateMonthlyAllocationSchema |
| `lib/schemas/section.ts` | CreateSectionSchema |
| `lib/schemas/card.ts` | CreateCardSchema |
| `lib/schemas/settings.ts` | UpdateSettingsSchema |
| `lib/schemas/onboarding.ts` | CompleteOnboardingSchema |
| `lib/schemas/push.ts` | PushSendSchema, PushSubscribeSchema |
| `lib/schemas/index.ts` | Barrel export |
| `__tests__/unit/schemas.test.ts` | 69 unit tests |

### Files Modified (15)

| File | Changes |
|------|---------|
| `package.json` | Added `zod` to production dependencies |
| `lib/actions/expenses.ts` | Removed inline CreateExpenseInput type, added validateInput() to 10 functions |
| `lib/actions/incomes.ts` | Removed inline IncomeInput type, added validation to 4 functions |
| `lib/actions/debts.ts` | Removed inline CreateDebtInput type, added validation to 4 functions |
| `lib/actions/debt-transactions.ts` | Added validation to 3 functions |
| `lib/actions/monthly-expenses.ts` | Added validation to 10 functions |
| `lib/actions/monthly-incomes.ts` | Added validation to 7 functions |
| `lib/actions/allocations.ts` | Removed inline AllocationInput/AdhocAllocationInput types, added validation to 8 functions |
| `lib/actions/sections.ts` | Added validation to 5 functions |
| `lib/actions/cards.ts` | Added validation to 4 functions |
| `lib/actions/settings.ts` | Added validation to 1 function |
| `lib/actions/onboarding.ts` | Added validation to 1 function (catches ValidationError, returns { success: false }) |
| `app/api/push/send/route.ts` | Added Zod safeParse, returns 400 on invalid payload |
| `app/api/push/subscribe/route.ts` | Added Zod safeParse, validates HTTPS endpoint, returns 400 |

---

## Design Review Findings Addressed

- **M1**: All boolean fields (auto_debit, spread_monthly, notify_*) and notes included in CreateExpenseSchema
- **M2**: alreadyPaid included in CreateAdhocExpenseSchema with default false
- **M3**: auto_deposit and notes included in CreateIncomeSchema
- **M4**: Used nonNegativeAmountSchema for CreateExpense amount (PLANNED can be 0)
- **L1**: Deviation documented in expense.ts schema comment
- **L2**: Renamed to orderedIdsSchema (from reorderSchema)

## AC Deviation

**AC says:** "montant negatif ou zero" should return validation error.
**Implementation:** Zero is allowed for PLANNED expenses (amount=0 is legitimate) and monthly overrides (suspended = 0). Only negative amounts are rejected for these cases. Other schemas (adhoc expenses, debts, etc.) use positiveAmountSchema which rejects both negative AND zero. This is the correct behavior per design review M4/L1.

---

## Exit Checklist

1. [x] **Build passes** -- `npm run build` completes successfully, all routes compile
2. [x] **Migrations** -- N/A (no schema change)
3. [x] **Dev server** -- N/A (backend-only, build verification sufficient)
4. [x] **Tests** -- 74 tests pass (69 new + 5 existing), zero failures
5. [x] **AC verification** -- See below
6. [x] **Visual scan** -- N/A (backend only)

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| zod in production dependencies | PASS | package.json: `"zod": "^3..."` in dependencies |
| Negative amount rejected | PASS | positiveAmountSchema.safeParse(-1) -> false (test) |
| Empty name rejected | PASS | nameSchema.safeParse("") -> false (test) |
| Invalid expense type rejected | PASS | expenseTypeSchema.safeParse("INVALID") -> false (test) |
| Push send rejects absolute URL | PASS | PushSendSchema rejects "https://evil.com" (test) |
| Push subscribe rejects non-HTTPS | PASS | PushSubscribeSchema rejects "http://" (test) |
| Types inferred from schemas | PASS | z.infer used, inline types removed, tsc --noEmit clean |
| Build passes, non-regression | PASS | npm run build OK, all 74 tests pass |
