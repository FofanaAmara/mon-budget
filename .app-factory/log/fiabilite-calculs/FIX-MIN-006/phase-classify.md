# Classification: FIX-MIN-006

Date: 2026-03-05
Level: 1
Scope: [backend]
Fast track: YES

## Rationale
Single-file fix in a server action (onboarding.ts) — replacing hardcoded 'MONTHLY' with the user-selected frequency mapped to IncomeFrequency type. Small arithmetic for biweekly reverse-calculation.

## Notes
- 'weekly' form option has no IncomeFrequency equivalent — needs decision during build (treat as MONTHLY? disallow?)
- BIWEEKLY needs per-pay amount reverse-calculation from monthly amount
