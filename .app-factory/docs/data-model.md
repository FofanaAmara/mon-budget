# Data Model -- Mes Finances

## Base de donnees

PostgreSQL heberge sur **Neon** (serverless). Connexion via `@neondatabase/serverless`.

Schema de reference : `supabase/schema-current.sql` (reconstitue depuis les migrations).
Schema historique MVP : `supabase/schema-mvp-initial.sql`.

## Enums

| Enum | Valeurs |
|------|---------|
| income_frequency | MONTHLY, BIWEEKLY, YEARLY |

## Tables

### sections
Categories de depenses personnalisables.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| name | VARCHAR(100) | NOT NULL | Nom de la section |
| icon | VARCHAR(10) | DEFAULT '📁' | Emoji |
| color | VARCHAR(7) | DEFAULT '#3B82F6' | Couleur hex |
| position | INTEGER | NOT NULL DEFAULT 0 | Ordre d'affichage |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### cards
Cartes bancaires de l'utilisateur.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| name | VARCHAR(100) | NOT NULL | |
| last_four | VARCHAR(4) | | 4 derniers chiffres |
| bank | VARCHAR(100) | | |
| color | VARCHAR(7) | DEFAULT '#6366F1' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### expenses
Templates de charges fixes, ponctuelles et projets d'epargne.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| name | VARCHAR(200) | NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | VARCHAR(3) | DEFAULT 'CAD' | |
| type | VARCHAR(20) | NOT NULL, CHECK IN ('RECURRING','ONE_TIME','PLANNED') | |
| section_id | UUID | FK sections ON DELETE SET NULL | |
| card_id | UUID | FK cards ON DELETE SET NULL | |
| recurrence_frequency | VARCHAR(20) | CHECK IN ('WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','QUARTERLY','YEARLY') | |
| recurrence_day | INTEGER | CHECK BETWEEN 1 AND 31 | Jour de paiement |
| auto_debit | BOOLEAN | DEFAULT FALSE | Prelevement automatique |
| spread_monthly | BOOLEAN | NOT NULL DEFAULT FALSE | Pour QUARTERLY/YEARLY : genere chaque mois avec montant divise |
| due_date | DATE | | |
| next_due_date | DATE | | |
| reminder_offsets | INTEGER[] | DEFAULT '{}' | Jours avant echeance |
| notify_push | BOOLEAN | DEFAULT TRUE | |
| notify_email | BOOLEAN | DEFAULT FALSE | |
| notify_sms | BOOLEAN | DEFAULT FALSE | |
| target_amount | DECIMAL(10,2) | | Pour PLANNED (epargne) |
| target_date | DATE | | Pour PLANNED |
| saved_amount | DECIMAL(10,2) | DEFAULT 0 | Pour PLANNED |
| notes | TEXT | | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### monthly_expenses
Instances mensuelles generees depuis les templates (ou ad-hoc).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| expense_id | UUID | FK expenses ON DELETE SET NULL, UNIQUE(expense_id, month) | Template source (null pour ad-hoc) |
| debt_id | UUID | FK debts ON DELETE SET NULL, UNIQUE(debt_id, month) WHERE debt_id IS NOT NULL | Si lie a une dette |
| month | VARCHAR(7) | NOT NULL, INDEX | Format "YYYY-MM" |
| name | VARCHAR(200) | NOT NULL | |
| amount | DECIMAL(10,2) | NOT NULL | |
| due_date | DATE | NOT NULL | Date d'echeance |
| status | VARCHAR(20) | NOT NULL DEFAULT 'UPCOMING', CHECK IN ('UPCOMING','PAID','OVERDUE','DEFERRED') | |
| paid_at | DATE | | Date de paiement |
| section_id | UUID | FK sections ON DELETE SET NULL, INDEX | |
| card_id | UUID | FK cards ON DELETE SET NULL | |
| is_auto_charged | BOOLEAN | DEFAULT FALSE | |
| is_planned | BOOLEAN | NOT NULL DEFAULT TRUE | true = prevu, false = ad-hoc |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Indexes : idx_me_month(month), idx_me_month_status(month, status), idx_me_section(section_id).

### incomes
Templates de revenus (salaire, freelance, investissements...).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL, INDEX | |
| name | VARCHAR(255) | NOT NULL | |
| source | VARCHAR(20) | CHECK IN ('EMPLOYMENT','BUSINESS','INVESTMENT','OTHER') | |
| amount | DECIMAL(10,2) | | null si VARIABLE |
| estimated_amount | DECIMAL(10,2) | | Estimation mensuelle si VARIABLE |
| frequency | income_frequency | NOT NULL DEFAULT 'MONTHLY' | Enum : MONTHLY, BIWEEKLY, YEARLY |
| pay_anchor_date | DATE | | Date d'ancrage pour calcul biweekly |
| auto_deposit | BOOLEAN | DEFAULT FALSE | |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### monthly_incomes
Instances mensuelles des revenus.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL, INDEX | |
| income_id | UUID | FK incomes ON DELETE CASCADE, UNIQUE(income_id, month) | |
| month | VARCHAR(7) | NOT NULL | Format "YYYY-MM" |
| expected_amount | DECIMAL(10,2) | | |
| actual_amount | DECIMAL(10,2) | | |
| status | VARCHAR(20) | NOT NULL DEFAULT 'EXPECTED', CHECK IN ('EXPECTED','RECEIVED','PARTIAL','MISSED') | |
| received_at | DATE | | |
| is_auto_deposited | BOOLEAN | DEFAULT FALSE | |
| manually_edited | BOOLEAN | DEFAULT FALSE | Preserve les modifications manuelles de la regeneration |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

NOTE : La table a ete creee directement en DB Neon (aucun script de migration pour le CREATE TABLE initial).

### debts
Suivi des dettes (prets, cartes de credit, etc.).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| name | VARCHAR(200) | NOT NULL | |
| original_amount | DECIMAL(12,2) | NOT NULL | |
| remaining_balance | DECIMAL(12,2) | NOT NULL | |
| interest_rate | DECIMAL(5,2) | DEFAULT NULL | |
| payment_amount | DECIMAL(10,2) | NOT NULL | |
| payment_frequency | VARCHAR(20) | NOT NULL, CHECK IN ('WEEKLY','BIWEEKLY','MONTHLY','BIMONTHLY','QUARTERLY','YEARLY') | |
| payment_day | INTEGER | CHECK BETWEEN 1 AND 31 | |
| auto_debit | BOOLEAN | DEFAULT FALSE | |
| card_id | UUID | FK cards ON DELETE SET NULL | |
| section_id | UUID | FK sections ON DELETE SET NULL | |
| notes | TEXT | | |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### debt_transactions
Historique des paiements et charges sur les dettes.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL | |
| debt_id | UUID | NOT NULL, FK debts ON DELETE CASCADE | |
| type | VARCHAR(10) | NOT NULL, CHECK IN ('PAYMENT','CHARGE') | |
| amount | DECIMAL(10,2) | NOT NULL | |
| month | VARCHAR(7) | NOT NULL | |
| note | TEXT | | |
| source | VARCHAR(20) | DEFAULT 'MANUAL' | MANUAL ou MONTHLY_EXPENSE (backfill) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Indexes : idx_debt_tx_month(user_id, month), idx_debt_tx_debt(debt_id, created_at DESC).

### income_allocations
Allocation des revenus vers des sections ou projets d'epargne.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL | |
| label | TEXT | NOT NULL | Nom de l'allocation |
| amount | NUMERIC(10,2) | NOT NULL | Montant alloue |
| section_id | UUID | FK sections ON DELETE SET NULL | Section unique (legacy, voir allocation_sections) |
| project_id | UUID | FK expenses ON DELETE SET NULL | Projet d'epargne lie |
| end_month | VARCHAR(7) | | Mois de fin (format "YYYY-MM") |
| color | VARCHAR(20) | DEFAULT '#6B6966' | |
| position | INT | DEFAULT 0 | Ordre d'affichage |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### allocation_sections
Table de jonction N:N entre income_allocations et sections.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| allocation_id | UUID | NOT NULL, FK income_allocations ON DELETE CASCADE, PK | |
| section_id | UUID | NOT NULL, FK sections ON DELETE CASCADE, PK | |

Cle primaire composite : (allocation_id, section_id).

### monthly_allocations
Instances mensuelles des allocations de revenus.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL | |
| allocation_id | UUID | NOT NULL, FK income_allocations ON DELETE CASCADE | |
| month | VARCHAR(7) | NOT NULL, UNIQUE(allocation_id, month) | Format "YYYY-MM" |
| allocated_amount | NUMERIC(10,2) | NOT NULL | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### savings_contributions
Contributions individuelles aux projets d'epargne (PLANNED expenses).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| user_id | TEXT | NOT NULL | Ajoute par migrate-auth.mjs |
| expense_id | UUID | NOT NULL, FK expenses ON DELETE CASCADE | Projet d'epargne cible |
| amount | DECIMAL(10,2) | NOT NULL | |
| note | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

Index : idx_savings_contributions_expense(expense_id, created_at DESC).

### settings
Configuration utilisateur (singleton par user_id).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, UNIQUE | |
| default_currency | VARCHAR(3) | DEFAULT 'CAD' | |
| default_reminder_offsets | INTEGER[] | DEFAULT '{1, 3, 7}' | |
| notify_push | BOOLEAN | DEFAULT TRUE | |
| notify_email | BOOLEAN | DEFAULT FALSE | |
| notify_sms | BOOLEAN | DEFAULT FALSE | |
| email | VARCHAR(255) | DEFAULT NULL | Ajoutee par migrate-phase1-complement |
| phone | VARCHAR(50) | DEFAULT NULL | Ajoutee par migrate-phase1-complement |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### push_subscriptions
Abonnements Web Push pour les notifications navigateur.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| endpoint | TEXT | UNIQUE NOT NULL | URL du service de push |
| p256dh | TEXT | NOT NULL | Cle publique ECDH |
| auth | TEXT | NOT NULL | Secret d'authentification |
| user_agent | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

### notification_log
Journal des notifications envoyees.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | TEXT | NOT NULL, INDEX | |
| expense_id | UUID | FK expenses ON DELETE CASCADE | |
| channel | VARCHAR(20) | NOT NULL, CHECK IN ('push','email','sms') | |
| status | VARCHAR(20) | NOT NULL, CHECK IN ('sent','failed','pending') | |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | |
| error_message | TEXT | | |

## Migrations

Les migrations sont des scripts Node.js dans `scripts/` executes manuellement :
- Pas d'outil de migration (pas Prisma, pas Drizzle)
- Chaque script est un fichier `migrate-*.mjs` (ou `.js`) autonome
- Execution : `node scripts/migrate-xxx.mjs`
- Schema de reference : `supabase/schema-current.sql`

### Historique des migrations

| Script | Description |
|--------|-------------|
| migrate-phase1-complement.js | CREATE monthly_expenses, indexes, settings email/phone |
| migrate-phase2.mjs | PLANNED columns sur expenses, CREATE incomes |
| migrate-savings-contributions.mjs | CREATE savings_contributions + backfill |
| migrate-is-planned.mjs | ADD is_planned sur monthly_expenses |
| migrate-auth.mjs | ADD user_id sur toutes les tables + indexes |
| migrate-debts.mjs | CREATE debts, ADD debt_id sur monthly_expenses |
| migrate-debt-transactions.mjs | CREATE debt_transactions + backfill |
| migrate-cleanup-adhoc.mjs | Dissocier ad-hoc monthly_expenses, supprimer ONE_TIME orphelins |
| migrate-bimonthly.mjs | ADD BIMONTHLY aux CHECK constraints (expenses, debts) |
| migrate-biweekly-anchor.mjs | ADD pay_anchor_date sur incomes |
| migrate-auto-deposit.mjs | ADD auto_deposit sur incomes, is_auto_deposited sur monthly_incomes |
| migrate-allocations.mjs | CREATE income_allocations et monthly_allocations |
| migrate-allocation-sections.mjs | CREATE allocation_sections (junction N:N) + migration |
| migrate-spread-monthly.mjs | ADD spread_monthly sur expenses |
| migrate-manually-edited.mjs | ADD manually_edited sur monthly_incomes |

### Gap connu

La table `monthly_incomes` a ete creee directement dans la DB Neon sans script de migration. Son schema est documente ci-dessus, reconstitue depuis le code applicatif.
