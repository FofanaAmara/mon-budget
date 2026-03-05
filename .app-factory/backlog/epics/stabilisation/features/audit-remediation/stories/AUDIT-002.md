# AUDIT-002 — Write unit tests for financial calculation functions

## Type
CHORE

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
Les fonctions financieres critiques (`calcMonthlyCost`, `calcMonthlyIncome`, `countBiweeklyPayDatesInMonth`, `calcNextDueDate`, `calcMonthlySuggested`, `daysUntil`) gerent l'argent de l'utilisateur sans aucun test. Un bug dans ces fonctions = des montants faux affiches silencieusement. Cette story ecrit 30+ tests unitaires couvrant tous les cas de frequence, les edge cases, et les formats de date.

Prerequis : `calcNextDueDate` doit etre refactorise pour accepter un `referenceDate` afin d'etre testable de facon deterministe (Testing-C4).

## Acceptance Criteria
Given `calcMonthlyCost` est appelee avec chaque frequence (WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY)
When le montant est 100$
Then les resultats correspondent aux multiplicateurs attendus (52/12, 26/12, 1, 1/3, 1/12 respectivement)

Given `calcMonthlyIncome` est appelee avec une frequence VARIABLE
When `estimated_amount` est defini
Then le resultat retourne `estimated_amount` (pas le montant principal)

Given `countBiweeklyPayDatesInMonth` est appelee pour un mois "riche" (3 paies)
When l'ancre tombe a une date qui produit 3 periodes dans le mois
Then la fonction retourne 3

Given `countBiweeklyPayDatesInMonth` est appelee pour un mois normal (2 paies)
When l'ancre tombe a une date standard
Then la fonction retourne 2

Given `calcNextDueDate` est appelee avec une referenceDate fixe (pas new Date())
When la frequence est MONTHLY et le jour est 31
Then la date retournee clamp au dernier jour du mois pour les mois de 30 jours ou fevrier

Given `calcMonthlySuggested` est appelee avec une target_date dans le passe
When le remaining est > 0
Then le resultat est le remaining total (1 mois restant = tout le solde)

Given `formatCAD` recoit 0, un nombre negatif, un tres grand nombre
When la fonction est appelee
Then chaque cas retourne le format fr-CA correct

Given `prevMonth("2026-01")` et `nextMonth("2025-12")`
When les fonctions traversent une frontiere d'annee
Then elles retournent respectivement "2025-12" et "2026-01"

Given `daysUntil` recoit null
When la fonction est appelee
Then elle retourne la valeur sentinelle 999 (ou Infinity si refactorise)

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe toujours et tous les tests passent

## Technical Notes
- Refactoriser `calcNextDueDate` pour accepter un parametre optionnel `referenceDate = new Date()` (Testing-C4)
- Fichier de test : `__tests__/unit/utils.test.ts` et `__tests__/unit/month-utils.test.ts`
- ~30 tests couvrant : calcMonthlyCost (6), calcMonthlyIncome (4), countBiweeklyPayDatesInMonth (4+), calcMonthlySuggested (3), calcNextDueDate (6+), formatCAD (3), prevMonth/nextMonth (2), daysUntil (2), formatShortDate (2)
- Extraire la constante `MS_PER_DAY = 86_400_000` dans `lib/constants.ts` (Clean Code M-01)
- Audit findings addressed : Testing-C1, Testing-C2, Testing-C4, Testing-M2, Testing-L1, Clean Code M-01, M-02
- Dependencies : AUDIT-001 (Vitest installe)
- Non-regression : `calcNextDueDate` est backward-compatible (referenceDate a une valeur par defaut). Le build passe.

## Size
M
