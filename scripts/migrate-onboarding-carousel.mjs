/**
 * Migration: Create user_onboarding table to track carousel completion.
 *
 * - CREATE TABLE user_onboarding (user_id PK, has_seen_onboarding BOOLEAN)
 * - Backfill ALL existing users to has_seen_onboarding = true
 *   (existing users should NOT see the carousel — edge case in story)
 *
 * Existing users are detected by presence in any of the core tables
 * (incomes, expenses, sections, setup_guide). Since Neon Auth manages
 * users externally, there is no local users table to ALTER.
 *
 * Usage: node scripts/migrate-onboarding-carousel.mjs
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
  console.log('Creating user_onboarding table...');
  await sql`
    CREATE TABLE IF NOT EXISTS user_onboarding (
      user_id TEXT PRIMARY KEY,
      has_seen_onboarding BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('Table user_onboarding created');

  // Backfill: all existing users (found in any table) marked as "already seen"
  // so they never see the carousel. New users won't have a row, which means
  // has_seen_onboarding defaults to false when we INSERT on first visit.
  console.log('Backfilling existing users...');
  const result = await sql`
    INSERT INTO user_onboarding (user_id, has_seen_onboarding)
    SELECT DISTINCT user_id, true
    FROM (
      SELECT user_id FROM incomes WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM expenses WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM sections WHERE user_id IS NOT NULL
      UNION
      SELECT user_id FROM setup_guide
    ) AS existing_users
    ON CONFLICT (user_id) DO NOTHING
  `;
  console.log(`Backfilled ${result.length ?? 0} existing users`);

  console.log('Migration complete');
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
