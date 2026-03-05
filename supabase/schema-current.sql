-- Mes Finances -- Schema PostgreSQL complet (Neon)
-- Reconstitue depuis supabase/schema.sql (MVP) + 15 scripts de migration
-- Derniere mise a jour : 2026-03-05
--
-- NOTE: La table monthly_incomes a ete creee directement dans la DB Neon
-- (aucun script de migration n'existe pour sa creation initiale).

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE income_frequency AS ENUM ('MONTHLY', 'BIWEEKLY', 'YEARLY');

-- ============================================================
-- TABLE: sections
-- Categories de depenses personnalisables.
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  icon       VARCHAR(10) DEFAULT '📁',
  color      VARCHAR(7) DEFAULT '#3B82F6',
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_user_id ON sections(user_id);

-- ============================================================
-- TABLE: cards
-- Cartes bancaires de l'utilisateur.
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  name       VARCHAR(100) NOT NULL,
  last_four  VARCHAR(4),
  bank       VARCHAR(100),
  color      VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- ============================================================
-- TABLE: expenses
-- Templates de charges fixes, ponctuelles et projets d'epargne.
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  name       VARCHAR(200) NOT NULL,
  amount     DECIMAL(10, 2) NOT NULL,
  currency   VARCHAR(3) DEFAULT 'CAD',
  type       VARCHAR(20) NOT NULL CHECK (type IN ('RECURRING', 'ONE_TIME', 'PLANNED')),
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  card_id    UUID REFERENCES cards(id) ON DELETE SET NULL,

  -- Recurrence
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY')),
  recurrence_day       INTEGER CHECK (recurrence_day BETWEEN 1 AND 31),
  auto_debit           BOOLEAN DEFAULT FALSE,

  -- Spread monthly: pour QUARTERLY/YEARLY, genere chaque mois avec montant / nb_periodes
  spread_monthly BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timing
  due_date      DATE,
  next_due_date DATE,

  -- Notification
  reminder_offsets INTEGER[] DEFAULT '{}',
  notify_push      BOOLEAN DEFAULT TRUE,
  notify_email     BOOLEAN DEFAULT FALSE,
  notify_sms       BOOLEAN DEFAULT FALSE,

  -- PLANNED (projets d'epargne)
  target_amount DECIMAL(10, 2),
  target_date   DATE,
  saved_amount  DECIMAL(10, 2) DEFAULT 0,

  -- Meta
  notes      TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_section_id ON expenses(section_id);
CREATE INDEX IF NOT EXISTS idx_expenses_card_id ON expenses(card_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_active ON expenses(user_id, is_active) WHERE is_active = true;

-- ============================================================
-- TABLE: monthly_expenses
-- Instances mensuelles generees depuis les templates (ou ad-hoc).
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL,
  expense_id      UUID REFERENCES expenses(id) ON DELETE SET NULL,
  debt_id         UUID,  -- FK ajoutee apres creation de debts (voir ci-dessous)
  month           VARCHAR(7) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  amount          DECIMAL(10, 2) NOT NULL,
  due_date        DATE NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'UPCOMING'
                    CHECK (status IN ('UPCOMING', 'PAID', 'OVERDUE', 'DEFERRED')),
  paid_at         DATE,
  section_id      UUID REFERENCES sections(id) ON DELETE SET NULL,
  card_id         UUID REFERENCES cards(id) ON DELETE SET NULL,
  is_auto_charged BOOLEAN DEFAULT FALSE,
  is_planned      BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_expense_month UNIQUE (expense_id, month)
);

CREATE INDEX IF NOT EXISTS idx_me_month ON monthly_expenses(month);
CREATE INDEX IF NOT EXISTS idx_me_month_status ON monthly_expenses(month, status);
CREATE INDEX IF NOT EXISTS idx_me_section ON monthly_expenses(section_id);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_user_id ON monthly_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_card_id ON monthly_expenses(card_id);
CREATE INDEX IF NOT EXISTS idx_me_user_month ON monthly_expenses(user_id, month);

-- ============================================================
-- TABLE: incomes
-- Templates de revenus (salaire, freelance, investissements...).
-- Colonnes source, estimated_amount, notes ajoutees hors migration.
-- ============================================================
CREATE TABLE IF NOT EXISTS incomes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  name             VARCHAR(255) NOT NULL,
  source           VARCHAR(20) CHECK (source IN ('EMPLOYMENT', 'BUSINESS', 'INVESTMENT', 'OTHER')),
  amount           DECIMAL(10, 2),          -- null si VARIABLE
  estimated_amount DECIMAL(10, 2),          -- estimation mensuelle si VARIABLE
  frequency        income_frequency NOT NULL DEFAULT 'MONTHLY',
  pay_anchor_date  DATE,                    -- date d'ancrage pour calcul biweekly
  auto_deposit     BOOLEAN DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);

-- ============================================================
-- TABLE: monthly_incomes
-- Instances mensuelles des revenus.
-- NOTE: Table creee directement en DB (aucun script de migration).
-- Schema reconstitue depuis le code applicatif (actions, seed).
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_incomes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,
  income_id         UUID REFERENCES incomes(id) ON DELETE CASCADE,
  month             VARCHAR(7) NOT NULL,
  expected_amount   DECIMAL(10, 2),
  actual_amount     DECIMAL(10, 2),
  status            VARCHAR(20) NOT NULL DEFAULT 'EXPECTED'
                      CHECK (status IN ('EXPECTED', 'RECEIVED', 'PARTIAL', 'MISSED')),
  received_at       DATE,
  is_auto_deposited BOOLEAN DEFAULT FALSE,
  manually_edited   BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_income_month UNIQUE (income_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_incomes_user_id ON monthly_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_mi_user_month ON monthly_incomes(user_id, month);

-- ============================================================
-- TABLE: debts
-- Suivi des dettes (prets, cartes de credit, etc.).
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           TEXT NOT NULL,
  name              VARCHAR(200) NOT NULL,
  original_amount   DECIMAL(12, 2) NOT NULL,
  remaining_balance DECIMAL(12, 2) NOT NULL,
  interest_rate     DECIMAL(5, 2) DEFAULT NULL,
  payment_amount    DECIMAL(10, 2) NOT NULL,
  payment_frequency VARCHAR(20) NOT NULL
                      CHECK (payment_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY')),
  payment_day       INTEGER CHECK (payment_day BETWEEN 1 AND 31),
  auto_debit        BOOLEAN DEFAULT FALSE,
  card_id           UUID REFERENCES cards(id) ON DELETE SET NULL,
  section_id        UUID REFERENCES sections(id) ON DELETE SET NULL,
  notes             TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);

-- FK de monthly_expenses.debt_id vers debts (ajoutee par migrate-debts.mjs)
ALTER TABLE monthly_expenses
  ADD CONSTRAINT monthly_expenses_debt_id_fkey
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_debt_month
  ON monthly_expenses(debt_id, month) WHERE debt_id IS NOT NULL;

-- ============================================================
-- TABLE: debt_transactions
-- Historique des paiements et charges sur les dettes.
-- ============================================================
CREATE TABLE IF NOT EXISTS debt_transactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT NOT NULL,
  debt_id    UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  type       VARCHAR(10) NOT NULL CHECK (type IN ('PAYMENT', 'CHARGE')),
  amount     DECIMAL(10, 2) NOT NULL,
  month      VARCHAR(7) NOT NULL,
  note       TEXT,
  source     VARCHAR(20) DEFAULT 'MANUAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_tx_month ON debt_transactions(user_id, month);
CREATE INDEX IF NOT EXISTS idx_debt_tx_debt ON debt_transactions(debt_id, created_at DESC);

-- ============================================================
-- TABLE: income_allocations
-- Allocation des revenus vers des sections ou projets d'epargne.
-- ============================================================
CREATE TABLE IF NOT EXISTS income_allocations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  label      TEXT NOT NULL,
  amount     NUMERIC(10, 2) NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  project_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  end_month  VARCHAR(7),
  color      VARCHAR(20) DEFAULT '#6B6966',
  position   INT DEFAULT 0,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_allocations_project_id ON income_allocations(project_id);

-- ============================================================
-- TABLE: allocation_sections
-- Table de jonction N:N entre income_allocations et sections.
-- ============================================================
CREATE TABLE IF NOT EXISTS allocation_sections (
  allocation_id UUID NOT NULL REFERENCES income_allocations(id) ON DELETE CASCADE,
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  PRIMARY KEY (allocation_id, section_id)
);

-- ============================================================
-- TABLE: monthly_allocations
-- Instances mensuelles des allocations de revenus.
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  allocation_id    UUID NOT NULL REFERENCES income_allocations(id) ON DELETE CASCADE,
  month            VARCHAR(7) NOT NULL,
  allocated_amount NUMERIC(10, 2) NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(allocation_id, month)
);

-- ============================================================
-- TABLE: savings_contributions
-- Contributions individuelles aux projets d'epargne (PLANNED expenses).
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_contributions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    TEXT NOT NULL,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  amount     DECIMAL(10, 2) NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_expense
  ON savings_contributions(expense_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_user_id
  ON savings_contributions(user_id);

-- ============================================================
-- TABLE: settings
-- Configuration utilisateur (singleton par user_id).
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  TEXT NOT NULL UNIQUE,
  default_currency         VARCHAR(3) DEFAULT 'CAD',
  default_reminder_offsets INTEGER[] DEFAULT '{1, 3, 7}',
  notify_push              BOOLEAN DEFAULT TRUE,
  notify_email             BOOLEAN DEFAULT FALSE,
  notify_sms               BOOLEAN DEFAULT FALSE,
  email                    VARCHAR(255) DEFAULT NULL,
  phone                    VARCHAR(50) DEFAULT NULL,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);

-- ============================================================
-- TABLE: push_subscriptions
-- Abonnements Web Push pour les notifications navigateur.
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  endpoint   TEXT UNIQUE NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ============================================================
-- TABLE: notification_log
-- Journal des notifications envoyees (push, email, sms).
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    TEXT NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  channel    VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  status     VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_expense_id ON notification_log(expense_id);
