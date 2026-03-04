# Audit — Onboarding

> Feature: onboarding-auth / onboarding
> Source: Onboarding.tsx, onboarding.ts
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Detection nouvel utilisateur | YES | YES | YES | YES | OK |
| AC-2 Navigation 3 etapes | YES | YES | YES | YES | OK |
| AC-3 Mensualisation revenu | YES | YES | PARTIAL | YES | ISSUE |
| AC-4 Creation sections | YES | YES | YES | YES | OK |
| AC-5 Alternative demo | YES | YES | YES | YES | OK |
| AC-6 Passer configuration | YES | YES | YES | YES | OK |
| AC-7 Une seule fois | YES | YES | YES | YES | OK |

## Issues

### ISSUE-ONB-01 — Revenu cree comme MONTHLY meme si frequence biweekly (MINEUR)
**AC-3** : Onboarding.tsx:98 convertit le revenu en mensuel (`toMonthly(amount, frequency)`), mais `completeOnboarding()` (onboarding.ts:35-41) cree le revenu avec `frequency: 'MONTHLY'` quel que soit le choix. Le montant est deja mensualise, mais la source perd l'info de la frequence reelle. Si l'utilisateur est paye bi-hebdo, son revenu sera affiche comme MONTHLY dans /parametres/revenus.

**Severite** : MINEUR — Le montant est correct, mais la metadata est perdue.

### ISSUE-ONB-02 — Multiplicateur biweekly 2.17 (MINEUR)
**AC-3** : `toMonthly()` utilise `* 2.17` pour bi-hebdo. Le vrai multiplicateur est 26/12 = 2.1667. La difference sur un salaire de $3,250 bi-hebdo : $7,042.50 vs $7,041.67 — negligeable mais incoherent avec le reste de l'app.

**Severite** : MINEUR — Difference negligeable.

## Verdict Global: COMPLETE

- 0 BLOQUANT
- 2 MINEUR (frequence perdue, multiplicateur)
