# Classification: FIX-MIN-004

Date: 2026-03-05
Level: 1
Scope: [backend, frontend]
Fast track: YES

## Rationale
Pure code cleanup — extracting scattered magic numbers (2.17, 2, 26/12) into a single shared constant. No business logic changes, no DB migrations, no new endpoints. Multiple files across backend and frontend.
