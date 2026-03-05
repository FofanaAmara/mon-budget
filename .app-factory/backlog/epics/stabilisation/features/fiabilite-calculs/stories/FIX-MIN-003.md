# FIX-MIN-003 — Income generation overwrites manual changes to monthly income entries

## Type
FIX

## Severity
MINEUR

## Feature
suivi-revenus

## Description
In monthly-incomes.ts:38-42, the income generation function overwrites existing monthly_income entries even if the user has manually adjusted them (e.g., to reflect a bonus, reduced hours, or a corrected amount). This means any manual edit is lost the next time generation runs, forcing users to re-edit every month.

## Acceptance Criteria
Given a user has manually edited a monthly income entry for the current month
When income generation runs again (e.g., page reload, month transition)
Then the manually edited entry is preserved and not overwritten

Given a monthly income entry was auto-generated and never manually edited
When income generation runs with updated template values
Then the entry is updated to reflect the new template amount

## Technical Notes
- Files to modify: `src/app/actions/monthly-incomes.ts`
- Root cause: Generation uses INSERT ON CONFLICT UPDATE without checking if the entry was manually modified
- Fix approach: Add a `manually_edited` boolean flag (or `updated_at` timestamp comparison) to monthly_income entries. Skip overwrite when flag is set. Alternatively, use INSERT ON CONFLICT DO NOTHING for existing entries.
- Dependencies: May need a DB migration to add the flag column

## Size
S
