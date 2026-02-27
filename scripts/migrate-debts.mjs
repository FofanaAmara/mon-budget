/**
 * Migration: Create debts table and add debt_id to monthly_expenses.
 *
 * Usage: node scripts/migrate-debts.mjs
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function migrate() {
  console.log('📦 Creating debts table...');

  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS debts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id TEXT NOT NULL,
      name VARCHAR(200) NOT NULL,
      original_amount DECIMAL(12, 2) NOT NULL,
      remaining_balance DECIMAL(12, 2) NOT NULL,
      interest_rate DECIMAL(5, 2) DEFAULT NULL,
      payment_amount DECIMAL(10, 2) NOT NULL,
      payment_frequency VARCHAR(20) NOT NULL
        CHECK (payment_frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','YEARLY')),
      payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),
      auto_debit BOOLEAN DEFAULT FALSE,
      card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id)`;

  console.log('✅ Table debts created');

  console.log('📦 Adding debt_id column to monthly_expenses...');

  // Add debt_id column (idempotent — IF NOT EXISTS handled by DO block)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'monthly_expenses' AND column_name = 'debt_id'
      ) THEN
        ALTER TABLE monthly_expenses
          ADD COLUMN debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;
      END IF;
    END $$
  `;

  // Unique index: one monthly_expense per debt per month
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_debt_month
    ON monthly_expenses(debt_id, month) WHERE debt_id IS NOT NULL
  `;

  console.log('✅ debt_id column added to monthly_expenses');
  console.log('✅ Migration terminée');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
