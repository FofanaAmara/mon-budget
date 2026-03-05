import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('Running AUDIT-008: FK indexes + composite indexes migration...\n');

  // FK indexes — PostgreSQL does NOT auto-create indexes on FK columns
  console.log('--- FK Indexes ---');

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_section_id ON expenses(section_id)`;
  console.log('Created idx_expenses_section_id');

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_card_id ON expenses(card_id)`;
  console.log('Created idx_expenses_card_id');

  await sql`CREATE INDEX IF NOT EXISTS idx_monthly_expenses_card_id ON monthly_expenses(card_id)`;
  console.log('Created idx_monthly_expenses_card_id');

  await sql`CREATE INDEX IF NOT EXISTS idx_notification_log_expense_id ON notification_log(expense_id)`;
  console.log('Created idx_notification_log_expense_id');

  await sql`CREATE INDEX IF NOT EXISTS idx_income_allocations_project_id ON income_allocations(project_id)`;
  console.log('Created idx_income_allocations_project_id');

  // Composite indexes — queries filter by (user_id, month) in 5+ functions
  console.log('\n--- Composite Indexes ---');

  await sql`CREATE INDEX IF NOT EXISTS idx_me_user_month ON monthly_expenses(user_id, month)`;
  console.log('Created idx_me_user_month');

  await sql`CREATE INDEX IF NOT EXISTS idx_mi_user_month ON monthly_incomes(user_id, month)`;
  console.log('Created idx_mi_user_month');

  // Partial index — expenses filtered by (user_id, is_active = true) in 5+ functions
  console.log('\n--- Partial Index ---');

  await sql`CREATE INDEX IF NOT EXISTS idx_expenses_user_active ON expenses(user_id, is_active) WHERE is_active = true`;
  console.log('Created idx_expenses_user_active');

  console.log('\nMigration complete — 8 indexes created (or already existed).');
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
