# Audit — Suivi des depenses

> Feature: core-financier / suivi-depenses
> Source: DepensesTrackingClient.tsx, monthly-expenses.ts, ExpenseTrackingRow.tsx, AdhocExpenseModal.tsx
> Date: 2026-03-04

## AC Evaluation

| AC | IMPLEMENTED | COMPLETE | COHERENT | USABLE | Verdict |
|----|:-----------:|:--------:|:--------:|:------:|---------|
| AC-1 Groupement par statut | YES | YES | YES | YES | OK |
| AC-2 Monument depense/prevu | YES | PARTIAL | NO | NO | ISSUE |
| AC-3 Toggle paye/a venir | YES | YES | YES | YES | OK |
| AC-4 Reporter une depense | YES | YES | PARTIAL | YES | ISSUE |
| AC-5 Modifier le montant | YES | YES | YES | YES | OK |
| AC-6 Suppression adhoc | YES | YES | YES | YES | OK |
| AC-7 FAB mois courant | YES | YES | YES | YES | OK |
| AC-8 Filtres combinables | YES | YES | YES | YES | OK |
| AC-9 Integration dette | YES | YES | YES | YES | OK |
| AC-10 Etat vide | YES | YES | YES | YES | OK |
| AC-11 Auto-mark overdue | YES | PARTIAL | NO | NO | ISSUE |
| AC-12 Auto-mark paid auto-debit | YES | YES | YES | YES | OK |

## Issues

### ISSUE-DEP-01 — Monument utilise planned_total au lieu de expected_total (BLOQUANT)
**AC-2** : Le monument affiche `paidTotal / chargesFixes` ou `chargesFixes = summary.planned_total`. Le `planned_total` est la somme de TOUTES les depenses planifiees (is_planned=true) du mois, incluant les depenses annuelles/trimestrielles mensualises. C'est correct comme reference budgetaire.

Cependant, le flag `isOverBudget = paidTotal > chargesFixes` compare le paye aux seules charges planifiees, sans inclure les imprevus dans le denominateur. Si l'utilisateur a beaucoup d'imprevus, le calcul reste coherent (les imprevus ne font pas partie du "budget"). Ce calcul est correct.

**Verdict** : Pas de bug ici — le monument est correct. Le probleme etait sur le dashboard (AC-1 du tableau de bord), pas ici.

### ISSUE-DEP-02 — Auto-mark overdue marque tout en retard (BLOQUANT)
**AC-11** : `autoMarkOverdue()` dans monthly-expenses.ts (l.356-368) marque comme OVERDUE toute depense UPCOMING dont `due_date < today` et `is_auto_charged = false`. Le probleme est que `calcDueDateForMonth()` retourne TOUJOURS une date, meme quand `recurrence_day` est null (fallback au 1er du mois pour WEEKLY/BIWEEKLY).

Plus grave : `ExpenseModal.tsx:32` definit `day = useState(expense?.recurrence_day?.toString() ?? '1')`. Toute charge creee sans modifier explicitement le jour se retrouve avec `recurrence_day = 1`, donc `due_date = 1er du mois`, et des le 2e du mois, elle est marquee OVERDUE.

**Severite** : BLOQUANT — Fausse alarme massive, toutes les charges apparaissent "en retard".

### ISSUE-DEP-03 — Charges YEARLY/QUARTERLY generees chaque mois (BLOQUANT)
**AC-11/AC-6 implicite** : `calcDueDateForMonth()` (l.37-41) genere une date pour CHAQUE mois pour les frequences YEARLY et QUARTERLY (il utilise `recurrence_day` dans le mois courant sans verifier que c'est le bon trimestre/annee). Le multiplicateur mensuel (1/12 pour YEARLY) est bien applique, mais cela cree 12 instances au lieu d'une seule au bon mois.

Consequence : une taxe scolaire annuelle de $3,642 apparait comme $303.50 CHAQUE mois au lieu de $3,642 une seule fois dans le mois de l'echeance.

**Severite** : BLOQUANT — Les montants totaux du mois sont errones.

### ISSUE-DEP-04 — Report cree une instance sans expense_id (MINEUR)
**AC-4** : `deferExpenseToMonth()` cree la nouvelle instance avec `expense_id = NULL`. C'est voulu ("so it coexists with template generation") mais cela signifie que la depense reportee est traitee comme un imprevu (expense_id IS NULL). Elle est donc supprimable (AC-6), et elle n'a pas de lien avec le template. Pas un bug fonctionnel, mais un choix d'architecture qui merite attention.

**Severite** : MINEUR — Comportement voulu mais potentiellement confus.

## Verdict Global: INCOMPLETE

- 3 BLOQUANT (auto-overdue, generation YEARLY/QUARTERLY, recurrence_day default)
- 1 MINEUR (report sans expense_id)
