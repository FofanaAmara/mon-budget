-- Mon Budget — Schéma PostgreSQL (Neon)
-- Phase 1 MVP

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: sections
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '📁',
  color VARCHAR(7) DEFAULT '#3B82F6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: cards
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  last_four VARCHAR(4),
  bank VARCHAR(100),
  color VARCHAR(7) DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name VARCHAR(200) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  type VARCHAR(20) NOT NULL CHECK (type IN ('RECURRING', 'ONE_TIME', 'PLANNED')),
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,

  -- Recurring fields
  recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  recurrence_day INTEGER CHECK (recurrence_day BETWEEN 1 AND 31),
  auto_debit BOOLEAN DEFAULT FALSE,

  -- Timing
  due_date DATE,
  next_due_date DATE,

  -- Notification
  reminder_offsets INTEGER[] DEFAULT '{}',
  notify_push BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT FALSE,
  notify_sms BOOLEAN DEFAULT FALSE,

  -- Meta
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: settings (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  default_currency VARCHAR(3) DEFAULT 'CAD',
  default_reminder_offsets INTEGER[] DEFAULT '{1, 3, 7}',
  notify_push BOOLEAN DEFAULT TRUE,
  notify_email BOOLEAN DEFAULT FALSE,
  notify_sms BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: notification_log
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('push', 'email', 'sms')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

-- ============================================================
-- TABLE: push_subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED: 6 default sections
-- ============================================================
INSERT INTO sections (name, icon, color, position)
VALUES
  ('Maison',    '🏠', '#3B82F6', 0),
  ('Perso',     '👤', '#8B5CF6', 1),
  ('Famille',   '👨‍👩‍👧‍👦', '#EC4899', 2),
  ('Transport', '🚗', '#F59E0B', 3),
  ('Business',  '💼', '#10B981', 4),
  ('Projets',   '🎯', '#EF4444', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: settings singleton
-- ============================================================
INSERT INTO settings (default_currency, default_reminder_offsets, notify_push)
VALUES ('CAD', '{1, 3, 7}', TRUE)
ON CONFLICT DO NOTHING;
