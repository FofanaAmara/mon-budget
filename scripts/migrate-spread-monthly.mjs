/**
 * Migration: Add spread_monthly column to expenses table.
 *
 * When true on a QUARTERLY or YEARLY expense, the system generates
 * the expense every month with amount / period_count instead of
 * only in due months with the full amount.
 *
 * Usage: node scripts/migrate-spread-monthly.mjs
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('POSTGRES_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function migrate() {
  console.log('Adding spread_monthly column to expenses...');

  await sql`
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS spread_monthly BOOLEAN NOT NULL DEFAULT false
  `;

  console.log('  expenses.spread_monthly added (BOOLEAN NOT NULL DEFAULT false)');
  console.log('\nMigration spread_monthly terminee');
}

migrate().catch((e) => {
  console.error('Migration echouee:', e);
  process.exit(1);
});
