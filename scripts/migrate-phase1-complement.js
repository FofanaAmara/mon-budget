const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('Starting Phase 1 Complement migration...');

  // 1. Create monthly_expenses table
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_expenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
      month VARCHAR(7) NOT NULL,
      name VARCHAR(200) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      due_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING'
        CHECK (status IN ('UPCOMING', 'PAID', 'OVERDUE', 'DEFERRED')),
      paid_at DATE,
      section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
      card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
      is_auto_charged BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_expense_month UNIQUE (expense_id, month)
    )
  `;
  console.log('✓ Table monthly_expenses created');

  // 2. Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_me_month ON monthly_expenses(month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_me_month_status ON monthly_expenses(month, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_me_section ON monthly_expenses(section_id)`;
  console.log('✓ Indexes created');

  // 3. Add email and phone to settings
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL`;
  await sql`ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT NULL`;
  console.log('✓ Columns email and phone added to settings');

  console.log('Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
