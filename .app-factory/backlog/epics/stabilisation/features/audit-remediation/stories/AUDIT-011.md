# AUDIT-011 — Decompose God Components (ProjetsEpargne, RevenusTracking, DepensesTracking)

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
5 composants depassent 500 lignes (jusqu'a 1275L). Les 3 pires cas sont :
- `ProjetsEpargneClient.tsx` (1275L) — gere les projets d'epargne, dettes, paiements extra, transferts, historique dans un seul render
- `RevenusTrackingClient.tsx` (1196L) — gere 2 onglets (revenus + allocations), marquage, modals, formulaires
- `DepensesTrackingClient.tsx` (876L) — gere monument, filtres, liste groupee, action sheet, defer, edit amount, delete

Chaque composant a 8-13 `useState` hooks gerant des concerns lies. Ce sont des God Objects au sens du clean code.

**ATTENTION REGRESSION :** Ce refactoring touche les 3 pages principales de l'app. Chaque sous-composant extrait doit produire un rendu visuellement et fonctionnellement identique.

## Acceptance Criteria
Given `ProjetsEpargneClient.tsx` fait 1275 lignes
When il est decompose en sous-composants
Then le composant principal fait moins de 300 lignes et orchestre des sous-composants (SavingsProjectCard, DebtCard, ExtraPaymentSheet, etc.)

Given `RevenusTrackingClient.tsx` fait 1196 lignes
When il est decompose
Then le composant principal fait moins de 300 lignes avec des sous-composants par onglet et par sheet

Given `DepensesTrackingClient.tsx` fait 876 lignes
When il est decompose
Then le composant principal fait moins de 300 lignes avec des sous-composants extraits (ExpenseMonument, StatusGroupSection, DeferSheet, etc.)

Given les composants extraits ont leurs propres state hooks
When un sheet est ouvert dans un sous-composant
Then seul ce sous-composant re-render (pas le parent entier)

Given les 3 pages (`/projets`, `/revenus`, `/depenses`) rendaient un certain UI avant le refactoring
When le refactoring est complete
Then chaque page rend un UI visuellement et fonctionnellement identique

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et les 3 pages fonctionnent identiquement (navigation, interaction, donnees)

## Technical Notes
- ProjetsEpargneClient : extraire SavingsProjectCard, DebtCard, ExtraPaymentSheet, ChargeDebtSheet, TransferSheet, SavingsHistorySheet
- RevenusTrackingClient : extraire IncomeTrackingTab, AllocationTrackingTab, plus les sheets internes
- DepensesTrackingClient : extraire ExpenseMonument, StatusGroupSection, ActionSheet (defer, edit amount, delete)
- Pour chaque composant : deplacer le state du sheet vers le sous-composant qui le possede
- Les `useState` groupes par concern → considerer `useReducer` ou custom hooks (`useActionSheet`)
- `ExpenseRow` dans `ExpenseTemplateManager.tsx` : deplacer en top-level function (Clean Code M-11)
- Audit findings addressed : Clean Code H-01, H-02, H-03, Frontend-H1, Frontend-M3, M6, Clean Code M-11
- Dependencies : Aucune (mais Wave 6, apres les autres refactorings)
- Non-regression : CRITIQUE. Les 3 pages principales de l'app sont touchees. Verifier visuellement chaque page. Verifier : ouverture/fermeture des sheets, soumission des formulaires, navigation entre onglets.

## Size
M
