# Audit — Tableau de bord

> Feature: core-financier / tableau-de-bord
> Source: app/page.tsx, AccueilClient.tsx, TabTableauDeBord.tsx, TabTimeline.tsx, TabSanteFinanciere.tsx
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Monument balance | YES | YES | NO | NO | ISSUE |
| AC-2 Grille 4 cartes | YES | YES | YES | YES | OK |
| AC-3 Valeur nette | YES | YES | YES | YES | OK |
| AC-4 Timeline unifiee | YES | YES | YES | YES | OK |
| AC-5 Score sante | YES | YES | NO | NO | ISSUE |
| AC-6 Alertes dynamiques | YES | YES | YES | YES | OK |
| AC-7 Generation idempotente | YES | YES | YES | YES | OK |
| AC-8 Auto-mark mois courant | YES | YES | YES | YES | OK |
| AC-9 Navigation mensuelle | YES | YES | YES | YES | OK |
| AC-10 Metriques secondaires | YES | YES | PARTIAL | YES | ISSUE |

## Issues

### ISSUE-DASH-01 — Balance disponible utilise actualTotal (BLOQUANT)
**AC-1** : AccueilClient.tsx:50 — `const availableAmount = incomeSummary.actualTotal - summary.paid_total`.

Si aucun revenu n'est marque RECEIVED ce mois, `actualTotal = 0`. Donc `0 - X = -X$` → affiche "Budget depasse" meme si le revenu ATTENDU est largement suffisant.

Le plan PLAN-depenses-enveloppes.md identifie ce probleme et propose de remplacer par `expectedTotal`. Cependant, le bon calcul est discutable : `expectedTotal` montre ce que l'utilisateur PREVOIT avoir, `actualTotal` montre ce qu'il a RECU. Les deux ont du sens pour des cas d'usage differents.

**Impact** : En debut de mois, avant le depot du salaire, l'app affiche systematiquement "Budget depasse" avec un gros montant negatif en rouge. C'est alarmant et faux.

**Severite** : BLOQUANT — L'information principale de l'app est trompeuse.

### ISSUE-DASH-02 — Score de sante influance par les bugs depenses (BLOQUANT)
**AC-5** : Le score de sante est calcule dans TabSanteFinanciere.tsx:227-237. Il depend de :
- `coverageActual = actualTotal / planned_total` — utilise `actualTotal` (revenus recus), qui est souvent 0 en debut de mois
- `overdueBonus` — 20 points si aucun overdue. Mais avec le bug recurrence_day (ISSUE-DEP-02), TOUTES les depenses sont en retard

Consequence : le score est artificiellement bas a cause de deux bugs amont (actualTotal=0 → couverture=0, overdue partout → bonus=0). Le score en debut de mois est presque toujours < 20, soit "Situation critique".

**Severite** : BLOQUANT — Le score est faussement critique.

### ISSUE-DASH-03 — Savings rate utilise totalEpargne / actualTotal (MINEUR)
**AC-10** : Le taux d'epargne est calcule comme `totalEpargne / actualTotal * 100`. Ce calcul utilise l'epargne TOTALE (cumul all-time) divise par les revenus RECUS ce mois. Ce n'est pas un vrai taux d'epargne mensuel — c'est un ratio sans signification financiere.

Un vrai taux d'epargne serait : contributions epargne ce mois / revenus ce mois * 100.

**Severite** : MINEUR — La metrique est affichee mais son calcul est conceptuellement incorrect.

### ISSUE-DASH-04 — Couverture depenses utilise actualTotal au lieu d'expectedTotal (MINEUR)
**AC-5** : `coverageActual = actualTotal / planned_total * 100`. Utilise les revenus recus. En debut de mois (salaire pas encore recu), couverture = 0%. Serait plus utile avec expectedTotal.

**Severite** : MINEUR — coherent avec le choix actualTotal du monument, mais fausse la sante.

## Verdict Global: INCOHERENT

- 2 BLOQUANT (balance actualTotal, score fausse)
- 2 MINEUR (savings rate, couverture)
