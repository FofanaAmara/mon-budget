import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

async function migrate() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL_NON_POOLING not found in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Neon PostgreSQL (direct TCP)...');
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const schemaPath = join(__dirname, '../supabase/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('📋 Executing schema...');
    await client.query(schema);
    console.log('✅ Schema applied!');

    // Verify
    const sections = await client.query('SELECT COUNT(*) as count FROM sections');
    const settingsRows = await client.query('SELECT COUNT(*) as count FROM settings');

    console.log('\n📊 Database verification:');
    console.log(`  sections: ${sections.rows[0].count} (expected: ≥6)`);
    console.log(`  settings: ${settingsRows.rows[0].count} (expected: 1)`);

    if (parseInt(sections.rows[0].count) >= 6 && parseInt(settingsRows.rows[0].count) >= 1) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.error('\n❌ Verification failed - expected counts not met');
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
