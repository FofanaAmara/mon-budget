# Audit — Revenus recurrents

> Feature: configuration / revenus-recurrents
> Source: IncomeTemplateManager.tsx, IncomeModal.tsx, incomes.ts
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Mensualisation | YES | YES | PARTIAL | YES | ISSUE |
| AC-2 Prochaines dates biweekly | YES | YES | YES | YES | OK |
| AC-3 Sources variables | YES | YES | YES | YES | OK |
| AC-4 Badge auto-depot | YES | YES | YES | YES | OK |
| AC-5 CRUD complet | YES | YES | YES | YES | OK |

## Issues

### ISSUE-RR-01 — Multiplicateur BIWEEKLY incoherent entre features (MINEUR)
**AC-1** : L'affichage mensualise utilise `* 2.17` dans le template manager. La generation mensuelle (monthly-incomes.ts) utilise `countBiweeklyPayDatesInMonth()` (2 ou 3 paies reelles). L'onboarding utilise `* 2.17`. La mensualisation des depenses utilise `26/12 = 2.1667`.

Il y a 3 valeurs differentes pour le meme concept :
- 2.17 (onboarding + affichage revenus)
- 26/12 = 2.1667 (depenses)
- Reel: 2 ou 3 paies selon le mois (generation incomes)

**Severite** : MINEUR — Incoherence d'affichage, pas d'impact fonctionnel grave.

## Verdict Global: COMPLETE

- 0 BLOQUANT
- 1 MINEUR (multiplicateur incoherent)
