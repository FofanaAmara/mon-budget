-- Additive only. Existing writers keep working until the controlled cutover.
CREATE TABLE financial_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL CHECK (name = btrim(name) AND char_length(name) > 0),
  created_by text NOT NULL CHECK (btrim(created_by) <> ''),
  creation_key uuid NOT NULL,
  creation_fingerprint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, creation_key)
);

-- No owner/admin role: every membership grants the same capabilities.
CREATE TABLE space_memberships (
  space_id uuid NOT NULL REFERENCES financial_spaces(id),
  user_id text NOT NULL CHECK (btrim(user_id) <> ''),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (space_id, user_id)
);
CREATE INDEX space_memberships_user_idx ON space_memberships (user_id, joined_at, space_id);

-- Display cache only. Auth/session remains the identity and verification authority.
CREATE TABLE user_display_profiles (
  user_id text PRIMARY KEY,
  display_name text,
  email text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE legacy_user_space_map (
  user_id text PRIMARY KEY,
  space_id uuid NOT NULL UNIQUE,
  migrated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (space_id, user_id) REFERENCES space_memberships(space_id, user_id)
);

CREATE TABLE user_space_preferences (
  user_id text PRIMARY KEY,
  last_space_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (last_space_id, user_id) REFERENCES space_memberships(space_id, user_id)
);

CREATE TABLE space_settings (
  space_id uuid PRIMARY KEY REFERENCES financial_spaces(id),
  default_currency varchar(3) DEFAULT 'CAD',
  default_reminder_offsets integer[] DEFAULT ARRAY[1,3,7],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE space_setup_guide (
  space_id uuid PRIMARY KEY REFERENCES financial_spaces(id),
  completed_at timestamptz,
  dismissed_at timestamptz,
  reset_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- The app must refuse finance access until the globally converted code is ready.
CREATE TABLE financial_space_rollout (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  phase text NOT NULL CHECK (phase IN ('expanded', 'backfilled', 'ready')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO financial_space_rollout (phase) VALUES ('expanded');

DO $migration$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'sections', 'cards', 'incomes', 'expenses', 'debts',
    'monthly_expenses', 'monthly_incomes', 'income_allocations', 'monthly_allocations',
    'savings_contributions', 'debt_transactions', 'expense_transactions', 'allocation_sections',
    'notification_log'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN space_id uuid', table_name);
  END LOOP;
END
$migration$;

ALTER TABLE expenses ADD COLUMN system_kind text
  CHECK (system_kind IS NULL OR (system_kind = 'FREE_SAVINGS' AND type = 'PLANNED'));
