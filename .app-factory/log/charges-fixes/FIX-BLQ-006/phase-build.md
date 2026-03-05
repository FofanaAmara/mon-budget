# FIX-BLQ-006 — Build Phase

**Date:** 2026-03-05
**Agent:** af-builder
**Level:** 2 (business logic)
**Scope:** backend

## Changes

### File: `lib/actions/expenses.ts`

**Change 1 — updateExpense() invalidation (lines 193-210)**

After the existing UPDATE query, added a check for financial field changes (`amount`, `recurrence_frequency`, `spread_monthly`, `recurrence_day`). When any of these are present in the update data, all UPCOMING/OVERDUE `monthly_expenses` entries for that expense from the current month onward are deleted. The next call to `generateMonthlyExpenses()` (on dashboard visit) regenerates them with correct values via `ON CONFLICT (expense_id, month) DO NOTHING`.

**Change 2 — deleteExpense() invalidation (lines 225-234)**

After the soft-delete UPDATE (`is_active = false`), unconditionally delete all UPCOMING/OVERDUE `monthly_expenses` entries for the deactivated template from the current month onward. Unconditional because deactivation always invalidates future entries.

## Design Decisions

- **Over-invalidation is acceptable:** We don't compare old vs new values. If `amount` is in the update payload, we invalidate even if the value didn't actually change. This is simpler and safer than fetching the old record to compare.
- **Delete-and-regenerate over in-place UPDATE:** Matches the design decision from the approved design. Simpler, avoids complex spread_monthly recalculation in the update action itself.
- **PAID/DEFERRED entries protected by status filter:** `status IN ('UPCOMING', 'OVERDUE')` ensures PAID entries are never touched (AC-4).

## Build Result

- Build: PASS (no compilation errors)
- Dev server: PASS (responds with 307 redirect as expected)
- No migration needed
- No frontend changes
