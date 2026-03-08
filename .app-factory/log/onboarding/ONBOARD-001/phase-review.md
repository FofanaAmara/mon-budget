# Phase Review — ONBOARD-001

Date: 2026-03-06
Attempt: 1
Verdict: CHANGES_REQUESTED

## Findings
- H-1: hasSeenOnboarding() uses requireAuth() (throws) instead of safe auth pattern (null-return). Should use session-based check like setup-guide queries.
- M-1: Onboarding gate after ensureDefaultSections() — acceptable trade-off, sections not visible during carousel
- M-2: Migration backfill result.length may be misleading — add RETURNING or separate count
- M-3: No tests — pre-existing systemic issue, acceptable for MVP alpha
- L-1: Empty catch block — add console.error
- L-2: isNewUser may be redundant — verify usage in AccueilClient

## Required Fix
H-1: Change hasSeenOnboarding() to use safe auth pattern (return false if not authenticated instead of throwing)
