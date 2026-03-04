# FIX-MIN-007 — Onboarding uses 2.17 multiplier instead of canonical 26/12

## Type
FIX

## Severity
MINEUR

## Feature
onboarding

## Description
In Onboarding.tsx:61, the biweekly-to-monthly conversion during onboarding uses the hardcoded multiplier `2.17` instead of the mathematically correct `26/12` (2.1667). This creates a ~$10 discrepancy per $3000 paycheck between the onboarding estimate and the actual income generation, causing confusion when users compare their onboarding setup with ongoing monthly figures.

## Acceptance Criteria
Given a user enters $3000 biweekly income during onboarding
When the monthly estimate is displayed
Then it shows $6,500.00 (3000 * 26/12), not $6,510.00 (3000 * 2.17)

## Technical Notes
- Files to modify: `src/components/Onboarding.tsx`
- Root cause: Hardcoded `2.17` instead of using a shared constant
- Fix approach: Import and use the canonical `BIWEEKLY_MONTHLY_MULTIPLIER` constant from `src/lib/constants.ts` (created in FIX-MIN-004)
- Dependencies: FIX-MIN-004 (creates the shared constant). Should be deployed together with FIX-MIN-006.

## Size
XS
