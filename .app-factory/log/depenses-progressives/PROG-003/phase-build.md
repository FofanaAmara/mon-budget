# Build Report: PROG-003

Date: 2026-03-06

## Files Modified
- lib/types.ts (is_progressive on Expense)
- lib/schemas/expense.ts (is_progressive in CreateExpenseSchema)
- lib/actions/expenses.ts (createExpense + updateExpense persist is_progressive)
- components/ExpenseModal.tsx (toggle + dynamic label)
- __tests__/unit/schemas.test.ts (+3 tests)

## Tests
159 passed (+3 from baseline 156)

## Visual Validation
- Toggle visible on RECURRING, hidden on ONE_TIME
- Label changes to "Budget mensuel" when toggle active
- No visual defects

## Commit
cb85213 [PROG-003] add progressive toggle to expense creation/edit form
