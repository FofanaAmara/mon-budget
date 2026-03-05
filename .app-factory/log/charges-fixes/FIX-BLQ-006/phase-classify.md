# Classification Report: FIX-BLQ-006

Date: 2026-03-05

## Level: 2 (Business logic)

Rationale: Conditional invalidation logic (PAID protection, month filtering, frequency-aware deletion) elevates this above Level 1.

## Scope: [backend]

Only `updateExpense()` in `lib/actions/expenses.ts` needs modification. No frontend, no migration, no schema change.

## Fast track: No
