# PROG-002 — Server actions pour les depenses progressives

## Description
Creer l'action `addExpenseTransaction` pour enregistrer les sous-transactions et mettre a jour `paid_amount`. Adapter la generation mensuelle pour initialiser `paid_amount=0` sur les depenses progressives. Ajouter le schema Zod correspondant.

## Criteres d'acceptation

**AC1 — addExpenseTransaction action**
- Given une depense progressive existe pour le mois courant avec paid_amount=350
- When l'action addExpenseTransaction est appelee avec monthlyExpenseId, amount=87.50, note="Metro"
- Then une ligne est inseree dans expense_transactions (monthly_expense_id, amount=87.50, note="Metro", user_id, created_at)
- And monthly_expenses.paid_amount passe de 350 a 437.50
- And les deux operations sont dans une meme transaction SQL

**AC2 — Validation Zod**
- Given un appel a addExpenseTransaction
- When amount <= 0 ou monthlyExpenseId est invalide
- Then l'action rejette avec une erreur de validation
- And aucune donnee n'est modifiee

**AC3 — Requete historique**
- Given une depense progressive a des sous-transactions
- When on requete getExpenseTransactions(monthlyExpenseId)
- Then la liste est retournee en ordre chronologique inverse (plus recent en premier)

**AC4 — Generation mensuelle adaptee**
- Given un template expenses a is_progressive=true
- When le mois est genere (generateMonthlyExpenses)
- Then l'instance monthly_expenses est creee avec paid_amount=0
- And le status est UPCOMING

## Dependances
- PROG-001 (migration DB)

## Notes techniques
- Pattern identique a `addSavingsContribution` dans savings.ts : sql.transaction([INSERT, UPDATE])
- Schema Zod dans lib/schemas.ts
- Action dans lib/actions/monthly-expenses.ts ou nouveau fichier expense-transactions.ts
