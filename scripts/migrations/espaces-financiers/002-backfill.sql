-- Repeatable while old writers are frozen for the final pass. Never overwrite
-- an existing attribution. The runner and this file use one transaction.
LOCK TABLE sections, cards, incomes, expenses, debts, monthly_expenses,
  monthly_incomes, income_allocations, monthly_allocations, savings_contributions,
  debt_transactions, expense_transactions, allocation_sections, settings,
  setup_guide, notification_log IN SHARE ROW EXCLUSIVE MODE;

DO $migration$
DECLARE table_name text; ambiguous boolean;
BEGIN
  IF (SELECT phase FROM financial_space_rollout WHERE singleton) = 'ready' THEN
    RAISE EXCEPTION 'Backfill is forbidden after shared writes are enabled';
  END IF;
  FOREACH table_name IN ARRAY ARRAY[
    'sections', 'cards', 'incomes', 'expenses', 'debts',
    'monthly_expenses', 'monthly_incomes', 'income_allocations', 'monthly_allocations',
    'savings_contributions', 'debt_transactions', 'expense_transactions', 'settings', 'setup_guide'
  ] LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE user_id IS NULL OR btrim(user_id) IN ('''', ''unclaimed'', ''default''))', table_name) INTO ambiguous;
    IF ambiguous THEN RAISE EXCEPTION 'Ambiguous historical ownership in %; explicit mapping required', table_name; END IF;
  END LOOP;
END
$migration$;

CREATE TEMP TABLE migration_space_owners (user_id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO migration_space_owners
  SELECT user_id FROM sections UNION SELECT user_id FROM cards
  UNION SELECT user_id FROM incomes UNION SELECT user_id FROM expenses
  UNION SELECT user_id FROM debts UNION SELECT user_id FROM monthly_expenses
  UNION SELECT user_id FROM monthly_incomes UNION SELECT user_id FROM income_allocations
  UNION SELECT user_id FROM monthly_allocations UNION SELECT user_id FROM savings_contributions
  UNION SELECT user_id FROM debt_transactions UNION SELECT user_id FROM expense_transactions
  UNION SELECT user_id FROM settings UNION SELECT user_id FROM setup_guide;

WITH spaces AS (
  INSERT INTO financial_spaces (name, created_by, creation_key, creation_fingerprint)
    SELECT 'Mes finances', o.user_id, gen_random_uuid(), 'legacy-backfill-v1'
    FROM migration_space_owners o
    WHERE NOT EXISTS (SELECT 1 FROM legacy_user_space_map m WHERE m.user_id=o.user_id)
    RETURNING id, created_by
), members AS (
  INSERT INTO space_memberships (space_id, user_id)
    SELECT id, created_by FROM spaces RETURNING space_id, user_id
)
INSERT INTO legacy_user_space_map (user_id, space_id)
  SELECT user_id, space_id FROM members;

INSERT INTO user_space_preferences (user_id, last_space_id)
  SELECT user_id, space_id FROM legacy_user_space_map ON CONFLICT (user_id) DO NOTHING;

INSERT INTO space_settings (space_id, default_currency, default_reminder_offsets, created_at, updated_at)
  SELECT m.space_id,
    CASE WHEN s.id IS NULL THEN 'CAD' ELSE s.default_currency END,
    CASE WHEN s.id IS NULL THEN ARRAY[1,3,7] ELSE s.default_reminder_offsets END,
    CASE WHEN s.id IS NULL THEN now() ELSE s.created_at END,
    CASE WHEN s.id IS NULL THEN now() ELSE s.updated_at END
  FROM legacy_user_space_map m LEFT JOIN settings s ON s.user_id=m.user_id
  ON CONFLICT (space_id) DO UPDATE SET
    default_currency=EXCLUDED.default_currency,
    default_reminder_offsets=EXCLUDED.default_reminder_offsets,
    created_at=EXCLUDED.created_at, updated_at=EXCLUDED.updated_at;

-- Preserve both existing guide state and absence of a historical guide.
INSERT INTO space_setup_guide (space_id, completed_at, dismissed_at, reset_at, created_at)
  SELECT m.space_id, g.completed_at, g.dismissed_at, g.reset_at, g.created_at
  FROM legacy_user_space_map m JOIN setup_guide g ON g.user_id=m.user_id
  ON CONFLICT (space_id) DO UPDATE SET
    completed_at=EXCLUDED.completed_at, dismissed_at=EXCLUDED.dismissed_at,
    reset_at=EXCLUDED.reset_at, created_at=EXCLUDED.created_at;
DELETE FROM space_setup_guide p USING legacy_user_space_map m
  WHERE p.space_id=m.space_id AND NOT EXISTS (SELECT 1 FROM setup_guide g WHERE g.user_id=m.user_id);

DO $migration$
DECLARE table_name text; conflict boolean;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'sections', 'cards', 'incomes', 'expenses', 'debts',
    'monthly_expenses', 'monthly_incomes', 'income_allocations', 'monthly_allocations',
    'savings_contributions', 'debt_transactions', 'expense_transactions'
  ] LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I r JOIN legacy_user_space_map m ON m.user_id=r.user_id WHERE r.space_id IS NOT NULL AND r.space_id<>m.space_id)', table_name) INTO conflict;
    IF conflict THEN RAISE EXCEPTION 'Conflicting historical attribution in %', table_name; END IF;
    EXECUTE format('UPDATE %I r SET space_id=m.space_id FROM legacy_user_space_map m WHERE r.user_id=m.user_id AND r.space_id IS NULL', table_name);
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM allocation_sections j
    JOIN income_allocations a ON a.id=j.allocation_id JOIN sections s ON s.id=j.section_id
    WHERE a.space_id IS DISTINCT FROM s.space_id
      OR (j.space_id IS NOT NULL AND j.space_id IS DISTINCT FROM a.space_id)
  ) THEN RAISE EXCEPTION 'Conflicting historical ownership in allocation_sections'; END IF;
END
$migration$;

UPDATE allocation_sections j SET space_id=a.space_id
  FROM income_allocations a WHERE a.id=j.allocation_id AND j.space_id IS NULL;

UPDATE notification_log n SET space_id=e.space_id
  FROM expenses e WHERE e.id=n.expense_id AND n.space_id IS NULL;

DO $migration$
DECLARE relation record; conflict boolean;
BEGIN
  FOR relation IN SELECT * FROM (VALUES
    ('expenses', 'section_id', 'sections'), ('expenses', 'card_id', 'cards'),
    ('debts', 'section_id', 'sections'), ('debts', 'card_id', 'cards'),
    ('monthly_expenses', 'expense_id', 'expenses'), ('monthly_expenses', 'debt_id', 'debts'),
    ('monthly_expenses', 'section_id', 'sections'), ('monthly_expenses', 'card_id', 'cards'),
    ('monthly_incomes', 'income_id', 'incomes'),
    ('income_allocations', 'section_id', 'sections'), ('income_allocations', 'project_id', 'expenses'),
    ('monthly_allocations', 'allocation_id', 'income_allocations'),
    ('savings_contributions', 'expense_id', 'expenses'), ('debt_transactions', 'debt_id', 'debts'),
    ('expense_transactions', 'monthly_expense_id', 'monthly_expenses'),
    ('notification_log', 'expense_id', 'expenses')
  ) AS refs(child, column_name, parent) LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I c JOIN %I p ON c.%I=p.id WHERE c.space_id IS DISTINCT FROM p.space_id)', relation.child, relation.parent, relation.column_name) INTO conflict;
    IF conflict THEN RAISE EXCEPTION 'Cross-owner historical relation: %.%', relation.child, relation.column_name; END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM expenses WHERE type='PLANNED' AND name='Épargne libre' AND is_active=true GROUP BY space_id HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Duplicate historical free savings; explicit resolution required';
  END IF;
END
$migration$;

UPDATE expenses SET system_kind='FREE_SAVINGS'
  WHERE type='PLANNED' AND name='Épargne libre' AND is_active=true AND system_kind IS NULL;

UPDATE financial_space_rollout SET phase='backfilled', updated_at=now() WHERE singleton;
