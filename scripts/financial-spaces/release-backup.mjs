/** Consistent public backup and restore/rehearsal. Hosted SQL is read-only. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { directory, localConnection, port, username, password } from './local-fixture.mjs';
import { legacyFingerprint, preflight } from './migrate.mjs';
import { schemaFingerprint } from './synthetic-certificate.mjs';
import { connectProduction, productionConnectionOptions, privateReleaseFile, readReleaseProfile,
  runProductionMigration, publicDataFingerprint } from './production-migration.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const checksum = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const cleanEnvironment = () => Object.fromEntries(Object.entries(process.env)
  .filter(([name]) => ['PATH', 'LANG', 'LC_ALL', 'SSL_CERT_FILE', 'SSL_CERT_DIR'].includes(name)));
function native(tool, args, env) {
  const executable = path.join(path.dirname(directory), 'tools/libpq@17/17.11/bin', tool);
  const result = spawnSync(executable, args, { env, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 180000 });
  // PostgreSQL diagnostics can contain table contents or connection details.
  if (result.error || result.status !== 0) throw new Error(`${tool} failed; backup/rehearsal is not certified.`);
  return result.stdout;
}

export async function backupAndRehearse(profile) {
  const backup = privateReleaseFile(profile.backupFile);
  const proofFile = privateReleaseFile(profile.proofFile);
  const manifestFile = privateReleaseFile(backup + '.manifest.json');
  const restoreList = privateReleaseFile(backup + '.restore.list');
  for (const file of [backup, proofFile, manifestFile, restoreList]) {
    if (fs.existsSync(file)) throw new Error('Existing release artifact preserved; use new artifact names.');
  }
  const options = productionConnectionOptions(process.env[profile.credentialEnv], profile.target);
  const source = await connectProduction(process.env[profile.credentialEnv], profile.target);
  let manifest;
  try {
    await source.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
    await source.query("SET LOCAL statement_timeout='30s'");
    await source.query("SET LOCAL idle_in_transaction_session_timeout='240s'");
    await source.query("SET LOCAL search_path=public,pg_catalog");
    await source.query("SET LOCAL TIME ZONE 'UTC'");
    const extensions = (await source.query('SELECT e.extname,e.extversion,n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY e.extname')).rows;
    if (!same(extensions, [{ extname: 'plpgsql', extversion: '1.0', schema: 'pg_catalog' }, { extname: 'uuid-ossp', extversion: '1.1', schema: 'public' }])) {
      throw new Error('Source extensions differ from the verified restore profile.');
    }
    const ready = (await source.query("SELECT to_regclass('public.financial_space_rollout') IS NOT NULL AS present")).rows[0].present
      && (await source.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase === 'ready';
    if (!ready && (await preflight(source)).length) throw new Error('Ownership preflight failed before backup.');
    const sourceFingerprint = await legacyFingerprint(source);
    const sourceState = await publicDataFingerprint(source);
    const sourceSchema = await schemaFingerprint(source);
    const snapshot = (await source.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
    const fd = fs.openSync(backup, 'wx', 0o600);
    fs.closeSync(fd);
    native('pg_dump', ['--schema=public', '--format=custom', '--no-owner', '--no-acl', '--snapshot=' + snapshot, '--file=' + backup], {
      ...cleanEnvironment(), PGHOST: options.host, PGPORT: '5432', PGDATABASE: options.database,
      PGUSER: options.user, PGPASSWORD: options.password, PGSSLMODE: 'verify-full', PGSSLROOTCERT: 'system', PGCONNECT_TIMEOUT: '10',
    });
    const bytes = fs.readFileSync(backup);
    if (bytes.length <= 5 || bytes.subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid PostgreSQL backup.');
    manifest = { sha: profile.sha, target: profile.target, projectId: profile.projectId,
      neonProjectId: profile.neonProjectId, neonBranchId: profile.neonBranchId,
      sourceFingerprint, sourceState, sourceSchema, backupSha256: checksum(backup), extensions,
      createdAt: new Date().toISOString(), scope: 'public schema only; Neon Auth is a separately managed service' };
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await source.query('ROLLBACK');
  } finally { await source.end(); }

  // Never restore over any existing database, including the user's recipe.
  const database = 'spaces_migration_test_' + crypto.randomBytes(4).toString('hex');
  const admin = await localConnection();
  try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE template0`); }
  finally { await admin.end(); }
  const copy = await localConnection(database);
  try {
    await copy.query('CREATE EXTENSION "uuid-ossp" VERSION \'1.1\'');
    const toc = native('pg_restore', ['--list', backup], cleanEnvironment());
    let publicSchemas = 0;
    const filtered = toc.split('\n').filter(line => {
      if (/^\d+;\s+\d+\s+\d+\s+SCHEMA - public(?:\s|$)/.test(line)) { publicSchemas++; return false; }
      return true;
    }).join('\n');
    if (publicSchemas !== 1) throw new Error('Unexpected public schema archive entry.');
    fs.writeFileSync(restoreList, filtered + '\n', { mode: 0o600, flag: 'wx' });
    native('pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname=' + database, '--use-list=' + restoreList, backup], {
      ...cleanEnvironment(), PGHOST: '127.0.0.1', PGPORT: String(port), PGDATABASE: database, PGUSER: username, PGPASSWORD: password, PGSSLMODE: 'disable',
    });
    const restored = await runProductionMigration(copy, { through: profile.through });
    if (!same(restored.before, manifest.sourceFingerprint) || !same(restored.state, manifest.sourceState) || restored.schema !== manifest.sourceSchema) {
      throw new Error('Restored rows/schema differ; private backup and copy preserved for diagnosis.');
    }
    const proof = { ...manifest, restored: true, preserved: true, migrations: restored.files,
      rehearsalDatabase: database, scope: manifest.scope };
    const rehearsal = await runProductionMigration(copy, { through: profile.through, dryRun: false, writersStopped: true, proof });
    const replay = await runProductionMigration(copy, { through: profile.through });
    await runProductionMigration(copy, { through: profile.through, dryRun: false, writersStopped: true,
      proof: { ...proof, sourceFingerprint: replay.before, sourceState: replay.state, sourceSchema: replay.schema } });
    if (!rehearsal.preserved || checksum(backup) !== proof.backupSha256) throw new Error('Rehearsal or backup changed.');
    // Keep the migrated copy and immutable archive for recovery inspection.
    fs.writeFileSync(proofFile, JSON.stringify({ ...proof, phase: rehearsal.phase, replayPreserved: true, completedAt: new Date().toISOString() }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log(JSON.stringify({ restored: true, preserved: true, replayPreserved: true, phase: rehearsal.phase,
      historicalTables: Object.keys(restored.before).length, copyRetained: true }));
    return proof;
  } finally { await copy.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(path.resolve(process.argv[1]))).href) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !args[0].startsWith('--profile=')) throw new Error('Use --profile=<private-json>.');
  backupAndRehearse(readReleaseProfile(args[0].slice(10))).catch(() => {
    console.error('Backup/rehearsal failed. Private artifacts preserved; no hosted SQL writes were performed.');
    process.exitCode = 1;
  });
}
