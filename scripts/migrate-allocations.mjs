import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('🔄 Running allocations migration...');

  await sql`
    CREATE TABLE IF NOT EXISTS income_allocations (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     TEXT NOT NULL,
      label       TEXT NOT NULL,
      amount      NUMERIC(10,2) NOT NULL,
      section_id  UUID REFERENCES sections(id) ON DELETE SET NULL,
      project_id  UUID REFERENCES expenses(id) ON DELETE SET NULL,
      end_month   VARCHAR(7),
      color       VARCHAR(20) DEFAULT '#6B6966',
      position    INT DEFAULT 0,
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ Table income_allocations created (or already exists)');

  await sql`
    CREATE TABLE IF NOT EXISTS monthly_allocations (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          TEXT NOT NULL,
      allocation_id    UUID NOT NULL REFERENCES income_allocations(id) ON DELETE CASCADE,
      month            VARCHAR(7) NOT NULL,
      allocated_amount NUMERIC(10,2) NOT NULL,
      notes            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(allocation_id, month)
    )
  `;
  console.log('✅ Table monthly_allocations created (or already exists)');

  const allocCount = await sql`SELECT COUNT(*) as c FROM income_allocations`;
  const monthlyCount = await sql`SELECT COUNT(*) as c FROM monthly_allocations`;
  console.log(`✅ Migration complete — ${allocCount[0].c} allocations, ${monthlyCount[0].c} monthly_allocations`);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
