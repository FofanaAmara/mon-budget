# Classification: FIX-MIN-001

Date: 2026-03-05
Level: 1
Scope: [backend]
Fast track: YES

## Rationale
Single-file fix in a server action (monthly-expenses.ts) — adding `expense_id` to a SELECT and INSERT in the defer function. Pure data fix, no UI change.

## Notes
- The defer function omits expense_id from the INSERT, breaking the template-transaction link
- The ON CONFLICT (expense_id, month) DO NOTHING guard in generateMonthlyExpenses won't detect the deferred entry without expense_id
