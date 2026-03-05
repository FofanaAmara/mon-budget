# FIX-BLQ-006 — Modifying a template does not update already-generated monthly_expenses entries

## Type
FIX

## Severity
BLOQUANT

## Feature
charges-fixes

## Description
When a user modifies a recurring expense template (e.g., changes the amount, toggles `spread_monthly`, or changes the frequency), the already-generated `monthly_expenses` entries for the current and future months are NOT updated. The `ON CONFLICT (expense_id, month) DO NOTHING` clause in `generateMonthlyExpenses()` preserves the stale entries with outdated values. The user sees no effect from their change until the following month (when a new entry is generated).

**Example:** A user has a $1,200/year tax charge. They activate "Repartir mensuellement" (spread_monthly). The current month still shows $1,200 instead of $100 because the old monthly_expense entry persists unchanged.

This makes the spread_monthly feature (delivered by FIX-BLQ-002) broken in practice for the current month.

## Acceptance Criteria

**AC-1 : Amount change propagates to current month**
Given a recurring expense template with an existing monthly_expense entry for the current month (status UPCOMING or OVERDUE)
When the user modifies the template amount (e.g., from $50 to $75)
Then the monthly_expense entry for the current month is regenerated with the new amount ($75)
And the dashboard total reflects the updated amount

**AC-2 : Toggling spread_monthly updates current month**
Given a YEARLY expense of $1,200 with a monthly_expense entry of $1,200 for the due month (status UPCOMING or OVERDUE)
When the user activates spread_monthly on the template
Then the monthly_expense entry for the current month is regenerated with amount = $100 ($1,200 / 12)

**AC-3 : Frequency change updates current and future months**
Given a MONTHLY expense with monthly_expense entries for the current and future months (status UPCOMING or OVERDUE)
When the user changes the frequency to QUARTERLY
Then the monthly_expense entries for months where the charge should NOT appear are deleted
And the remaining entries reflect the correct amount

**AC-4 : PAID entries are never touched**
Given a monthly_expense entry with status PAID for a past or current month
When the user modifies the associated template (amount, frequency, or spread_monthly)
Then the PAID entry remains unchanged (amount, status, date all preserved)

**AC-5 : Deactivating spread_monthly reverts to lump sum**
Given a YEARLY expense of $1,200 with spread_monthly = true and a monthly_expense of $100 for the current month (status UPCOMING or OVERDUE)
When the user deactivates spread_monthly
Then the monthly_expense entry for the current month is removed (if the current month is not the due month)
Or updated to $1,200 (if the current month IS the due month)

## Edge Cases

- **Multiple future months generated:** If monthly_expenses exist for the current month AND future months (e.g., via pre-generation), all UPCOMING/OVERDUE entries must be invalidated and regenerated.
- **Template deactivation:** If the user sets `is_active = false` on a template, UPCOMING/OVERDUE monthly_expenses for that template should be deleted.
- **Mid-month change after partial payment:** If a monthly_expense is PAID, it must never be touched, even if the template changes. Only UPCOMING and OVERDUE entries are eligible for regeneration.
- **Same-day toggle:** User toggles spread_monthly on, then off, then on again in the same session -- each save should produce the correct state.

## E2E Scenario (business language)

1. User navigates to /parametres/charges
2. User sees a yearly tax charge of $1,200 due in June, with spread_monthly OFF
3. User clicks edit on the charge
4. User toggles "Repartir mensuellement" ON and saves
5. User navigates to the dashboard (current month = March)
6. The March budget shows a $100 entry for the tax charge (not $0, not $1,200)
7. User goes back to /parametres/charges and edits the charge amount to $2,400
8. User navigates to the dashboard
9. The March budget shows a $200 entry for the tax charge ($2,400 / 12)

## Technical Notes
- Root cause: `ON CONFLICT (expense_id, month) DO NOTHING` in `generateMonthlyExpenses()` -- existing entries are never updated when the source template changes.
- Proposed fix: In `updateExpense()`, when fields that affect monthly generation change (amount, frequency, spread_monthly, recurrence_day, is_active), delete all UPCOMING/OVERDUE monthly_expenses entries for that expense_id where month >= current month. The next call to `generateMonthlyExpenses()` (triggered on page visit) recreates them with correct values.
- This is a targeted invalidation approach -- simpler and safer than trying to UPDATE existing entries in place.
- Files likely involved: `src/lib/actions/expenses.ts` (updateExpense), `src/app/actions/monthly-expenses.ts` (generateMonthlyExpenses)

## Dependencies
- FIX-BLQ-002 (must be deployed first -- this fix builds on the spread_monthly column and corrected generation logic)

## Size
S
