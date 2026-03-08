# Phase Classify — ONBOARD-002

Date: 2026-03-07
Level: 2
Scope: [data, backend, frontend]
Fast track: No

## Rationale

Level 2 due to: DB migration with conditional logic (mark ALL existing users), defensive detection logic during deployment transition, regression analysis required across multiple features (sections, revenus, guide de configuration, loadDemoData), and cross-concern cleanup touching data layer, backend actions, and frontend components.

Does not reach Level 3: no multi-provider orchestration, migration is SAFE (INSERT ON CONFLICT), no external services.
