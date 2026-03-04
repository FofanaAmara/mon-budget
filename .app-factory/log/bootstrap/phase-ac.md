# Phase 4 — Acceptance Criteria Report

> Date: 2026-03-04
> Status: COMPLETE

## Summary

18 feature briefs updated with Given/When/Then acceptance criteria at the feature level.

## Features Updated

### Core Financier (4 features)
1. **Suivi depenses** — 12 AC (groupement, monument, toggle, report, modifier, supprimer, FAB, filtres, dette, etat vide, auto-overdue, auto-paid)
2. **Tableau de bord** — 10 AC (monument, grille, valeur nette, timeline, score sante, alertes, generation, auto-mark, navigation, metriques)
3. **Suivi revenus** — 9 AC (monument, marquage fixe, variable, allocation tab, modification, FAB, generation, auto-received, etat vide)
4. **Allocation revenus** — 7 AC (sommaire, groupement, sections, projet, temporelles, generation, CRUD)

### Patrimoine (3 features)
5. **Epargne projets** — 7 AC (liste, contribution, historique, epargne libre, transfert, CRUD, etat vide)
6. **Gestion dettes** — 7 AC (liste, versements, paiement, extra, auto-deactivation, CRUD, etat vide)
7. **Sante financiere** — 5 AC (calcul score, couleurs, alertes dynamiques, coussin, metriques)

### Configuration (5 features)
8. **Charges fixes** — 7 AC (groupement, mensualisation, badge auto, one-time, CRUD, generation, jour prelevement)
9. **Revenus recurrents** — 5 AC (mensualisation, biweekly dates, variable, badge auto, CRUD)
10. **Gestion cartes** — 6 AC (design visuel, apercu live, couleurs, detail, separation auto/autres, CRUD)
11. **Gestion sections** — 3 AC (CRUD, proprietes, defaut)
12. **Parametres** — 4 AC (navigation, demo, suppression, deconnexion)

### Onboarding & Auth (4 features)
13. **Authentification** — 4 AC (inscription, connexion, deconnexion, protection)
14. **Onboarding** — 7 AC (detection, navigation, mensualisation, sections, demo, passer, une seule fois)
15. **Landing page** — 4 AC (accessibilite, CTA, responsive, animations)
16. **Data claim** — 3 AC (detection, reclamation, disparition)

### Notifications & PWA (2 features)
17. **Push notifications** — 4 AC (permission, abonnement, envoi, log)
18. **PWA** — 4 AC (manifest, SW, installabilite, icones)

## Total: 97 acceptance criteria across 18 features

## Edge Cases Identified

1. Dashboard balance: uses actualTotal (received) instead of expectedTotal — shows "budget depasse" when no income is marked received
2. recurrence_day defaults to 1 in ExpenseModal — all charges created without explicit day have due_date = 1st, causing false overdue
3. YEARLY/QUARTERLY expenses generated for every month instead of due months only
4. BIWEEKLY multiplier inconsistency: 2.17 (onboarding) vs 26/12 (generation) vs actual pay dates count
5. Section deletion without cascade protection
6. PWA favicon cache preventing updates
