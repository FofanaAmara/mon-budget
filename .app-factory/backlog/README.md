# Backlog — Mes Finances

Generated: 2026-03-04 by af-bootstrap-backlog
Updated: 2026-10-22 by af-pm — espaces financiers, nouvelle priorité humaine immédiate
Historique du dashboard : 22 features et compteurs du 2026-03-07 conservés ci-dessous ; non recertifiés.
Ajout 2026-10-22 : 1 epic, 1 feature, 6 stories ESP. Statut de la nouvelle feature : NOT READY pour build ; ESP-001 prêt pour conception.

## Prochaine priorité — Espaces financiers (décision humaine du 2026-10-22)

« C’est la prochaine priorité, on le développe tout de suite. » Ce chantier passe avant les autres fonctionnalités. La préparation commence immédiatement ; plan technique à valider avant implémentation.

- Epic : `finances-partagees` ; feature : [espaces-financiers](epics/finances-partagees/features/espaces-financiers/feature-brief.md).
- Ordre : ESP-001 premier espace → ESP-002 conservation existants → ESP-003 création/bascule → ESP-004 invitation compte existant → ESP-005 inscription invitée → ESP-006 invitation onboarding.
- [Readiness](epics/finances-partagees/features/espaces-financiers/readiness.md) : premier incrément prêt à concevoir ; feature complète NOT READY pour build (conception, dimensionnement et plan).
- Source : `.Codex/inputs/espaces-financiers/input.md` ; [couverture](epics/finances-partagees/coverage-map.md).

Les quatre décisions complémentaires sont validées : invitations par courriel et visibles après connexion ; nouvel invité rejoignant directement le commun sans espace personnel supplémentaire forcé ; reprise du dernier espace utilisé ; « Mes finances » modifiable pour les comptes existants. La conception d’expérience est autorisée ; aucun build applicatif encore validé.

### Avertissement sur les états historiques

Les sections historiques suivantes restent conservées : leurs libellés « à faire »/« ready » ne certifient pas l’état actuel. Par exemple, `state/features/audit-remediation.yaml` indique done/complete, et les états/logs onboarding, guide et dépenses progressives montrent des travaux déjà entrepris. Aucun `state/current.yaml` n’existe au 2026-10-22. Un rapprochement spécifique sera nécessaire ; aucun statut de livraison existant n’est modifié arbitrairement ici.

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

### stabilisation / coherence-design (6 stories) — A FAIRE

Corrections d'incoherences visuelles inter-pages identifiees lors de l'audit design du 2026-03-07.
Scope purement frontend. Zero regression fonctionnelle.

| Bloc | Stories | Taille | Statut |
|------|---------|--------|--------|
| 1 — Haute priorite | DESIGN-001 (M), DESIGN-002 (S) | M+S | A faire |
| 2 — Moyenne priorite | DESIGN-003 (S), DESIGN-004 (S), DESIGN-005 (XS) | 2S+XS | A faire |
| 3 — Basse priorite | DESIGN-006 (S) | S | A faire |

Brief: `epics/stabilisation/features/coherence-design/FEATURE.md`
Audit: `.tmp/audit-design/AUDIT-REPORT.md`

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
| **finances-partagees** | 1 (espaces-financiers) | 6 nouvelles stories ESP-001 à ESP-006 |
| core-financier | 4 | BLQ-001, BLQ-002, BLQ-003, MIN-001, MIN-002, MIN-003, MIN-004 |
| patrimoine | 3 | BLQ-004, BLQ-005 |
| configuration | 5 | BLQ-001 (shared), BLQ-006, MIN-005 |
| onboarding-auth | 5 (4 existing + guide-configuration) | MIN-006, MIN-007 |
| notifications | 1 | MIN-008 |
| pwa | 1 | MIN-009 |
| **stabilisation** | 3 (fiabilite-calculs, audit-remediation, coherence-design) | fiabilite-calculs: 12 FIX, audit-remediation: 15 AUDIT, coherence-design: 6 DESIGN |

## Stories completees (hors feature)

| ID | Titre | Statut |
|----|-------|--------|
| FIX-BLQ-001 | Charges fixes overdue count inflated | code_complete |
| FIX-BLQ-002 | Quarterly/yearly expenses generating every month | code_complete |
| FIX-BLQ-006 | Stale monthly_expenses on template edit/delete | code_complete + validated |

## Implementation Order — actualisé le 2026-10-22

1. **Maintenant : espaces-financiers** — préparer/valider le plan et arbitrages, puis ESP-001 → 002 → 003 → 004 → 005 → 006 selon readiness.
2. **Ensuite : rapprochement des états historiques** avant de relancer audit-remediation, coherence-design, guide-configuration ou onboarding ; leurs travaux existants ne doivent pas être reproduits sur la seule foi de ce dashboard.
3. **Plus tard : autres évolutions** selon nouvelle décision produit. Aucun item historique supprimé ou marqué terminé par cette priorisation.

## Quick Reference

- Feature brief audit-remediation: `epics/stabilisation/features/audit-remediation/FEATURE.md`
- Feature brief coherence-design: `epics/stabilisation/features/coherence-design/FEATURE.md`
- Feature brief fiabilite-calculs: `epics/stabilisation/features/fiabilite-calculs/FEATURE.md`
- Feature briefs existants: `epics/[epic]/features/[feature]/feature-brief.md`
- Stories: `epics/[epic]/features/[feature]/stories/*.md`
- Audit reports: `.app-factory/docs/audits/`
- Bootstrap report: `.app-factory/log/bootstrap-report.md`
