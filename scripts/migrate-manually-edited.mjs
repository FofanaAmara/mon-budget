import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('Running manually_edited migration...');

  await sql`ALTER TABLE monthly_incomes ADD COLUMN IF NOT EXISTS manually_edited BOOLEAN DEFAULT FALSE`;
  console.log('Column manually_edited added to monthly_incomes (or already exists)');

  const count = await sql`SELECT COUNT(*) as c FROM monthly_incomes WHERE manually_edited = true`;
  console.log(`Migration complete — ${count[0].c} monthly_incomes with manually_edited = true`);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
