import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('🔄 Running auto-deposit migration...');

  await sql`ALTER TABLE incomes ADD COLUMN IF NOT EXISTS auto_deposit BOOLEAN DEFAULT FALSE`;
  console.log('✅ Column auto_deposit added to incomes (or already exists)');

  await sql`ALTER TABLE monthly_incomes ADD COLUMN IF NOT EXISTS is_auto_deposited BOOLEAN DEFAULT FALSE`;
  console.log('✅ Column is_auto_deposited added to monthly_incomes (or already exists)');

  const incCount = await sql`SELECT COUNT(*) as c FROM incomes WHERE auto_deposit = true`;
  const miCount = await sql`SELECT COUNT(*) as c FROM monthly_incomes WHERE is_auto_deposited = true`;
  console.log(`✅ Migration complete — ${incCount[0].c} incomes with auto_deposit, ${miCount[0].c} monthly_incomes with is_auto_deposited`);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
