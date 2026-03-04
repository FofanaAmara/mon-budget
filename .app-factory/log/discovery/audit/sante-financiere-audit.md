# Audit — Sante financiere

> Feature: patrimoine / sante-financiere
> Source: TabSanteFinanciere.tsx
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Calcul du score | YES | YES | NO | NO | ISSUE |
| AC-2 Couleurs et messages | YES | YES | YES | YES | OK |
| AC-3 Alertes dynamiques | YES | YES | YES | YES | OK |
| AC-4 Coussin de securite | YES | YES | YES | YES | OK |
| AC-5 Metriques affichees | YES | YES | NO | YES | ISSUE |

## Issues

### ISSUE-SF-01 — Score fausse par les bugs amont (BLOQUANT)
**AC-1** : Le calcul du score est correctement implemente DANS le composant (formule correcte). Cependant, les inputs sont fausses a cause des bugs amont :
- `coverageActual = actualTotal / planned_total` : actualTotal souvent 0 (revenus pas encore recus) → couverture = 0
- `overdueBonus` : 0 car toutes les depenses sont OVERDUE (bug recurrence_day)
- Resultat : score ≈ 0 + 0 + 0 = 0 → "Situation critique" en permanence

Ce n'est pas un bug du composant lui-meme mais de ses dependances.

**Severite** : BLOQUANT — L'indicateur principal de sante est inutilisable.

### ISSUE-SF-02 — Taux d'epargne mal calcule (MINEUR)
**AC-5** : `savingsRate = totalEpargne / actualTotal * 100` utilise l'epargne TOTALE (all-time) rapportee aux revenus RECUS du mois. Ce n'est pas un taux d'epargne — c'est un ratio d'accumulation.

Le vrai taux d'epargne mensuel serait : `contributions_epargne_ce_mois / revenus_recus_ce_mois * 100`.

**Severite** : MINEUR — Metrique conceptuellement incorrecte mais non bloquante.

## Verdict Global: INCOHERENT

- 1 BLOQUANT (score fausse par bugs amont)
- 1 MINEUR (taux d'epargne)
