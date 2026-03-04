# Audit — Suivi des revenus

> Feature: core-financier / suivi-revenus
> Source: RevenusTrackingClient.tsx, monthly-incomes.ts, allocations.ts
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Monument recu/attendu | YES | YES | YES | YES | OK |
| AC-2 Revenus fixes marquage | YES | YES | YES | YES | OK |
| AC-3 Revenus variables | YES | YES | YES | YES | OK |
| AC-4 Onglet allocation | YES | YES | YES | YES | OK |
| AC-5 Modification allocation | YES | YES | YES | YES | OK |
| AC-6 FAB contextuel | YES | YES | YES | YES | OK |
| AC-7 Generation automatique | YES | PARTIAL | NO | YES | ISSUE |
| AC-8 Auto-mark received | YES | YES | YES | YES | OK |
| AC-9 Etat vide | YES | YES | YES | YES | OK |

## Issues

### ISSUE-REV-01 — BIWEEKLY sans pay_anchor_date: montant * 2 au lieu du vrai calcul (MINEUR)
**AC-7** : Dans `generateMonthlyIncomes()` (monthly-incomes.ts:23-33), quand un revenu BIWEEKLY n'a pas de `pay_anchor_date`, le fallback est `Number(inc.amount) * 2`. C'est une approximation (2 paies/mois) mais le vrai nombre peut etre 2 ou 3 selon le mois.

Quand `pay_anchor_date` est present, le calcul est correct via `countBiweeklyPayDatesInMonth()`.

**Severite** : MINEUR — Le fallback est raisonnable mais imprecis.

### ISSUE-REV-02 — Generation ON CONFLICT DO UPDATE ecrase les montants manuellement modifies (MINEUR)
**AC-7** : La generation (monthly-incomes.ts:35-43) utilise `ON CONFLICT DO UPDATE SET expected_amount = EXCLUDED.expected_amount WHERE status = 'EXPECTED'`. Cela signifie que si l'utilisateur a modifie manuellement le expected_amount via `updateMonthlyIncomeAmount()`, la prochaine visite de la page recalculera et ecrasera la modification — SAUF si le statut est RECEIVED.

C'est un comportement voulu (le WHERE filtre status = 'EXPECTED') mais peut surprendre l'utilisateur s'il modifie un montant attendu et recharge la page avant de marquer recu.

**Severite** : MINEUR — Comportement coherent mais potentiellement surprenant.

## Verdict Global: COMPLETE

- 0 BLOQUANT
- 2 MINEUR (BIWEEKLY fallback, generation ecrase modifications)
