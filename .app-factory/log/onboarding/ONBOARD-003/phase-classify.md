# Phase Classify — ONBOARD-003

Date: 2026-03-07
Level: 2
Scope: [frontend, backend, data]
Fast track: No

## Rationale

Level 2 (business logic): modifying existing multi-step guide workflow with backward-compatible step detection, dynamic evaluation of completion state based on data (sections existence), migration logic for users mid-guide (4 to 5 steps), and edge case handling (default sections vs user-created, guide already completed).

## Scope

- frontend: SetupGuide.tsx, step configuration, progression UI, celebration trigger for 5 steps
- backend: setup-guide.ts server action, SQL EXISTS query for sections detection
- data: query change to detect sections (no schema migration)
