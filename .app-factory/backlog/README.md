# Backlog — Mes Finances

Generated: 2026-03-04 by af-bootstrap-backlog
Updated: 2026-03-05 by af-pm (feature transversale fiabilite-calculs)
Features: 19 existing | Stories: 15 FIX (6 BLQ + 9 MIN) | Status: READY

## Priorite P0 — Feature transversale active

### stabilisation / fiabilite-calculs (12 stories)

Regroupe TOUS les FIX restants pour implementation via `/af-implement-feature`.
3 stories deja completees hors feature (BLQ-001, BLQ-002, BLQ-006).

| Wave | Stories | Taille | Statut |
|------|---------|--------|--------|
| 1 | FIX-BLQ-003 (XS), FIX-BLQ-005 (S) | XS+S | A faire |
| 2 | FIX-BLQ-004 (S) | S | Bloque par Wave 1 |
| 3 | FIX-MIN-004 (S), FIX-MIN-006 (XS), FIX-MIN-007 (XS) | S+2XS | A faire |
| 4 | FIX-MIN-001 (XS), FIX-MIN-002 (XS), FIX-MIN-003 (S), FIX-MIN-005 (S) | 2XS+2S | A faire |
| 5 | FIX-MIN-008 (S), FIX-MIN-009 (XS) | S+XS | A faire |

Brief: `epics/stabilisation/features/fiabilite-calculs/FEATURE.md`

## Feature Map
See: [feature-map.md](feature-map.md)

## Epics

| Epic | Features | Stories FIX |
|------|----------|------------|
| core-financier | 4 | BLQ-001, BLQ-002, BLQ-003, MIN-001, MIN-002, MIN-003, MIN-004 |
| patrimoine | 3 | BLQ-004, BLQ-005 |
| configuration | 5 | BLQ-001 (shared), BLQ-006, MIN-005 |
| onboarding-auth | 4 | MIN-006, MIN-007 |
| notifications | 1 | MIN-008 |
| pwa | 1 | MIN-009 |
| **stabilisation** | 1 (fiabilite-calculs) | Transversal — regroupe les 12 FIX restants ci-dessus |

## Stories completees (hors feature)

| ID | Titre | Statut |
|----|-------|--------|
| FIX-BLQ-001 | Charges fixes overdue count inflated | code_complete |
| FIX-BLQ-002 | Quarterly/yearly expenses generating every month | code_complete |
| FIX-BLQ-006 | Stale monthly_expenses on template edit/delete | code_complete + validated |

## Implementation Order

1. **Immediat** : Feature `fiabilite-calculs` (Waves 1-5 ci-dessus)
2. **Apres stabilisation** : nouvelles features par epic

## Quick Reference

- Feature brief fiabilite-calculs: `epics/stabilisation/features/fiabilite-calculs/FEATURE.md`
- Feature briefs existants: `epics/[epic]/features/[feature]/feature-brief.md`
- Stories: `epics/[epic]/features/[feature]/stories/*.md`
- Audit reports: `../.app-factory/log/discovery/audit/`
- Bootstrap report: `../.app-factory/log/bootstrap-report.md`
