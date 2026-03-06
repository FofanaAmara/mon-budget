/**
 * Migration: Add progressive expense support.
 *
 * - ADD is_progressive BOOLEAN DEFAULT FALSE on expenses (template flag)
 * - ADD paid_amount DECIMAL(10,2) DEFAULT 0 on monthly_expenses (partial payment tracking)
 * - CREATE expense_transactions table (sub-transaction history)
 * - CREATE index idx_expense_tx_monthly(monthly_expense_id, created_at DESC)
 *
 * No backfill needed — defaults cover existing rows.
 *
 * Usage: node scripts/migrate-progressive-expenses.mjs
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
  console.log('📦 Adding is_progressive column to expenses...');
  await sql`
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS is_progressive BOOLEAN DEFAULT FALSE
  `;
  console.log('✅ expenses.is_progressive added');

  console.log('📦 Adding paid_amount column to monthly_expenses...');
  await sql`
    ALTER TABLE monthly_expenses
    ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0
  `;
  console.log('✅ monthly_expenses.paid_amount added');

  console.log('📦 Creating expense_transactions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS expense_transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      monthly_expense_id UUID NOT NULL REFERENCES monthly_expenses(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ Table expense_transactions created');

  console.log('📦 Creating index idx_expense_tx_monthly...');
  await sql`
    CREATE INDEX IF NOT EXISTS idx_expense_tx_monthly
    ON expense_transactions(monthly_expense_id, created_at DESC)
  `;
  console.log('✅ Index idx_expense_tx_monthly created');

  console.log('✅ Migration terminée');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
