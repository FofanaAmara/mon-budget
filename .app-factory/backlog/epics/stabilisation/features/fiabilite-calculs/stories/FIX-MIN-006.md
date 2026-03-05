# FIX-MIN-006 — Onboarding creates MONTHLY income even when biweekly is selected

## Type
FIX

## Severity
MINEUR

## Feature
onboarding

## Description
In onboarding.ts:35-41, when a user selects biweekly frequency during onboarding, the server action creates the income record with frequency set to MONTHLY instead of BIWEEKLY. The user explicitly chose biweekly but the system ignores their selection, resulting in an incorrect income template that generates wrong monthly totals from day one.

## Acceptance Criteria
Given a user selects biweekly frequency during onboarding
When the onboarding completes
Then the created income record has frequency = BIWEEKLY

Given a user selects monthly frequency during onboarding
When the onboarding completes
Then the created income record has frequency = MONTHLY

## Technical Notes
- Files to modify: `src/app/actions/onboarding.ts`
- Root cause: The frequency field from the form is not passed through to the INSERT; it's hardcoded to MONTHLY
- Fix approach: Pass the user-selected frequency from the form data to the income INSERT statement
- Dependencies: FIX-MIN-007 (onboarding multiplier) should be applied together for coherent onboarding fix

## Size
XS
