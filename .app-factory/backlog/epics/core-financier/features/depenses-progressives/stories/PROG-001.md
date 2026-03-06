# PROG-001 — Migration DB : support des depenses progressives

## Description
Ajouter le support base de donnees pour les depenses a consommation progressive : colonne `is_progressive` sur les templates, `paid_amount` sur les instances mensuelles, et table `expense_transactions` pour l'historique des sous-transactions.

## Criteres d'acceptation

**AC1 — Colonne is_progressive sur expenses**
- Given la migration est executee
- When on inspecte la table expenses
- Then la colonne `is_progressive` BOOLEAN DEFAULT FALSE existe
- And toutes les charges existantes ont is_progressive=false

**AC2 — Colonne paid_amount sur monthly_expenses**
- Given la migration est executee
- When on inspecte la table monthly_expenses
- Then la colonne `paid_amount` DECIMAL(10,2) DEFAULT 0 existe
- And toutes les instances existantes ont paid_amount=0

**AC3 — Table expense_transactions creee**
- Given la migration est executee
- When on inspecte la table expense_transactions
- Then elle contient : id (UUID PK), user_id (TEXT NOT NULL), monthly_expense_id (UUID FK monthly_expenses ON DELETE CASCADE), amount (DECIMAL(10,2) NOT NULL), note (TEXT), created_at (TIMESTAMPTZ DEFAULT NOW())
- And l'index idx_expense_tx_monthly(monthly_expense_id, created_at DESC) existe

**AC4 — Schema de reference mis a jour**
- Given la migration est executee
- Then data-model.md est mis a jour avec les nouvelles colonnes et table

## Dependances
Aucune

## Notes techniques
- Script : `scripts/migrate-progressive-expenses.mjs`
- Pattern : meme approche que `migrate-savings-contributions.mjs`
- Pas de backfill necessaire (is_progressive=false par defaut, paid_amount=0 par defaut)
