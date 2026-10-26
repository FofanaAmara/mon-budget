-- The application schema allows VARIABLE incomes without a fixed amount.
-- Match that contract without changing any existing value or relationship.
ALTER TABLE incomes ALTER COLUMN amount DROP NOT NULL;
ALTER TABLE incomes ADD CONSTRAINT incomes_fixed_positive_amount
  CHECK (frequency='VARIABLE' OR (amount IS NOT NULL AND amount>0));
