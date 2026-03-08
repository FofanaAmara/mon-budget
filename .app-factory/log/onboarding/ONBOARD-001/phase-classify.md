# Phase Classify — ONBOARD-001

Date: 2026-03-06
Level: 1 (Simple CRUD / wiring)
Scope: [data, backend, frontend]
Fast track: YES

## Rationale
Single DB column addition (boolean flag), one server action, conditional rendering in layout, wiring an existing UI shell. No business logic, no external services. Pattern established by setup-guide feature.

## Migration Safety
ADD COLUMN (nullable boolean with default) = SAFE. No rollback plan required.
