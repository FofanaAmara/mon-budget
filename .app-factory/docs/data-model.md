# Data Model — Mes Finances

## Base de donnees

PostgreSQL heberge sur **Neon** (serverless). Connexion via `@neondatabase/serverless`.

## Tables

### sections
Categories de depenses personnalisables.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| name | VARCHAR(100) | Nom de la section |
| icon | VARCHAR(10) | Emoji |
| color | VARCHAR(7) | Couleur hex |
| position | INTEGER | Ordre d'affichage |

### cards
Cartes bancaires de l'utilisateur.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| name | VARCHAR(100) | |
| last_four | VARCHAR(4) | 4 derniers chiffres |
| bank | VARCHAR(100) | |
| color | VARCHAR(7) | |

### expenses (Templates de charges)
Definition des charges fixes et ponctuelles.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| name | VARCHAR(200) | |
| amount | DECIMAL(10,2) | |
| currency | VARCHAR(3) | Default 'CAD' |
| type | VARCHAR(20) | RECURRING, ONE_TIME, PLANNED |
| section_id | UUID (FK sections) | |
| card_id | UUID (FK cards) | |
| recurrence_frequency | VARCHAR(20) | WEEKLY, BIWEEKLY, MONTHLY, BIMONTHLY, QUARTERLY, YEARLY |
| recurrence_day | INTEGER | 1-31, jour de paiement |
| auto_debit | BOOLEAN | Prelevement automatique |
| due_date | DATE | |
| next_due_date | DATE | |
| reminder_offsets | INTEGER[] | Jours avant echeance |
| is_active | BOOLEAN | |
| target_amount | DECIMAL | Pour PLANNED (epargne) |
| target_date | DATE | Pour PLANNED |
| saved_amount | DECIMAL | Pour PLANNED |

### monthly_expenses (Transactions mensuelles)
Instances generees automatiquement depuis les templates.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| expense_id | UUID (FK expenses) | Template source (null pour ad-hoc) |
| debt_id | UUID (FK debts) | Si lie a une dette |
| month | VARCHAR | "YYYY-MM" |
| name | VARCHAR(200) | |
| amount | DECIMAL(10,2) | |
| due_date | DATE | Date d'echeance |
| status | VARCHAR | UPCOMING, PAID, OVERDUE, DEFERRED |
| paid_at | DATE | Date de paiement |
| section_id | UUID | |
| card_id | UUID | |
| is_auto_charged | BOOLEAN | |
| is_planned | BOOLEAN | Distingue prevu vs ad-hoc |

### incomes (Templates de revenus)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| name | VARCHAR(200) | |
| source | VARCHAR(20) | EMPLOYMENT, BUSINESS, INVESTMENT, OTHER |
| amount | DECIMAL | null si VARIABLE |
| estimated_amount | DECIMAL | Estimation mensuelle si VARIABLE |
| frequency | VARCHAR(20) | MONTHLY, BIWEEKLY, YEARLY, VARIABLE |
| pay_anchor_date | DATE | Date d'ancrage pour calcul biweekly |
| auto_deposit | BOOLEAN | |
| is_active | BOOLEAN | |

### monthly_incomes (Transactions mensuelles revenus)

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| income_id | UUID (FK incomes) | |
| month | VARCHAR | "YYYY-MM" |
| expected_amount | DECIMAL | |
| actual_amount | DECIMAL | |
| status | VARCHAR | EXPECTED, RECEIVED, PARTIAL, MISSED |
| received_at | DATE | |
| is_auto_deposited | BOOLEAN | |

### debts

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| user_id | TEXT | |
| name | VARCHAR | |
| original_amount | DECIMAL | |
| remaining_balance | DECIMAL | |
| interest_rate | DECIMAL | |
| payment_amount | DECIMAL | |
| payment_frequency | VARCHAR | |
| payment_day | INTEGER | |

### debt_transactions

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID (PK) | |
| debt_id | UUID (FK debts) | |
| type | VARCHAR | PAYMENT, CHARGE |
| amount | DECIMAL | |
| month | VARCHAR | |

### income_allocations
Allocation des revenus aux sections.

### monthly_allocations
Instances mensuelles des allocations.

### savings_contributions
Contributions aux projets d'epargne.

### settings (singleton par user)

| Colonne | Type | Description |
|---------|------|-------------|
| user_id | TEXT (UNIQUE) | |
| default_currency | VARCHAR(3) | CAD |
| default_reminder_offsets | INTEGER[] | {1, 3, 7} |
| notify_push/email/sms | BOOLEAN | |

### push_subscriptions / notification_log
Tables support pour les notifications Web Push.

## Migrations

Les migrations sont des scripts Node.js dans `scripts/` executes manuellement :
- Pas d'outil de migration (pas Prisma, pas Drizzle)
- Chaque script est un fichier `migrate-*.mjs` autonome
- Execution : `node scripts/migrate-xxx.mjs`
- Schema de reference : `supabase/schema.sql` (desync — ne reflete que le MVP initial)

**Gap identifie** : Le schema SQL dans `supabase/schema.sql` ne reflete pas l'etat actuel de la DB (manque ~10 migrations). Pas de source de verite unique pour le schema.
