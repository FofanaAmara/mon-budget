# Classification Report: FIX-BLQ-002

Date: 2026-03-05

## Level: 2 (Business logic)

Rationale: Not a simple CRUD — involves fixing business logic (frequency-based generation rules with month matching), adding a DB column with a migration script, computing spread amounts (amount / period), and modifying both backend logic and frontend UI, with downstream data integrity impact on FIX-BLQ-003 and FIX-BLQ-004.

## Scope: [data, backend, frontend]

| Scope | Why |
|-------|-----|
| data | New `spread_monthly` boolean column on `expenses` table — requires a manual migration script in `scripts/` |
| backend | Core fix in `calcDueDateForMonth()` and generation loop in `generateMonthlyExpenses()` — frequency skip logic, spread amount calculation |
| frontend | `ExpenseModal.tsx` needs a toggle for `spread_monthly` on QUARTERLY/YEARLY expenses |

## Fast track: No

Level 2 requires standard SDLC: Design → Review-design → Build → Review.
