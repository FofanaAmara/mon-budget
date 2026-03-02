import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL_NON_POOLING);

async function migrate() {
  console.log('🔄 Running allocation_sections migration...');

  // 1. Create junction table
  await sql`
    CREATE TABLE IF NOT EXISTS allocation_sections (
      allocation_id UUID NOT NULL REFERENCES income_allocations(id) ON DELETE CASCADE,
      section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
      PRIMARY KEY (allocation_id, section_id)
    )
  `;
  console.log('✅ Table allocation_sections created (or already exists)');

  // 2. Migrate existing section_id data into junction table
  const migrated = await sql`
    INSERT INTO allocation_sections (allocation_id, section_id)
    SELECT id, section_id FROM income_allocations
    WHERE section_id IS NOT NULL
    ON CONFLICT DO NOTHING
  `;
  console.log(`✅ Migrated existing section links (${migrated.length || 0} rows)`);

  // 3. Verify
  const count = await sql`SELECT COUNT(*) as c FROM allocation_sections`;
  console.log(`✅ Migration complete — ${count[0].c} allocation_sections rows`);
}

migrate().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
