/**
 * Migration: Add BIMONTHLY to recurrence_frequency CHECK constraint.
 *
 * Usage: node scripts/migrate-bimonthly.mjs
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
  console.log('🔄 Adding BIMONTHLY to recurrence_frequency...');

  // Drop existing CHECK constraints on expenses.recurrence_frequency
  const constraints = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'expenses'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%recurrence_frequency%'
  `;

  for (const c of constraints) {
    console.log(`   Dropping constraint: ${c.conname}`);
    await sql.query(`ALTER TABLE expenses DROP CONSTRAINT "${c.conname}"`);
  }

  // Add new constraint with BIMONTHLY
  await sql.query(`
    ALTER TABLE expenses ADD CONSTRAINT expenses_recurrence_frequency_check
    CHECK (recurrence_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'))
  `);
  console.log('   ✅ expenses.recurrence_frequency updated');

  // Same for debts.payment_frequency
  const debtConstraints = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'debts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%payment_frequency%'
  `;

  for (const c of debtConstraints) {
    console.log(`   Dropping constraint: ${c.conname}`);
    await sql.query(`ALTER TABLE debts DROP CONSTRAINT "${c.conname}"`);
  }

  await sql.query(`
    ALTER TABLE debts ADD CONSTRAINT debts_payment_frequency_check
    CHECK (payment_frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'))
  `);
  console.log('   ✅ debts.payment_frequency updated');

  console.log('\n✅ Migration BIMONTHLY terminée');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
