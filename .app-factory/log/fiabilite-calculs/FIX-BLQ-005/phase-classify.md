# Classification: FIX-BLQ-005

Date: 2026-03-05
Level: 1
Scope: [frontend]
Fast track: YES

## Rationale
Formula correction in TabSanteFinanciere.tsx — replacing cumulative all-time savings/income with monthly values that are already available. Requires prop threading from AccueilClient but no new business logic, no migration, no API change.

## Note
Story sized S due to multiple touch points (2 files, health score impact), but the change type is Level 1 (mechanical replacement of wrong values with correct ones).
