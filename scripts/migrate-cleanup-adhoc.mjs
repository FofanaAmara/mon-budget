/**
 * Migration: Clean up existing adhoc expenses.
 *
 * Previously, createAdhocExpense() created both an `expenses` record (ONE_TIME)
 * and a `monthly_expenses` record linked to it. This migration:
 * 1. Dissociates adhoc monthly_expenses from their expense templates
 * 2. Deletes orphaned ONE_TIME expenses that are no longer referenced
 *
 * Usage: node scripts/migrate-cleanup-adhoc.mjs
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
  console.log('🔄 Nettoyage des dépenses ad-hoc existantes...\n');

  // 1. Dissociate adhoc monthly_expenses from their expense template
  const dissociated = await sql`
    UPDATE monthly_expenses SET expense_id = NULL
    WHERE is_planned = false AND expense_id IS NOT NULL
    RETURNING id, name
  `;
  console.log(`   1. Dissocié ${dissociated.length} monthly_expenses ad-hoc :`);
  for (const row of dissociated) {
    console.log(`      — ${row.name} (${row.id})`);
  }

  // 2. Delete orphaned ONE_TIME expenses (no longer referenced by any monthly_expense)
  const deleted = await sql`
    DELETE FROM expenses
    WHERE type = 'ONE_TIME'
      AND id NOT IN (SELECT DISTINCT expense_id FROM monthly_expenses WHERE expense_id IS NOT NULL)
    RETURNING id, name
  `;
  console.log(`\n   2. Supprimé ${deleted.length} expenses ONE_TIME orphelines :`);
  for (const row of deleted) {
    console.log(`      — ${row.name} (${row.id})`);
  }

  console.log('\n✅ Nettoyage terminé');
}

migrate().catch((e) => {
  console.error('❌ Migration échouée:', e);
  process.exit(1);
});
