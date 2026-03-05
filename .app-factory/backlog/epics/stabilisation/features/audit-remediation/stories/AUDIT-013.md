# AUDIT-013 — Split God Files (expenses.ts, monthly-expenses.ts) into focused modules

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
Deux fichiers d'actions sont des God Files :
- `expenses.ts` (519 lignes, 12+ fonctions, 4+ responsabilites) — melange CRUD templates, gestion epargne, aggregations par section, requetes par carte, adhoc expenses
- `monthly-expenses.ts` (501 lignes) — melange generation mensuelle, CRUD instances, auto-marking, report

Chaque fichier a plusieurs raisons de changer. Modifier la logique d'epargne risque de casser le CRUD des expenses. Modifier la generation risque de casser le marquage de paiement.

## Acceptance Criteria
Given `expenses.ts` melange CRUD, epargne, aggregations et adhoc
When il est decompose en modules focuses
Then il existe :
- `expenses.ts` — CRUD templates uniquement (getExpenses, createExpense, updateExpense, deleteExpense, getExpenseById, getExpensesByCard)
- `savings.ts` — logique epargne (getPlannedExpenses, addSavingsContribution, getSavingsContributions, transferSavings, getOrCreateFreeSavings, getMonthlySavingsSummary, updateSavedAmount)
- Les fonctions d'aggregation mensuelle (getMonthlySummaryBySection, getMonthlyExpenseActualsBySection) sont deplacees dans `monthly-expenses.ts`
- `createAdhocExpense` est deplace dans `monthly-expenses.ts` (cree une instance mensuelle, pas un template)

Given `monthly-expenses.ts` melange generation et CRUD
When il est decompose
Then la logique de generation est dans un module separe (ou clairement separee dans le fichier)

Given des composants importent des fonctions depuis `expenses.ts`
When les fonctions sont deplacees
Then les imports sont mis a jour dans tous les fichiers consommateurs

Given des composants appelent `createAdhocExpense` depuis `expenses.ts`
When la fonction est deplacee dans `monthly-expenses.ts`
Then les imports sont mis a jour

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe et toutes les fonctionnalites sont identiques

## Technical Notes
- Creer `lib/actions/savings.ts` : y deplacer les fonctions liees a l'epargne depuis `expenses.ts`
- Deplacer `getMonthlySummaryBySection` et `getMonthlyExpenseActualsBySection` dans `monthly-expenses.ts` (elles requetent `monthly_expenses`, pas `expenses`)
- Deplacer `createAdhocExpense` dans `monthly-expenses.ts`
- Mettre a jour tous les imports dans les composants et pages
- Pour `monthly-expenses.ts` : la separation generation/CRUD est partiellement couverte par AUDIT-003 (extraction calcDueDateForMonth). Ici on finalise la separation en movant les fonctions au bon endroit.
- Aussi : corriger la signature de `createAdhocExpense` (7 params positionnels → objet) et `transferSavings` (5 params → objet) (Clean Code M-12, M-13)
- Supprimer `ChevronRight` unused dans `TabTableauDeBord.tsx` (Frontend-M8)
- Supprimer les variables `ty`/`tm` unused dans `deferExpenseToMonth` (Clean Code M-14)
- Audit findings addressed : Architecture H-3, H-4, Clean Code M-12, M-13, M-14, Frontend-M8
- Dependencies : Aucune (mais recommande apres AUDIT-003)
- Non-regression : CRITIQUE. Tous les imports doivent etre corrects. Verifier chaque page : `/`, `/depenses`, `/revenus`, `/projets`, `/parametres/charges`.

## Size
M
