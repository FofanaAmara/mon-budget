-- Keep the actual debt balance delta for reversible NEW monthly payments.
-- Historical PAID rows have no reliable delta: never infer or rewrite their money.
-- Preserve existing inactive debts; only newly paid-off debts may auto-reopen.
ALTER TABLE debts ADD COLUMN reactivation_allowed boolean NOT NULL DEFAULT true;
UPDATE debts SET reactivation_allowed=false WHERE NOT is_active;
ALTER TABLE monthly_expenses ADD COLUMN debt_paid_amount numeric(10,2) DEFAULT 0
  CHECK (debt_paid_amount >= 0);
UPDATE monthly_expenses SET debt_paid_amount=NULL WHERE debt_id IS NOT NULL AND status='PAID';
ALTER TABLE monthly_expenses ADD COLUMN manually_edited boolean NOT NULL DEFAULT false;
ALTER TABLE monthly_expenses ADD COLUMN is_progressive boolean NOT NULL DEFAULT false;
UPDATE monthly_expenses me SET is_progressive=e.is_progressive FROM expenses e
  WHERE me.expense_id=e.id AND me.space_id=e.space_id;
ALTER TABLE monthly_expenses ADD COLUMN deferred_from_id uuid;
ALTER TABLE monthly_expenses ADD COLUMN deferred_to_month text;
ALTER TABLE monthly_expenses ADD CONSTRAINT monthly_expenses_deferred_source_space_fk
  FOREIGN KEY(space_id,deferred_from_id) REFERENCES monthly_expenses(space_id,id) ON DELETE SET NULL(deferred_from_id);
CREATE UNIQUE INDEX monthly_expenses_deferred_source_key ON monthly_expenses(space_id,deferred_from_id) WHERE deferred_from_id IS NOT NULL;

-- Pure schedule functions let generators calculate from locked current rows.
CREATE FUNCTION public.space_finance_due_date(p_frequency text,p_day integer,p_next date,p_month text)
RETURNS date LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path=pg_catalog AS $$
  WITH bounds AS (SELECT (p_month||'-01')::date AS start), parts AS (
    SELECT start,extract(year FROM start)::integer AS yr,extract(month FROM start)::integer AS mon,
      extract(day FROM start+interval '1 month'-interval '1 day')::integer AS last_day FROM bounds
  ) SELECT CASE
    WHEN p_next>=start AND p_next<start+interval '1 month' THEN p_next
    WHEN p_day>0 AND p_frequency IN ('MONTHLY','BIMONTHLY','QUARTERLY','YEARLY') AND (
      p_frequency='MONTHLY' OR p_next IS NULL
      OR (p_frequency='BIMONTHLY' AND ((yr-extract(year FROM p_next)::integer)*12+mon-extract(month FROM p_next)::integer)%2=0)
      OR (p_frequency='QUARTERLY' AND (mon-extract(month FROM p_next)::integer)%3=0)
      OR (p_frequency='YEARLY' AND mon=extract(month FROM p_next)::integer)
    ) THEN make_date(yr,mon,LEAST(p_day,last_day))
    WHEN p_frequency IN ('WEEKLY','BIWEEKLY') THEN start
    ELSE NULL END FROM parts
$$;

CREATE FUNCTION public.space_finance_monthly_amount(p_amount numeric,p_frequency text,p_spread boolean)
RETURNS numeric LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path=pg_catalog AS $$
  SELECT round(CASE
    WHEN p_frequency='QUARTERLY' AND p_spread THEN p_amount/3
    WHEN p_frequency='YEARLY' AND p_spread THEN p_amount/12
    WHEN p_frequency='WEEKLY' THEN p_amount*52/12
    WHEN p_frequency='BIWEEKLY' THEN p_amount*26/12
    WHEN p_frequency='BIMONTHLY' THEN p_amount/2
    ELSE p_amount END,2)
$$;
