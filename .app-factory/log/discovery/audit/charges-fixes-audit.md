# Audit — Charges fixes

> Feature: configuration / charges-fixes
> Source: ExpenseTemplateManager.tsx, ExpenseModal.tsx, lib/actions/expenses.ts
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Liste groupee par section | YES | YES | YES | YES | OK |
| AC-2 Mensualisation | YES | YES | YES | YES | OK |
| AC-3 Badge auto-debit | YES | YES | YES | YES | OK |
| AC-4 Charges ONE_TIME | YES | YES | YES | YES | OK |
| AC-5 CRUD complet | YES | YES | YES | YES | OK |
| AC-6 Generation mensuelle correcte | YES | NO | NO | NO | ISSUE |
| AC-7 Jour de prelevement | YES | NO | NO | NO | ISSUE |

## Issues

### ISSUE-CF-01 — Charges YEARLY/QUARTERLY generees chaque mois (BLOQUANT)
**AC-6** : `calcDueDateForMonth()` dans monthly-expenses.ts (l.37-41) traite MONTHLY, QUARTERLY et YEARLY de maniere identique — utilise `recurrence_day` dans le mois courant. Consequence : une charge YEARLY est generee 12 fois (une par mois), chacune avec le montant mensualise (amount * 1/12). Ce n'est pas le comportement attendu pour un paiement annuel comme une taxe.

Le champ `spread_monthly` identifie dans PLAN-depenses-enveloppes.md n'existe pas encore dans le schema DB.

**Severite** : BLOQUANT — Montants et nombre d'instances errones.

### ISSUE-CF-02 — recurrence_day default a 1 (BLOQUANT)
**AC-7** : `ExpenseModal.tsx:32` — `useState(expense?.recurrence_day?.toString() ?? '1')`. Par defaut, toute charge creee a `recurrence_day = 1`. L'utilisateur doit manuellement changer le jour, sinon toutes ses charges auront une due_date au 1er du mois.

Consequence directe : `autoMarkOverdue()` marque ces charges en retard des le 2e du mois, meme si l'utilisateur n'a defini aucun jour specifique.

**Severite** : BLOQUANT — Genere des faux positifs "en retard" pour toutes les nouvelles charges.

## Verdict Global: INCOMPLETE

- 2 BLOQUANT (generation YEARLY/QUARTERLY, recurrence_day default)
