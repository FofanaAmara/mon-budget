-- Apply only with the converted app ready and old writers stopped. The runner
-- reruns backfill in this SAME transaction before enforcing these invariants.
DO $migration$
DECLARE table_name text; relation record; action text; constraint_name text;
BEGIN
  IF (SELECT phase FROM financial_space_rollout WHERE singleton) <> 'backfilled' THEN
    RAISE EXCEPTION 'Isolation cutover requires completed backfill';
  END IF;
  FOREACH table_name IN ARRAY ARRAY[
    'sections', 'cards', 'incomes', 'expenses', 'debts', 'monthly_expenses',
    'monthly_incomes', 'income_allocations', 'monthly_allocations',
    'savings_contributions', 'debt_transactions', 'expense_transactions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN space_id SET NOT NULL', table_name);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I UNIQUE (space_id,id)', table_name, table_name || '_space_id_id_key');
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (space_id) REFERENCES financial_spaces(id) NOT VALID', table_name, table_name || '_space_fkey');
    EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', table_name, table_name || '_space_fkey');
  END LOOP;
  ALTER TABLE allocation_sections ALTER COLUMN space_id SET NOT NULL;
  ALTER TABLE allocation_sections ADD CONSTRAINT allocation_sections_space_fkey FOREIGN KEY (space_id) REFERENCES financial_spaces(id);
  ALTER TABLE notification_log ADD CONSTRAINT notification_log_space_fkey FOREIGN KEY (space_id) REFERENCES financial_spaces(id);
  ALTER TABLE notification_log ADD CONSTRAINT notification_log_financial_space_check CHECK (expense_id IS NULL OR space_id IS NOT NULL);

  FOR relation IN SELECT * FROM (VALUES
    ('expenses','section_id','sections','SET NULL'), ('expenses','card_id','cards','SET NULL'),
    ('debts','section_id','sections','SET NULL'), ('debts','card_id','cards','SET NULL'),
    ('monthly_expenses','expense_id','expenses','SET NULL'), ('monthly_expenses','debt_id','debts','SET NULL'),
    ('monthly_expenses','section_id','sections','SET NULL'), ('monthly_expenses','card_id','cards','SET NULL'),
    ('monthly_incomes','income_id','incomes','CASCADE'),
    ('income_allocations','section_id','sections','SET NULL'), ('income_allocations','project_id','expenses','SET NULL'),
    ('monthly_allocations','allocation_id','income_allocations','CASCADE'),
    ('savings_contributions','expense_id','expenses','CASCADE'),
    ('debt_transactions','debt_id','debts','CASCADE'),
    ('expense_transactions','monthly_expense_id','monthly_expenses','CASCADE'),
    ('allocation_sections','allocation_id','income_allocations','CASCADE'),
    ('allocation_sections','section_id','sections','CASCADE'),
    ('notification_log','expense_id','expenses','CASCADE')
  ) AS refs(child, column_name, parent, delete_action) LOOP
    constraint_name := relation.child || '_' || relation.column_name || '_fkey';
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', relation.child, constraint_name);
    action := CASE WHEN relation.delete_action='SET NULL'
      THEN format('SET NULL (%I)', relation.column_name) ELSE 'CASCADE' END;
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (space_id,%I) REFERENCES %I(space_id,id) ON DELETE %s NOT VALID',
      relation.child, constraint_name, relation.column_name, relation.parent, action);
    EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', relation.child, constraint_name);
    EXECUTE format('CREATE INDEX %I ON %I (space_id,%I)', relation.child || '_' || relation.column_name || '_space_idx', relation.child, relation.column_name);
  END LOOP;
END
$migration$;

CREATE UNIQUE INDEX expenses_free_savings_space_key ON expenses(space_id) WHERE system_kind='FREE_SAVINGS';
CREATE INDEX monthly_expenses_space_month_idx ON monthly_expenses(space_id,month);
CREATE INDEX monthly_incomes_space_month_idx ON monthly_incomes(space_id,month);
CREATE INDEX monthly_allocations_space_month_idx ON monthly_allocations(space_id,month);
CREATE INDEX debt_transactions_space_month_idx ON debt_transactions(space_id,month);

UPDATE financial_space_rollout SET phase='ready', updated_at=now() WHERE singleton;
