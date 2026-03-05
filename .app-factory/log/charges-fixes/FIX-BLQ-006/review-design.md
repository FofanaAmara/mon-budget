# FIX-BLQ-006 — Review-Design Log

**Reviewer:** af-reviewer
**Date:** 2026-03-05
**Verdict:** APPROVED WITH NOTES

## Summary

Design reviewed for story FIX-BLQ-006 (invalidate stale monthly_expenses on template update).

The delete-and-regenerate strategy is architecturally sound. It leverages the existing Template vs Transaction pattern and avoids duplicating generation logic. All 5 acceptance criteria and 4 edge cases are covered. Security guards (user_id filtering, requireAuth) are in place. No migration needed.

## Findings

| ID | Severity | Title |
|----|----------|-------|
| F-1 | MEDIUM | Design does not document that `/parametres/charges` does not trigger regeneration |
| F-2 | MEDIUM | Manually adjusted monthly amounts are silently overwritten (documented trade-off) |
| F-3 | LOW | `is_active` listed in trigger table but routed through deleteExpense (minor ambiguity) |

## Notes for Builder

- F-2: Flag to PM during validation that manual monthly adjustments (`updateMonthlyExpenseAmount`) are lost when template is edited. Design says "template is source of truth" -- PM should explicitly accept.
- No schema change, no migration. Single file modified: `lib/actions/expenses.ts`.
- Regeneration relies on page visit to `/` or `/depenses`. This is correct by design.

## Migration Safety

N/A -- No schema change.
