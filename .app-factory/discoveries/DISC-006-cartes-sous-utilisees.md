# DISC-006 — Cartes saisies mais non exploitees

**Type:** IMPROVEMENT
**Severity:** P3 (mineur)
**Discovered by:** humain + af-pm
**Discovered during:** Refonte onboarding (discussion)
**Blocking:** Non

## Description
La page /cartes permet de saisir des cartes bancaires mais elles n'ont aucun impact fonctionnel sur le reste de l'app. Aucune liaison avec les depenses, les dettes, ou les comptes.

## Questions ouvertes (a explorer)
- Intention initiale : lier une carte a des depenses (telle depense passe sur telle carte)
- Faut-il une notion de compte bancaire separee ?
- Compte = carte ou concepts distincts ?
- Peut-on aller plus loin (rapprochement, budget par carte, etc.) ?

## Impact
Feature morte qui occupe de l'espace dans la navigation. Confusant pour un nouvel utilisateur qui saisit des cartes sans resultat visible.

## Recommendation
Explorer le sujet en product discovery avant de coder quoi que ce soit. Possiblement un epic "Comptes et moyens de paiement" a structurer.

## Status
OPEN
