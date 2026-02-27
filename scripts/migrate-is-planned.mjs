/**
 * Migration: Add is_planned column to monthly_expenses.
 *
 * - is_planned = true → charges fixes / dépenses prévues (count toward "attendu")
 * - is_planned = false → dépenses imprévues / adhoc (do NOT count toward "attendu")
 *
 * All existing rows are set to true (they were all generated from templates).
 *
 * Usage: node scripts/migrate-is-planned.mjs
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
  console.log('🔄 Adding is_planned column to monthly_expenses...');

  await sql`
    ALTER TABLE monthly_expenses
    ADD COLUMN IF NOT EXISTS is_planned BOOLEAN NOT NULL DEFAULT true
  `;

  console.log('✅ Column added (all existing rows default to true).');
  console.log('Done!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
