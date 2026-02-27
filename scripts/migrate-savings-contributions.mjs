/**
 * Migration: Create savings_contributions table for tracking
 * individual contributions to projects and épargne libre.
 *
 * Usage: node scripts/migrate-savings-contributions.mjs
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
  console.log('📦 Creating savings_contributions table...');

  await sql`
    CREATE TABLE IF NOT EXISTS savings_contributions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_savings_contributions_expense
    ON savings_contributions(expense_id, created_at DESC)
  `;

  console.log('✅ Table savings_contributions created');

  // Backfill: for each PLANNED expense with saved_amount > 0,
  // create an initial contribution so history isn't empty.
  const planned = await sql`
    SELECT id, name, saved_amount FROM expenses
    WHERE type = 'PLANNED' AND is_active = true AND saved_amount > 0
  `;

  for (const p of planned) {
    const existing = await sql`
      SELECT COUNT(*) as count FROM savings_contributions WHERE expense_id = ${p.id}
    `;
    if (Number(existing[0].count) === 0) {
      await sql`
        INSERT INTO savings_contributions (expense_id, amount, note)
        VALUES (${p.id}, ${p.saved_amount}, 'Solde initial')
      `;
    }
  }

  console.log(`   → ${planned.length} contributions initiales créées`);
  console.log('✅ Migration terminée');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
