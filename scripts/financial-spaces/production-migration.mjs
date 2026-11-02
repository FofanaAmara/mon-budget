/** Explicit release runner. Never changes the fixture runner's connection guards. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import pg from 'pg';
import { root, directory, assertLocalFixtureClient } from './local-fixture.mjs';
import { migrationFiles, legacyFingerprint, preflight } from './migrate.mjs';
import { schemaFingerprint } from './synthetic-certificate.mjs';
import { verifyLegacyAttribution } from './verify-conservation.mjs';

const productionClients = new WeakSet();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const privateRoot = path.join(path.dirname(directory), 'production-release');
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const expectedLegacyColumns = JSON.parse(fs.readFileSync(path.join(root, '.Codex/plans/espaces-financiers-evidence/schema-live.json'), 'utf8')).columns;

async function verifyLegacyInventory(client) {
  const actual = (await client.query("SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,column_name")).rows;
  const normalized = rows => rows.map(row => JSON.stringify(row)).sort();
  if (!same(normalized(actual), normalized(expectedLegacyColumns))) throw new Error('Unreviewed legacy schema: inventory must match before expansion.');
}

async function publicTables(client) {
  return (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(row => row.tablename);
}

/** Freshness covers ALL current columns/tables, not only legacy conservation. */
export async function publicDataFingerprint(client) {
  const state = {};
  for (const table of await publicTables(client)) {
    const result = await client.query(`SELECT to_jsonb(r)::text AS record FROM public.${quote(table)} r ORDER BY to_jsonb(r)::text`);
    const hash = crypto.createHash('sha256');
    for (const row of result.rows) hash.update(row.record + '\n');
    state[table] = { count: result.rowCount, sha256: hash.digest('hex') };
  }
  return state;
}

export function assertReleaseRevision(sha) {
  const files = ['package.json', 'package-lock.json', '.Codex/plans/espaces-financiers-evidence/schema-live.json',
    ...['production-migration.mjs', 'release-backup.mjs', 'migrate.mjs', 'local-fixture.mjs', 'synthetic-certificate.mjs', 'verify-conservation.mjs']
      .map(name => 'scripts/financial-spaces/' + name),
    ...migrationFiles('006').map(file => 'scripts/migrations/espaces-financiers/' + file.name)];
  for (const file of files) {
    let committed;
    try { committed = execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { throw new Error('Release source is not committed at the pinned SHA.'); }
    if (!fs.readFileSync(path.join(root, file)).equals(committed)) throw new Error('Release source differs from the pinned SHA.');
  }
}

export function productionConnectionOptions(value, target) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Invalid production target.'); }
  const parameters = [...url.searchParams];
  if (!target || !/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(target.host ?? '')
    || target.host.includes('-pooler.') || !['postgres:', 'postgresql:'].includes(url.protocol)
    || url.hostname !== target.host || (url.port && url.port !== '5432') || url.hash
    || decodeURIComponent(url.pathname.slice(1)) !== target.database
    || decodeURIComponent(url.username) !== target.user || !url.password
    || !['require', 'verify-full'].includes(url.searchParams.get('sslmode'))
    || parameters.some(([key, val]) => !['sslmode', 'channel_binding'].includes(key)
      || (key === 'channel_binding' && val !== 'require'))
    || new Set(parameters.map(([key]) => key)).size !== parameters.length) {
    throw new Error('Refusing an unapproved production target or connection parameter.');
  }
  return { host: target.host, port: 5432, database: target.database, user: target.user,
    password: decodeURIComponent(url.password), ssl: { rejectUnauthorized: true },
    enableChannelBinding: true, connectionTimeoutMillis: 10000, application_name: 'mes-finances-controlled-release' };
}

export async function connectProduction(value, target) {
  const client = new pg.Client(productionConnectionOptions(value, target));
  await client.connect();
  try {
    const identity = (await client.query('SELECT current_database() AS database, current_user AS username')).rows[0];
    if (identity.database !== target.database || identity.username !== target.user) throw new Error('Production identity mismatch.');
    productionClients.add(client);
    return client;
  } catch (error) { await client.end(); throw error; }
}

export function validateReleaseProof(proof, { fingerprint, state, schema, files, cutover, writersStopped }) {
  if (cutover && writersStopped !== true) throw new Error('Cutover requires stopped writers, including scheduled jobs.');
  if (!proof?.restored || !proof.preserved || !/^[a-f0-9]{64}$/.test(proof.backupSha256 ?? '')
    || !same(proof.sourceFingerprint, fingerprint) || !state || !same(proof.sourceState, state) || proof.sourceSchema !== schema
    || !same(proof.migrations, files)) throw new Error('Missing or stale release proof; repeat backup/restore/rehearsal.');
}

/** Rehearsals are accepted only on verified disposable migration-test clones. */
export async function runProductionMigration(client, { through = '006', dryRun = true,
  proof, writersStopped = false, failAfter = null } = {}) {
  if (!productionClients.has(client)) {
    const database = assertLocalFixtureClient(client);
    if (!/^spaces_migration_test_[a-f0-9]{8}$/.test(database)) throw new Error('Production rehearsal requires a disposable verified clone.');
  }
  if (!['002', '006'].includes(through)) throw new Error('Release target must be expansion 002 or complete cutover 006.');
  const files = migrationFiles(through);
  const inventory = files.map(({ name, checksum }) => ({ name, checksum }));
  await client.query(dryRun ? 'BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ' : 'BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout='120s'");
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout='30s'");
    await client.query("SET LOCAL search_path=public,pg_catalog");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    if (!dryRun) {
      if (!(await client.query('SELECT pg_try_advisory_xact_lock(60122309) AS locked')).rows[0].locked) {
        throw new Error('Another migration is active; no waiting or concurrent release.');
      }
      // Lock before fingerprinting so an old writer cannot invalidate the backup
      // comparison between preflight and cutover. Readers remain available.
      const tables = await publicTables(client);
      if (!tables.length) throw new Error('Refusing an empty source schema.');
      await client.query(`LOCK TABLE ${tables.map(table => 'public.' + quote(table)).join(',')} IN SHARE ROW EXCLUSIVE MODE`);
    }
    const before = await legacyFingerprint(client);
    const state = await publicDataFingerprint(client);
    const schema = await schemaFingerprint(client);
    const present = (await client.query("SELECT to_regclass('public.financial_space_migrations') IS NOT NULL AS ledger, to_regclass('public.financial_space_rollout') IS NOT NULL AS rollout")).rows[0];
    if (present.ledger !== present.rollout) throw new Error('Incomplete rollout metadata; inspect before proceeding.');
    const applied = present.ledger ? (await client.query('SELECT name,checksum FROM financial_space_migrations ORDER BY name')).rows : [];
    const allFiles = migrationFiles('006');
    for (let i = 0; i < applied.length; i++) {
      if (applied[i].name !== allFiles[i]?.name || applied[i].checksum !== allFiles[i]?.checksum) {
        throw new Error('Applied migration ledger/checksum drift.');
      }
    }
    const phase = present.rollout ? (await client.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase : 'legacy';
    const expectedPhase = applied.length === 0 ? 'legacy' : applied.length === 1 ? 'expanded' : applied.length === 2 ? 'backfilled' : 'ready';
    if (phase !== expectedPhase) throw new Error('Inconsistent rollout phase and ledger; no backfill may run.');
    if (phase === 'legacy') await verifyLegacyInventory(client);
    const issues = phase === 'ready' ? [] : await preflight(client);
    if (issues.length) throw Object.assign(new Error('Historical preflight failed; no ownership reassignment.'), { issues });
    if (dryRun) {
      await client.query('ROLLBACK');
      return { dryRun: true, mutations: 0, phase, files: inventory, issues, before, state, schema };
    }
    validateReleaseProof(proof, { fingerprint: before, state, schema, files: inventory, cutover: through === '006', writersStopped });
    await client.query(`CREATE TABLE IF NOT EXISTS financial_space_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const file of files) {
      const recorded = applied.some(item => item.name === file.name);
      if (!recorded || (file.name === '002-backfill.sql' && phase !== 'ready')) {
        // 002 runs once in this same locked transaction, immediately before 003.
        // A second pass here would conflict with its ON COMMIT DROP temp table.
        await client.query(file.sql);
        if (!same(before, await legacyFingerprint(client))) throw new Error('Legacy conservation failed; rolling back release.');
        await client.query('INSERT INTO financial_space_migrations(name,checksum) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET applied_at=now()', [file.name, file.checksum]);
      }
      if (failAfter === file.name) throw new Error('Injected release interruption.');
    }
    const after = await legacyFingerprint(client);
    if (!same(before, after)) throw new Error('Final legacy conservation failed.');
    const finalPhase = (await client.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase;
    if (finalPhase !== (through === '006' ? 'ready' : phase === 'ready' ? 'ready' : 'backfilled')) throw new Error('Unexpected final rollout phase.');
    // Once shared writes exist, authors are no longer space owners. Never
    // compare legitimate later contributions against a legacy ownership map.
    if (phase !== 'ready') await verifyLegacyAttribution(client);
    try { await client.query('COMMIT'); }
    catch { throw Object.assign(new Error('COMMIT outcome unknown: inspect ledger, phase and conservation read-only before any retry.'), { code: 'COMMIT_UNKNOWN' }); }
    return { dryRun: false, preserved: true, before, after, state, schema, files: inventory, phase: finalPhase };
  } catch (error) {
    if (error.code !== 'COMMIT_UNKNOWN') await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

export function privateReleaseFile(value) {
  const resolved = path.resolve(value ?? '');
  if (!resolved.startsWith(privateRoot + path.sep) || fs.realpathSync(path.dirname(resolved)) !== path.dirname(resolved)) {
    throw new Error('Release artifacts must remain in the project private release directory, without symlinks.');
  }
  if (fs.lstatSync(resolved, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error('Symlinked release artifact refused.');
  return resolved;
}

export function readReleaseProfile(file) {
  const profile = JSON.parse(fs.readFileSync(privateReleaseFile(file), 'utf8'));
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (profile.environment !== 'production' || profile.sha !== sha || !profile.projectId || !profile.neonProjectId || !profile.neonBranchId
    || !['POSTGRES_URL_NON_POOLING', 'POSTGRES_DATABASE_URL_UNPOOLED'].includes(profile.credentialEnv)
    || !['002', '006'].includes(profile.through)) throw new Error('Release profile must pin production project, branch, current SHA, target and direct credential variable.');
  assertReleaseRevision(sha);
  return profile;
}

async function main() {
  const args = process.argv.slice(2);
  const profileArg = args.find(arg => arg.startsWith('--profile='));
  if (!profileArg || args.some(arg => arg !== profileArg && !['--dry-run', '--apply'].includes(arg))
    || (args.includes('--apply') && args.includes('--dry-run'))) throw new Error('Use --profile=<private-json> [--dry-run|--apply].');
  const profile = readReleaseProfile(profileArg.slice(10));
  const { sha } = profile;
  const dryRun = !args.includes('--apply');
  let proof;
  if (!dryRun) {
    proof = JSON.parse(fs.readFileSync(privateReleaseFile(profile.proofFile), 'utf8'));
    const hash = crypto.createHash('sha256').update(fs.readFileSync(privateReleaseFile(profile.backupFile))).digest('hex');
    if (hash !== proof.backupSha256 || !same(proof.target, profile.target) || proof.sha !== sha
      || proof.projectId !== profile.projectId || proof.neonProjectId !== profile.neonProjectId
      || proof.neonBranchId !== profile.neonBranchId) throw new Error('Backup/rehearsal does not match this release.');
  }
  // Reserve evidence storage BEFORE any SQL. A full disk, existing report or
  // bad path must not first be discovered after a successful commit.
  const reportFd = fs.openSync(privateReleaseFile(profile.reportFile), 'wx', 0o600);
  let client, result;
  try {
    client = await connectProduction(process.env[profile.credentialEnv], profile.target);
    result = await runProductionMigration(client, { through: profile.through, dryRun, proof, writersStopped: profile.writersStopped });
    fs.writeFileSync(reportFd, JSON.stringify({ ...result, sha, completedAt: new Date().toISOString() }, null, 2) + '\n');
    fs.fsyncSync(reportFd);
    console.log(JSON.stringify({ dryRun, phase: result.phase, preserved: result.preserved, migrations: result.files.map(file => file.name) }));
  } catch (error) {
    if (result && !dryRun) {
      error.code = 'COMMITTED_REPORT_FAILED';
      console.error('Commit confirmed but evidence persistence failed; reconcile read-only before any retry.');
    }
    try {
      fs.writeFileSync(reportFd, JSON.stringify({ failed: true, code: error.code ?? 'RELEASE_REFUSED', sha,
        reconciliationRequired: ['COMMIT_UNKNOWN', 'COMMITTED_REPORT_FAILED'].includes(error.code), completedAt: new Date().toISOString() }) + '\n');
      fs.fsyncSync(reportFd);
    } catch { /* The first failure remains explicit; never claim rollback. */ }
    throw error;
  } finally { fs.closeSync(reportFd); await client?.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(JSON.stringify({ failed: true, code: error.code ?? 'RELEASE_REFUSED',
    message: error.code ? 'Database rejected the release; private details omitted.' : error.message,
    issues: error.issues ?? [] })); process.exitCode = 1; });
}
