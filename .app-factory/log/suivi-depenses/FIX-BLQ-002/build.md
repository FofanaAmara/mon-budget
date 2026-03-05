# FIX-BLQ-002 — Build Log

**Date:** 2026-03-05
**Builder:** af-builder
**Story:** Yearly and quarterly expenses generated every month instead of their due month

---

## Implementation Summary

All 5 files implemented as specified in the approved design. Zero deviations.

### Files Created

1. `scripts/migrate-spread-monthly.mjs` — Migration to add `spread_monthly` boolean column

### Files Modified

2. `lib/types.ts` — Added `spread_monthly: boolean` to `Expense` type
3. `lib/actions/monthly-expenses.ts` — Fixed `calcDueDateForMonth()` + generation loop with spread_monthly support
4. `lib/actions/expenses.ts` — Added `spread_monthly` to CreateExpenseInput, INSERT, and UPDATE
5. `components/ExpenseModal.tsx` — Added spread_monthly toggle for QUARTERLY/YEARLY frequencies

### Key Implementation Decisions

1. **calcDueDateForMonth restructure:** Split the combined MONTHLY/QUARTERLY/YEARLY block into three separate blocks. YEARLY checks `monthNum !== refMonth`, QUARTERLY uses positive modulo `((monthNum - refMonth) % 12 + 12) % 12` to check `diff % 3 !== 0`. MONTHLY unchanged.

2. **spread_monthly check order:** Runs BEFORE `calcDueDateForMonth` call in the generation loop, as specified in design. This prevents the skip guard from filtering out spread expenses in non-due months.

3. **Multiplier = 1 for non-spread QUARTERLY/YEARLY:** Since these now only generate in due months, the full amount is correct. The old 1/3 and 1/12 multipliers were for when every month was generated.

4. **getMonthlySummaryBySection() — NO CHANGE:** As confirmed in design section 3.3, the existing SQL CASE is correct for the summary's "monthly equivalent" semantics.

5. **Frontend reset behavior:** spreadMonthly resets to false when frequency changes away from QUARTERLY/YEARLY. Only sent as `true` to the server when frequency is QUARTERLY or YEARLY.

### Build Verification

- `npm run build`: SUCCESS (all routes compiled, no errors)

### Discoveries

None.
