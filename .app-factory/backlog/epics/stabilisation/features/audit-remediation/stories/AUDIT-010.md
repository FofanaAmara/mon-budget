# AUDIT-010 — Document current DB schema + update data-model.md

## Type
CHORE

## Severity
CRITIQUE

## Feature
audit-remediation

## Description
Le fichier `supabase/schema.sql` est en retard de ~10 migrations. La creation de `monthly_incomes` n'existe nulle part dans le repo. Comprendre le schema actuel necessite de lire 14+ scripts de migration en sequence. `data-model.md` est incomplet : 5 tables ont des stubs sans colonnes, `spread_monthly` est manquant, les tables de notifications sont decrites en une ligne.

Il n'y a aucune source de verite pour le schema de la base de donnees.

## Acceptance Criteria
Given le schema SQL actuel n'est documente nulle part
When un fichier `supabase/schema-current.sql` est genere depuis la DB de production (ou reconstitue depuis les migrations)
Then il contient le CREATE TABLE complet pour chaque table avec toutes les colonnes, contraintes, index, et foreign keys

Given l'ancien `supabase/schema.sql` represente le schema MVP initial
When il est renomme en `supabase/schema-mvp-initial.sql`
Then le fichier est conserve comme reference historique

Given `data-model.md` a des stubs pour `income_allocations`, `monthly_allocations`, `savings_contributions`
When le document est mis a jour
Then chaque table a la liste complete de ses colonnes avec types, contraintes et descriptions

Given `data-model.md` ne mentionne pas `spread_monthly` sur expenses
When le document est mis a jour
Then la colonne `spread_monthly BOOLEAN` est documentee

Given `push_subscriptions` et `notification_log` sont decrits en une ligne
When le document est mis a jour
Then chaque table a ses colonnes documentees

Given le build passait avant cette story
When tous les changements sont appliques
Then le build passe (aucun changement de code, documentation seulement)

## Technical Notes
- Option 1 (ideale) : `pg_dump --schema-only` depuis la DB Neon de production
- Option 2 (fallback) : reconstituer le schema en lisant les 14 scripts de migration en sequence
- Renommer `supabase/schema.sql` en `supabase/schema-mvp-initial.sql`
- Creer `supabase/schema-current.sql` avec le schema complet
- Mettre a jour `.app-factory/docs/data-model.md` :
  - Completer `income_allocations` (colonnes : id, user_id, income_id, project_id, name, amount, percentage, frequency, start_month, end_month, color, position, is_active, created_at, updated_at)
  - Completer `monthly_allocations` (colonnes : id, user_id, allocation_id, month, allocated_amount, status, created_at)
  - Completer `savings_contributions` (colonnes : id, user_id, expense_id, amount, type, note, created_at)
  - Completer `push_subscriptions` et `notification_log`
  - Ajouter `spread_monthly` a la table expenses
  - Ajouter `allocation_sections` si absent
  - Ajouter `manually_edited` a monthly_incomes si present en DB
- Audit findings addressed : Data-C3, Data-M7, Documentation-M3, Documentation-L1, L2
- Dependencies : Aucune
- Non-regression : aucun changement de code, zero risque de regression

## Size
S
