/** Fixture-only runner. No POSTGRES_URL loading or production override exists. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { root, directory, localConnection, assertLocalFixtureClient } from './local-fixture.mjs';

export const financialTables = ['sections', 'cards', 'incomes', 'expenses', 'debts',
  'monthly_expenses', 'monthly_incomes', 'income_allocations', 'monthly_allocations',
  'savings_contributions', 'debt_transactions', 'expense_transactions', 'allocation_sections'];
export const relationships = [
  ['expenses', 'section_id', 'sections'], ['expenses', 'card_id', 'cards'],
  ['debts', 'section_id', 'sections'], ['debts', 'card_id', 'cards'],
  ['monthly_expenses', 'expense_id', 'expenses'], ['monthly_expenses', 'debt_id', 'debts'],
  ['monthly_expenses', 'section_id', 'sections'], ['monthly_expenses', 'card_id', 'cards'],
  ['monthly_incomes', 'income_id', 'incomes'], ['income_allocations', 'section_id', 'sections'],
  ['income_allocations', 'project_id', 'expenses'], ['monthly_allocations', 'allocation_id', 'income_allocations'],
  ['savings_contributions', 'expense_id', 'expenses'], ['debt_transactions', 'debt_id', 'debts'],
  ['expense_transactions', 'monthly_expense_id', 'monthly_expenses'],
];
const quote = identifier => '"' + identifier.replaceAll('"', '""') + '"';
const schema = JSON.parse(fs.readFileSync(path.join(root, '.Codex/plans/espaces-financiers-evidence/schema-live.json'), 'utf8'));

export async function legacyFingerprint(client) {
  const result = {};
  for (const table of [...new Set(schema.columns.map(column => column.table_name))].sort()) {
    const columns = schema.columns.filter(column => column.table_name === table).map(column => quote(column.column_name));
    const rows = await client.query(`SELECT to_jsonb(r)::text AS record FROM (SELECT ${columns.join(',')} FROM public.${quote(table)}) r ORDER BY to_jsonb(r)::text`);
    const hash = crypto.createHash('sha256');
    for (const row of rows.rows) hash.update(row.record + '\n');
    result[table] = { count: rows.rowCount, sha256: hash.digest('hex') };
  }
  return result;
}

export async function preflight(client) {
  const issues = [];
  for (const table of [...financialTables.filter(table => table !== 'allocation_sections'), 'settings', 'setup_guide']) {
    const rows = await client.query(`SELECT count(*)::integer AS count FROM public.${quote(table)} WHERE user_id IS NULL OR btrim(user_id) IN ('','unclaimed','default')`);
    if (rows.rows[0].count) issues.push({ kind: 'ambiguous-owner', table, count: rows.rows[0].count });
  }
  for (const [child, column, parent] of relationships) {
    const rows = await client.query(`SELECT count(*)::integer AS count FROM public.${quote(child)} c JOIN public.${quote(parent)} p ON c.${quote(column)}=p.id WHERE c.user_id IS DISTINCT FROM p.user_id`);
    if (rows.rows[0].count) issues.push({ kind: 'cross-owner-reference', table: child, column, count: rows.rows[0].count });
  }
  const junction = await client.query('SELECT count(*)::integer AS count FROM allocation_sections j JOIN income_allocations a ON a.id=j.allocation_id JOIN sections s ON s.id=j.section_id WHERE a.user_id IS DISTINCT FROM s.user_id');
  if (junction.rows[0].count) issues.push({ kind: 'cross-owner-junction', table: 'allocation_sections', count: junction.rows[0].count });
  const duplicates = await client.query("SELECT count(*)::integer AS count FROM (SELECT user_id FROM expenses WHERE type='PLANNED' AND name='Épargne libre' AND is_active=true GROUP BY user_id HAVING count(*)>1) duplicates");
  if (duplicates.rows[0].count) issues.push({ kind: 'duplicate-free-savings', table: 'expenses', count: duplicates.rows[0].count });
  return issues;
}

function migrationFiles(through) {
  const names = ['001-expand.sql', '002-backfill.sql', '003-isolation.sql', '004-variable-income.sql'];
  const last = names.findIndex(name => name.startsWith(through + '-'));
  if (last < 0) throw new Error('Unknown migration target.');
  return names.slice(0, last + 1).map(name => {
    const sql = fs.readFileSync(path.join(root, 'scripts/migrations/espaces-financiers', name), 'utf8');
    return { name, sql, checksum: crypto.createHash('sha256').update(sql).digest('hex') };
  });
}

export async function runMigrations(client, { through = '002', dryRun = true, allowCutover = false, failAfter = null, onBeforeCutover = null } = {}) {
  const database = assertLocalFixtureClient(client);
  if (database !== 'spaces_work17' && !/^spaces_migration_test_[a-f0-9]{8}$/.test(database)) throw new Error('Refusing migrations outside the named local work/test databases.');
  if (['003', '004'].includes(through) && !allowCutover) throw new Error('Cutover requires explicit allowCutover on the isolated fixture.');
  const files = migrationFiles(through);
  await client.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
  let issues, before, applied;
  try {
    before = await legacyFingerprint(client);
    const ledger = await client.query("SELECT to_regclass('public.financial_space_migrations') IS NOT NULL AS present");
    applied = ledger.rows[0].present ? (await client.query('SELECT name, checksum FROM financial_space_migrations')).rows : [];
    const rollout = await client.query("SELECT to_regclass('public.financial_space_rollout') IS NOT NULL AS present");
    const ready = rollout.rows[0].present && (await client.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase === 'ready';
    // After cutover, authors of related rows may legitimately be different
    // members. Historical ownership checks are no longer the authorization rule.
    issues = ready ? [] : await preflight(client);
    for (const file of files) {
      const recorded = applied.find(row => row.name === file.name);
      if (recorded && recorded.checksum !== file.checksum) throw new Error('Applied migration checksum changed: ' + file.name);
    }
  } finally { await client.query('ROLLBACK'); }
  if (issues.length) {
    const error = new Error('Historical ownership or singleton preflight failed.');
    error.issues = issues;
    throw error;
  }
  if (dryRun) return { dryRun: true, mutations: 0, files: files.map(({ name, checksum }) => ({ name, checksum })), issues, before };

  // Session lock serializes runners. SQL backfill also locks all legacy writers.
  await client.query('SELECT pg_advisory_lock(60122309)');
  try {
    for (const file of files) {
      await client.query('BEGIN');
      try {
        await client.query("SET LOCAL lock_timeout='5s'");
        await client.query(`CREATE TABLE IF NOT EXISTS financial_space_migrations (
          name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
        )`);
        const recorded = (await client.query('SELECT checksum FROM financial_space_migrations WHERE name=$1', [file.name])).rows[0];
        if (recorded && recorded.checksum !== file.checksum) throw new Error('Applied migration checksum changed: ' + file.name);
        const ready = file.name !== '001-expand.sql' && (await client.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase === 'ready';
        const repeatBackfill = file.name === '002-backfill.sql' && !ready;
        if (!recorded || repeatBackfill) {
          // A final pass and cutover share a transaction, so no old writer can
          // insert an unscoped row between backfill and NOT NULL validation.
          if (file.name === '003-isolation.sql') {
            await client.query(files.find(item => item.name === '002-backfill.sql').sql);
            if (onBeforeCutover) await onBeforeCutover();
          }
          await client.query(file.sql);
          const after = await legacyFingerprint(client);
          if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Legacy records changed during migration; rolling back.');
          await client.query('INSERT INTO financial_space_migrations(name,checksum) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET applied_at=now()', [file.name, file.checksum]);
        }
        if (failAfter === file.name) throw new Error('Injected migration interruption.');
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { await client.query('SELECT pg_advisory_unlock(60122309)'); }
  const after = await legacyFingerprint(client);
  return { dryRun: false, files: files.map(({ name, checksum }) => ({ name, checksum })), issues, before, after,
    preserved: JSON.stringify(before) === JSON.stringify(after) };
}

async function main() {
  const args = process.argv.slice(2);
  const valid = new Set(['--apply', '--dry-run', '--through=001', '--through=002', '--through=003', '--through=004', '--allow-cutover']);
  if (args.some(arg => !valid.has(arg))) throw new Error('Unknown migration argument.');
  const through = args.find(arg => arg.startsWith('--through='))?.split('=')[1] ?? '002';
  const client = await localConnection('spaces_work17');
  try {
    const result = await runMigrations(client, { through, dryRun: !args.includes('--apply'), allowCutover: args.includes('--allow-cutover') });
    fs.writeFileSync(path.join(directory, result.dryRun ? 'migration-dry-run.json' : 'migration-report.json'), JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ dryRun: result.dryRun, preserved: result.preserved, migrations: result.files.map(file => file.name), issues: result.issues.length }));
  } finally { await client.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => {
    console.error(JSON.stringify({ failed: true, code: error.code ?? 'MIGRATION_FAILED', issues: error.issues ?? [],
      message: error.code ? 'PostgreSQL rejected migration; private data omitted.' : error.message }));
    process.exitCode = 1;
  });
}
