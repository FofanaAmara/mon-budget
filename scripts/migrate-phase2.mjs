import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('🔄 Running Phase 2 migration...');

  // Create income_frequency ENUM
  await sql`
    DO $$ BEGIN
      CREATE TYPE income_frequency AS ENUM ('MONTHLY', 'BIWEEKLY', 'YEARLY');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `;
  console.log('✅ ENUM income_frequency created (or already exists)');

  // Add PLANNED columns to expenses (they may not exist from Phase 1)
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS target_amount DECIMAL(10, 2)`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS target_date DATE`;
  await sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS saved_amount DECIMAL(10, 2) DEFAULT 0`;
  console.log('✅ PLANNED columns added to expenses (or already exist)');

  // Create incomes table
  await sql`
    CREATE TABLE IF NOT EXISTS incomes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      frequency income_frequency NOT NULL DEFAULT 'MONTHLY',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;
  console.log('✅ Table incomes created (or already exists)');

  // Verify
  const count = await sql`SELECT COUNT(*) as c FROM incomes`;
  console.log(`✅ Migration complete — incomes table has ${count[0].c} rows`);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
