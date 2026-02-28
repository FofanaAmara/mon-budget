import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('🔄 Running biweekly anchor migration...');

  await sql`ALTER TABLE incomes ADD COLUMN IF NOT EXISTS pay_anchor_date DATE`;
  console.log('✅ Column pay_anchor_date added to incomes (or already exists)');

  const count = await sql`SELECT COUNT(*) as c FROM incomes WHERE pay_anchor_date IS NOT NULL`;
  console.log(`✅ Migration complete — ${count[0].c} incomes have a pay_anchor_date`);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
