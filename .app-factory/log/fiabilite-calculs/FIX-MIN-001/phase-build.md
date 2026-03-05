# Build Report: FIX-MIN-001

Date: 2026-03-05
Level: 1
Scope: [backend]

## Summary

Fixed `deferExpenseToMonth` to preserve `expense_id` foreign key when creating the deferred entry in the target month.

## Files Modified

1. `lib/actions/monthly-expenses.ts` — Added `expense_id` to SELECT, destructuring, type cast, and INSERT in `deferExpenseToMonth`

## Implementation Decisions

1. Pass `expense_id` through as-is (including NULL for adhoc expenses)
2. Removed misleading comment that justified the NULL as intentional

## Build Output

PASS — all routes compiled, zero errors.

## Commit

- `e6dd7b1` [FIX-MIN-001] preserve expense_id when deferring expense to next month
