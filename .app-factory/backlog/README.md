# Backlog — Mes Finances

Generated: 2026-03-04 by af-bootstrap-backlog
Updated: 2026-03-05 by af-pm (feature audit-remediation — 15 stories issues de l'audit complet)
Features: 20 existing | Stories: 15 FIX (fiabilite-calculs) + 15 AUDIT (audit-remediation) | Status: READY

## Priorite P0 — Features transversales actives

### stabilisation / fiabilite-calculs (12 stories) — DONE

Regroupe TOUS les FIX restants. 3 stories deja completees hors feature (BLQ-001, BLQ-002, BLQ-006).
Toutes les stories de cette feature sont completees.

### stabilisation / audit-remediation (15 stories) — A FAIRE

Regroupe les corrections issues de l'audit complet du 2026-03-05 (170 findings sur 9 domaines).
Groupees par ACTION, pas par domaine. Zero regression comme contrainte #1.

| Wave | Stories | Taille | Statut |
|------|---------|--------|--------|
| 1 — Fondations | AUDIT-001 (S), AUDIT-010 (S), AUDIT-014 (S) | 3S | A faire |
| 2 — Securite | AUDIT-004 (M), AUDIT-007 (S), AUDIT-008 (S), AUDIT-009 (S) | M+3S | A faire |
| 3 — Tests | AUDIT-002 (M), AUDIT-003 (M) | 2M | Bloque par AUDIT-001 |
| 4 — Performance | AUDIT-005 (S), AUDIT-015 (XS) | S+XS | A faire |
| 5 — Accessibilite | AUDIT-006 (S) | S | A faire |
| 6 — Refactoring | AUDIT-012 (S), AUDIT-013 (M), AUDIT-011 (M) | S+2M | A faire (en dernier) |

Brief: `epics/stabilisation/features/audit-remediation/FEATURE.md`
Audit: `.app-factory/docs/audits/2026-03-05-full-audit.md`

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
| **stabilisation** | 2 (fiabilite-calculs, audit-remediation) | fiabilite-calculs: 12 FIX, audit-remediation: 15 AUDIT |

## Stories completees (hors feature)

| ID | Titre | Statut |
|----|-------|--------|
| FIX-BLQ-001 | Charges fixes overdue count inflated | code_complete |
| FIX-BLQ-002 | Quarterly/yearly expenses generating every month | code_complete |
| FIX-BLQ-006 | Stale monthly_expenses on template edit/delete | code_complete + validated |

## Implementation Order

1. **Immediat** : Feature `audit-remediation` (Waves 1-6 ci-dessus)
2. **Apres audit-remediation** : nouvelles features par epic

## Quick Reference

- Feature brief audit-remediation: `epics/stabilisation/features/audit-remediation/FEATURE.md`
- Feature brief fiabilite-calculs: `epics/stabilisation/features/fiabilite-calculs/FEATURE.md`
- Feature briefs existants: `epics/[epic]/features/[feature]/feature-brief.md`
- Stories: `epics/[epic]/features/[feature]/stories/*.md`
- Audit reports: `.app-factory/docs/audits/`
- Bootstrap report: `.app-factory/log/bootstrap-report.md`
