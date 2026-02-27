/**
 * Migration: Add user_id column to all application tables for multi-user support.
 *
 * - Adds user_id TEXT (nullable) to each table
 * - Sets existing rows to 'unclaimed' (Amara's data, to be claimed in Phase 4)
 * - Sets NOT NULL constraint
 * - Creates indexes (UNIQUE for settings, regular for others)
 *
 * Usage: node scripts/migrate-auth.mjs
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

async function migrateTable(table, uniqueIndex = false) {
  console.log(`  📦 ${table}...`);

  // 1. Add column (nullable first) — DDL uses query() for dynamic table names
  await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id TEXT`);

  // 2. Fill existing rows
  await sql.query(`UPDATE ${table} SET user_id = 'unclaimed' WHERE user_id IS NULL`);

  // 3. Set NOT NULL
  await sql.query(`ALTER TABLE ${table} ALTER COLUMN user_id SET NOT NULL`);

  // 4. Create index
  if (uniqueIndex) {
    await sql.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
    console.log(`     → UNIQUE index created`);
  } else {
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
    console.log(`     → Index created`);
  }

  console.log(`  ✅ ${table} done`);
}

async function migrate() {
  console.log('🔄 Adding user_id column to all application tables...\n');

  await migrateTable('sections');
  await migrateTable('cards');
  await migrateTable('expenses');
  await migrateTable('incomes');
  await migrateTable('settings', true); // UNIQUE — one settings row per user
  await migrateTable('monthly_expenses');
  await migrateTable('monthly_incomes');
  await migrateTable('savings_contributions');
  await migrateTable('push_subscriptions');
  await migrateTable('notification_log');

  // Verify
  console.log('\n🔍 Verification...');
  const check = await sql`SELECT user_id FROM sections LIMIT 1`;
  if (check.length > 0) {
    console.log(`  sections.user_id = '${check[0].user_id}' ✅`);
  } else {
    console.log('  (no rows in sections)');
  }

  console.log('\n✅ Migration complete! All tables now have user_id column.');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
