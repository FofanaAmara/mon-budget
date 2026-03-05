# Feature — Fiabilite des calculs et corrections

## Epic
stabilisation

## Description
Feature transversale regroupant tous les FIX restants (bloquants et mineurs) identifies lors de l'audit de fiabilite. Ces bugs impactent la confiance des utilisateurs dans les chiffres affiches : solde gonfle, score de sante corrompu, multiplicateurs incoherents, donnees ecrasees silencieusement.

L'objectif est de livrer un produit ou **chaque chiffre affiche est correct et coherent** d'un ecran a l'autre.

## Contexte
- FIX-BLQ-001, FIX-BLQ-002 et FIX-BLQ-006 sont deja **code_complete** (livres hors de cette feature)
- FIX-BLQ-004 dependait de BLQ-001/BLQ-002/BLQ-003 — les deux premiers sont resolus, seul BLQ-003 reste
- 12 stories restantes a livrer via cette feature

## Stories

### Bloquants (P1)

| ID | Titre | Taille | Deps | Feature d'origine |
|----|-------|--------|------|-------------------|
| FIX-BLQ-003 | Dashboard balance uses actualTotal instead of expectedTotal | XS | Aucune (BLQ-002 deja fait) | tableau-de-bord |
| FIX-BLQ-004 | Financial health score corrupted by wrong coverage formula | S | FIX-BLQ-003 | sante-financiere |
| FIX-BLQ-005 | Savings rate formula uses all-time instead of monthly rate | S | Aucune (independant) | sante-financiere |

### Mineurs (P2)

| ID | Titre | Taille | Deps | Feature d'origine |
|----|-------|--------|------|-------------------|
| FIX-MIN-004 | Biweekly multiplier inconsistent across codebase | S | Aucune | suivi-revenus |
| FIX-MIN-006 | Onboarding creates MONTHLY income even when biweekly selected | XS | Aucune | onboarding |
| FIX-MIN-007 | Onboarding uses 2.17 multiplier instead of canonical 26/12 | XS | FIX-MIN-004 | onboarding |
| FIX-MIN-001 | Deferred expense loses expense_id link to template | XS | Aucune | suivi-depenses |
| FIX-MIN-002 | Biweekly income without anchor uses amount*2 approximation | XS | FIX-MIN-004 | suivi-revenus |
| FIX-MIN-003 | Income generation overwrites manual changes | S | Aucune | suivi-revenus |
| FIX-MIN-005 | No cascade protection on section delete | S | Aucune | gestion-sections |
| FIX-MIN-008 | No cron job for push notification delivery | S | Aucune | push-notifications |
| FIX-MIN-009 | Favicon not cached by service worker for offline PWA | XS | Aucune | pwa-install |

## Taille totale
- 4 XS + 3 XS = 7 XS
- 3 S + 2 S = 5 S
- **12 stories total**

## Plan d'implementation (waves)

### Wave 1 — Fondations calculs (independants, debloquent la suite)
- **FIX-BLQ-003** (XS) — Fix balance dashboard. Debloque BLQ-004.
- **FIX-BLQ-005** (S) — Fix savings rate formula. Independant.

### Wave 2 — Score de sante (depend de Wave 1)
- **FIX-BLQ-004** (S) — Fix health score coverage formula. Depend de BLQ-003.

### Wave 3 — Multiplicateur biweekly (groupe coherent)
- **FIX-MIN-004** (S) — Creer constante canonique BIWEEKLY_MONTHLY_MULTIPLIER.
- **FIX-MIN-006** (XS) — Fix frequence onboarding (MONTHLY → BIWEEKLY).
- **FIX-MIN-007** (XS) — Remplacer 2.17 par constante dans onboarding. Depend de MIN-004.

### Wave 4 — Corrections fonctionnelles isolees
- **FIX-MIN-001** (XS) — Fix expense_id perdu lors du report.
- **FIX-MIN-002** (XS) — Fix amount*2 → 26/12 pour biweekly income. Depend de MIN-004.
- **FIX-MIN-003** (S) — Proteger les edits manuels des revenus mensuels.
- **FIX-MIN-005** (S) — Protection cascade sur suppression de section.

### Wave 5 — Infrastructure / PWA
- **FIX-MIN-008** (S) — Configurer cron Vercel pour push notifications.
- **FIX-MIN-009** (XS) — Ajouter icones au precache du service worker.

## Dependances critiques

```
BLQ-003 ──→ BLQ-004
MIN-004 ──→ MIN-007
MIN-004 ──→ MIN-002
MIN-006 + MIN-007 (deployer ensemble pour onboarding coherent)
```

## Criteres de succes (feature level)
1. Tous les montants affiches sur le dashboard sont calcules a partir de `expectedTotal`
2. Le score de sante financiere reflete les donnees du mois en cours (pas historiques)
3. Le multiplicateur biweekly est identique partout dans l'app (26/12)
4. Aucune donnee utilisateur n'est ecrasee silencieusement
5. Les suppressions avec dependances sont protegees par confirmation
6. Les notifications push sont effectivement livrees en production

## Exclusions
- FIX-BLQ-001 (charges fixes overdue) — deja code_complete
- FIX-BLQ-002 (expenses generates chaque mois) — deja code_complete
- FIX-BLQ-006 (stale monthly_expenses on template edit) — deja code_complete et valide
- Nouvelles fonctionnalites — cette feature est strictement corrective
