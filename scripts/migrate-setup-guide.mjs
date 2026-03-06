/**
 * Migration: Create setup_guide table for onboarding guide state.
 *
 * - CREATE TABLE setup_guide (user_id PK, completed_at, dismissed_at, reset_at, created_at)
 *
 * No backfill needed — existing users without a row are handled by the
 * visibility logic (all 4 steps complete + no row = existing user, guide hidden).
 *
 * Usage: node scripts/migrate-setup-guide.mjs
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
  console.log('Creating setup_guide table...');
  await sql`
    CREATE TABLE IF NOT EXISTS setup_guide (
      user_id TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ,
      dismissed_at TIMESTAMPTZ,
      reset_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('Table setup_guide created');

  console.log('Migration complete');
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
