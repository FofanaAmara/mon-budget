# Backlog — Mes Finances

Generated: 2026-03-04 by af-bootstrap-backlog
Updated: 2026-03-06 by af-pm (refonte onboarding decomposee en 3 stories ONBOARD-001/002/003)
Features: 21 existing (20 + guide-configuration) | Stories: 15 FIX + 15 AUDIT + 3 ONBOARD | Status: READY

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

## Priorite P1 — Nouvelles features

### onboarding-auth / guide-configuration — BRIEF READY (pas encore decompose)

Guide de configuration style "checklist Stripe" pour accompagner les nouveaux utilisateurs.
4 etapes detectees automatiquement : revenu recurrent, charge fixe, generer le mois, marquer une depense payee.
Barre fixe en bas (mobile), persistance DB, celebration a la completion, rejouable depuis les parametres.

Brief: `epics/onboarding-auth/features/guide-configuration/feature-brief.md`
Prochaine etape: decomposition en stories (quand priorise pour implementation).

### onboarding-auth / onboarding (refonte) — STORIES READY (3 stories, 11 pts)

Refonte complete de l'onboarding : carousel educatif (pas de saisie), detection DB, nettoyage ancien code, ajout etape categories au guide.

| # | Story | Titre | Taille | Dep. |
|---|-------|-------|--------|------|
| 1 | ONBOARD-001 | Carousel educatif pour les nouveaux utilisateurs | 5 pts | - |
| 2 | ONBOARD-002 | Detection DB et nettoyage de l'ancien onboarding | 3 pts | ONBOARD-001 |
| 3 | ONBOARD-003 | Ajout de l'etape categories au guide de configuration | 3 pts | ONBOARD-001 |

Brief: `epics/onboarding-auth/features/onboarding/feature-brief.md`
Stories: `epics/onboarding-auth/features/onboarding/stories/ONBOARD-00*.md`
Note: FIX-MIN-006 et FIX-MIN-007 restent des corrections independantes dans le meme dossier.

## Feature Map
See: [feature-map.md](feature-map.md)

## Epics

| Epic | Features | Stories FIX |
|------|----------|------------|
| core-financier | 4 | BLQ-001, BLQ-002, BLQ-003, MIN-001, MIN-002, MIN-003, MIN-004 |
| patrimoine | 3 | BLQ-004, BLQ-005 |
| configuration | 5 | BLQ-001 (shared), BLQ-006, MIN-005 |
| onboarding-auth | 5 (4 existing + guide-configuration) | MIN-006, MIN-007 |
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
2. **Ensuite** : Feature `guide-configuration` (decomposer en stories puis implementer)
3. **Ensuite** : Refonte onboarding (ONBOARD-001 → 002 → 003) — 3 stories, 11 pts
4. **Plus tard** : Nouvelles features par epic

## Quick Reference

- Feature brief audit-remediation: `epics/stabilisation/features/audit-remediation/FEATURE.md`
- Feature brief fiabilite-calculs: `epics/stabilisation/features/fiabilite-calculs/FEATURE.md`
- Feature briefs existants: `epics/[epic]/features/[feature]/feature-brief.md`
- Stories: `epics/[epic]/features/[feature]/stories/*.md`
- Audit reports: `.app-factory/docs/audits/`
- Bootstrap report: `.app-factory/log/bootstrap-report.md`
