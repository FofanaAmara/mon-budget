# Design Report: PROG-004

Date: 2026-03-06

## Summary

Design for progressive expense UI. Key decisions:
- D1: Frontend-derived grouping ("En cours") via getDisplayGroup(), no new DB status
- D2: JOIN expenses in getMonthlyExpenses to get is_progressive (no denormalization)
- D3: Inline progress bar in ExpenseTrackingRow (no separate component)
- D4: getMonthSummary uses CASE WHEN for progressive paid_amount vs binary PAID

## Files to Modify
- lib/types.ts — add is_progressive to MonthlyExpense
- lib/constants.ts — extend GROUP_ORDER/LABELS with IN_PROGRESS
- lib/actions/monthly-expenses.ts — JOIN expenses in queries
- lib/expense-display-utils.ts — new icon variant
- components/DepensesTrackingClient.tsx — getDisplayGroup() function
- components/ExpenseTrackingRow.tsx — progress bar, hide toggle
- components/depenses/ExpenseActionSheet.tsx — add-transaction + history views
- components/depenses/StatusGroupSection.tsx — widen type

## Risks
- R1: Performance of double JOIN (Low — small table, indexed PK)
- R3: autoMarkOverdue on progressives (Medium — getDisplayGroup respects priority)
- R5: UI delegation rule (Low — modifying existing components)

## No Migration Required
All DB changes in PROG-001. This story only changes queries and UI.
