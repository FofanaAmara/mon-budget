# PROG-003 — UI : toggle progressif dans le formulaire de charges

## Description
Ajouter un toggle "Consommation progressive" dans le formulaire de creation et d'edition des charges recurrentes. Quand active, le label du champ montant change en "Budget mensuel".

## Criteres d'acceptation

**AC1 — Toggle dans le formulaire de creation**
- Given l'utilisateur cree une nouvelle charge recurrente
- When il voit le formulaire
- Then un toggle "Consommation progressive" est visible
- And il est desactive par defaut

**AC2 — Label dynamique**
- Given le toggle progressif est active
- When l'utilisateur regarde le champ montant
- Then le label affiche "Budget mensuel" au lieu de "Montant"

**AC3 — Persistence a la creation**
- Given le toggle est active et le formulaire est soumis
- When la charge est creee
- Then expenses.is_progressive = true en base

**AC4 — Edition d'une charge existante**
- Given une charge recurrente non-progressive existe
- When l'utilisateur l'edite et active le toggle
- Then is_progressive passe a true
- And les futures instances generees seront progressives
- And l'instance du mois courant n'est PAS modifiee retroactivement

**AC5 — Exclusion des types non-recurrents**
- Given l'utilisateur cree une depense de type ONE_TIME ou PLANNED
- When il voit le formulaire
- Then le toggle "Consommation progressive" n'est PAS visible (seulement pour RECURRING)

## Dependances
- PROG-001 (colonne is_progressive)

## Notes techniques
- Le formulaire est dans `components/ExpenseTemplateManager.tsx` ou equivalent
- Le toggle n'est visible que pour type=RECURRING
- La server action createExpense/updateExpense doit accepter is_progressive
