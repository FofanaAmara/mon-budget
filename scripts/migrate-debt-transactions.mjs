/**
 * Migration: Create debt_transactions table + backfill from paid monthly_expenses.
 *
 * Usage: node scripts/migrate-debt-transactions.mjs
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
  console.log('📦 Creating debt_transactions table...');

  await sql`
    CREATE TABLE IF NOT EXISTS debt_transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('PAYMENT', 'CHARGE')),
      amount DECIMAL(10, 2) NOT NULL,
      month VARCHAR(7) NOT NULL,
      note TEXT,
      source VARCHAR(20) DEFAULT 'MANUAL',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_debt_tx_month ON debt_transactions(user_id, month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_debt_tx_debt ON debt_transactions(debt_id, created_at DESC)`;

  console.log('✅ Table debt_transactions created');

  // Backfill: scan paid monthly_expenses linked to a debt
  console.log('📦 Backfilling PAYMENT transactions from monthly_expenses...');

  const paidDebtExpenses = await sql`
    SELECT user_id, debt_id, amount, month
    FROM monthly_expenses
    WHERE debt_id IS NOT NULL AND status = 'PAID'
  `;

  let backfilled = 0;
  for (const row of paidDebtExpenses) {
    // Insert only if not already backfilled (idempotent)
    const existing = await sql`
      SELECT 1 FROM debt_transactions
      WHERE debt_id = ${row.debt_id} AND month = ${row.month} AND source = 'MONTHLY_EXPENSE'
      LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO debt_transactions (user_id, debt_id, type, amount, month, note, source)
        VALUES (${row.user_id}, ${row.debt_id}, 'PAYMENT', ${row.amount}, ${row.month}, 'Versement mensuel (backfill)', 'MONTHLY_EXPENSE')
      `;
      backfilled++;
    }
  }

  console.log(`✅ Backfilled ${backfilled} PAYMENT transactions`);
  console.log('✅ Migration terminée');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
