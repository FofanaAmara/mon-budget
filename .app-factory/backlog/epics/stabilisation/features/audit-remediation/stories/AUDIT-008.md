# AUDIT-008 — Add FK indexes and composite indexes

## Type
REFACTOR

## Severity
HAUTE

## Feature
audit-remediation

## Description
PostgreSQL ne cree PAS automatiquement d'index sur les foreign keys. Plusieurs colonnes FK n'ont aucun index : `expenses.section_id`, `expenses.card_id`, `monthly_expenses.card_id`, `notification_log.expense_id`, `income_allocations.project_id`. De plus, les requetes les plus frequentes filtrent par `(user_id, month)` sans index composite correspondant.

## Acceptance Criteria
Given les colonnes FK n'ont pas d'index
When une migration cree les index manquants
Then chaque FK a un index correspondant

Given `monthly_expenses` est requetee par `(user_id, month)` dans 5+ fonctions
When un index composite `(user_id, month)` est cree
Then les requetes filtrant par ces deux colonnes utilisent l'index

Given `monthly_incomes` est requetee par `(user_id, month)`
When un index composite `(user_id, month)` est cree
Then les requetes filtrant par ces deux colonnes utilisent l'index

Given `expenses` est filtree par `(user_id, is_active = true)` dans 5+ fonctions
When un index partiel `(user_id) WHERE is_active = true` est cree
Then les requetes d'expenses actives utilisent l'index

Given les index sont crees avec `CREATE INDEX IF NOT EXISTS`
When la migration est executee sur une DB qui a deja certains index
Then aucune erreur n'est levee (idempotent)

Given le build passait avant cette story
When la migration est appliquee
Then le build passe, les requetes retournent les memes resultats, et les pages se chargent correctement

## Technical Notes
- Creer un script de migration : `scripts/migrate-audit-indexes.mjs`
- Index FK a creer :
  - `idx_expenses_section_id ON expenses(section_id)`
  - `idx_expenses_card_id ON expenses(card_id)`
  - `idx_monthly_expenses_card_id ON monthly_expenses(card_id)`
  - `idx_notification_log_expense_id ON notification_log(expense_id)`
  - `idx_income_allocations_project_id ON income_allocations(project_id)`
- Index composites a creer :
  - `idx_me_user_month ON monthly_expenses(user_id, month)`
  - `idx_mi_user_month ON monthly_incomes(user_id, month)`
- Index partiel :
  - `idx_expenses_user_active ON expenses(user_id, is_active) WHERE is_active = true`
- Utiliser `CREATE INDEX IF NOT EXISTS` pour chaque index
- Pas de `CONCURRENTLY` necessaire (alpha, single user)
- Audit findings addressed : Data-H1, Performance-M4, M5, M6, Data-L3
- Dependencies : Aucune
- Non-regression : les requetes existantes retournent les memes resultats. Les pages se chargent normalement.

## Size
S
