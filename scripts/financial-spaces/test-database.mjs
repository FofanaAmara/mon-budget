/**
 * Prepare the goal's private, local PostgreSQL fixture and verify a source backup.
 * Source access is pg_dump --schema=public only. All SQL writes target the owned
 * Docker fixture on 127.0.0.1, never POSTGRES_URL. No data or secrets go to stdout.
 *
 * node scripts/financial-spaces/test-database.mjs prepare
 * node scripts/financial-spaces/test-database.mjs snapshot
 * node scripts/financial-spaces/test-database.mjs restore
 * node scripts/financial-spaces/test-database.mjs verify
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import dotenv from 'dotenv';
import pg from 'pg';
import { root, directory, container, owner, image, port, username, password, databaseNames,
  docker, assertOwned, localConnection } from './local-fixture.mjs';
const dumpFile = path.join(directory, 'source-public-pg17.dump');
const manifestFile = path.join(directory, 'source-public-pg17.manifest.json');
const env = dotenv.parse(fs.readFileSync(path.join(root, '.env.local')));
const command = process.argv[2];

fs.mkdirSync(directory, { recursive: true, mode: 0o700 });

function verifiedBackup() {
  if (!fs.existsSync(manifestFile) || !fs.existsSync(dumpFile)) {
    throw new Error('Backup and manifest are required before restoration verification.');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const bytes = fs.readFileSync(dumpFile);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (bytes.subarray(0, 5).toString() !== 'PGDMP' || bytes.length <= 5
    || bytes.length !== manifest.size || manifest.file !== path.basename(dumpFile)
    || sha256 !== manifest.sha256) throw new Error('Backup does not match its manifest.');
  return manifest;
}

async function prepare() {
  const found = spawnSync('docker', ['inspect', container], { encoding: 'utf8' });
  if (found.status === 0) {
    assertOwned();
    docker(['start', container]);
  } else {
    docker(['run', '-d', '--name', container, '--label', `codex.task=${owner}`,
      '--publish', `127.0.0.1:${port}:5432`,
      '--env', `POSTGRES_USER=${username}`, '--env', `POSTGRES_PASSWORD=${password}`,
      '--mount', `type=bind,source=${directory},target=/fixture`, image]);
  }
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = spawnSync('docker', ['exec', container, 'pg_isready', '-U', username], { encoding: 'utf8' });
    if (result.status === 0) { ready = true; break; }
    await delay(250);
  }
  if (!ready) throw new Error('Local PostgreSQL fixture did not become ready.');
  const client = await localConnection();
  try {
    for (const name of databaseNames) {
      const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
      if (!exists.rowCount) await client.query(`CREATE DATABASE ${name}`);
    }
  } finally { await client.end(); }
  console.log(JSON.stringify({ prepared: true, container, host: '127.0.0.1', port, databases: databaseNames }));
}

async function sourceDump() {
  const source = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
  if (!source) throw new Error('Source URL is not configured.');
  if (fs.existsSync(dumpFile)) throw new Error('Backup already exists; preserving it. Use verify.');
  const executable = path.join(root, '.local/tools/libpq@17/17.11/bin/pg_dump');
  if (!fs.existsSync(executable)) throw new Error('Source backup requires the native PostgreSQL client.');
  // Source credentials remain on the host, never passed into a Docker container.
  const connection = new URL(source);
  const parameterVariables = {
    sslmode: 'PGSSLMODE', channel_binding: 'PGCHANNELBINDING', options: 'PGOPTIONS',
    connect_timeout: 'PGCONNECT_TIMEOUT', sslrootcert: 'PGSSLROOTCERT',
  };
  const sourceEnvironment = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG'))),
    PGHOST: connection.hostname, PGPORT: connection.port || '5432',
    PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password),
    PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
  };
  for (const [parameter, value] of connection.searchParams) {
    const variable = parameterVariables[parameter];
    if (!variable) throw new Error('Source connection has an unsupported parameter; refusing to ignore it.');
    sourceEnvironment[variable] = value;
  }
  const metadata = new pg.Client({ connectionString: source });
  let extensions;
  try {
    await metadata.connect();
    await metadata.query('BEGIN READ ONLY');
    extensions = (await metadata.query('SELECT e.extname, e.extversion, n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY e.extname')).rows;
    await metadata.query('ROLLBACK');
  } finally { await metadata.end(); }
  const partial = dumpFile + '.' + crypto.randomUUID() + '.partial';
  const fd = fs.openSync(partial, 'wx', 0o600);
  const child = spawn(executable, ['--schema=public', '--format=custom', '--no-owner', '--no-acl'], {
    env: sourceEnvironment, stdio: ['ignore', fd, 'pipe'],
  });
  let diagnostic = '';
  const result = await new Promise(resolve => {
    child.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-65536); });
    child.once('error', () => resolve(-1));
    child.once('close', code => resolve(code));
  });
  fs.closeSync(fd);
  if (result !== 0) {
    for (const secret of [source, connection.hostname, connection.username, connection.password,
      decodeURIComponent(connection.username), decodeURIComponent(connection.password)]) {
      if (secret) diagnostic = diagnostic.replaceAll(secret, '[redacted]');
    }
    fs.writeFileSync(path.join(directory, 'backup-error.txt'), diagnostic, { mode: 0o600 });
    throw new Error('Source backup failed. Partial file and sanitized private diagnostic retained.');
  }
  fs.renameSync(partial, dumpFile);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(dumpFile)).digest('hex');
  fs.writeFileSync(manifestFile, JSON.stringify({
    sourceAccess: 'pg_dump public snapshot; no source SQL mutations',
    file: path.basename(dumpFile), sha256: hash, size: fs.statSync(dumpFile).size, extensions,
  }, null, 2) + '\n', { mode: 0o600 });
}

async function restore() {
  assertOwned();
  const manifest = verifiedBackup();
  const extensions = manifest.extensions;
  if (JSON.stringify(extensions) !== JSON.stringify([
    { extname: 'plpgsql', extversion: '1.0', schema: 'pg_catalog' },
    { extname: 'uuid-ossp', extversion: '1.1', schema: 'public' },
  ])) throw new Error('Source extensions differ from the supported restore environment.');
  // Schema-limited pg_dump omits extension definitions. Reproduce the source's
  // exact extension first, retaining public so uuid_generate_v4 is available.
  const archivePath = '/fixture/' + path.basename(dumpFile);
  const toc = docker(['exec', container, 'pg_restore', '--list', archivePath]);
  let schemas = 0;
  const restoreList = toc.split('\n').filter(line => {
    if (/^\d+;\s+\d+\s+\d+\s+SCHEMA - public(?:\s|$)/.test(line)) { schemas++; return false; }
    return true;
  }).join('\n');
  if (schemas !== 1) throw new Error('Backup has an unexpected public schema entry.');
  fs.writeFileSync(path.join(directory, 'restore17.list'), restoreList + '\n', { mode: 0o600 });
  const pending = [];
  let reference;
  function recordRestore(markerPath, result) {
    fs.writeFileSync(markerPath, JSON.stringify({ dumpSha256: manifest.sha256, fingerprint: result }, null, 2) + '\n', { mode: 0o600 });
  }
  for (const database of databaseNames) {
    const markerPath = path.join(directory, database + '-restored.json');
    const client = await localConnection(database);
    let populated;
    try {
      const tables = await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
      populated = tables.rowCount > 0;
      if (!populated) {
        const objects = await client.query(`
          SELECT 1 FROM pg_class WHERE relnamespace = to_regnamespace('public')
          UNION ALL SELECT 1 FROM pg_proc p WHERE pronamespace = to_regnamespace('public')
            AND NOT EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
              WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e' AND e.extname='uuid-ossp')
          UNION ALL SELECT 1 FROM pg_type WHERE typnamespace = to_regnamespace('public')
        `);
        if (objects.rowCount) throw new Error('Fixture has existing schema objects; refusing to overwrite.');
        await client.query('CREATE SCHEMA IF NOT EXISTS public');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public VERSION \'1.1\'');
      }
    } finally { await client.end(); }
    if (populated) {
      if (!fs.existsSync(markerPath)) { pending.push({ database, markerPath }); continue; }
      const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
      const result = await fingerprint(database);
      if (marker.dumpSha256 !== manifest.sha256
        || JSON.stringify(marker.fingerprint) !== JSON.stringify(result)) {
        throw new Error('Fixture differs from its completed restore; refusing to overwrite.');
      }
      reference = result;
      continue;
    }
    docker(['exec', container, 'pg_restore', '--single-transaction', '--exit-on-error', '--no-owner', '--no-acl',
      '--use-list', '/fixture/restore17.list',
      '--username', username, '--dbname', database, archivePath]);
    const result = await fingerprint(database);
    recordRestore(markerPath, result);
    reference = result;
  }
  // Recover a crash after pg_restore committed but before its marker was saved.
  // No populated database is overwritten: certify it only against another copy
  // whose completed restoration from this exact archive is already established.
  for (const { database, markerPath } of pending) {
    if (!reference) throw new Error('Fixture has no completed reference restore; preserving unmarked databases.');
    const result = await fingerprint(database);
    if (JSON.stringify(result) !== JSON.stringify(reference)) throw new Error('Fixture without a marker differs from the restored reference; preserving it.');
    recordRestore(markerPath, result);
  }
}

async function fingerprint(database) {
  const client = await localConnection(database);
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const expected = JSON.parse(fs.readFileSync(path.join(root, '.Codex/plans/espaces-financiers-evidence/schema-live.json'), 'utf8'));
    const columns = await client.query("SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public'");
    const indexes = await client.query("SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public'");
    const constraints = await client.query("SELECT t.relname AS table_name, c.conname, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public'");
    // PostgreSQL normalizes casts when a CHECK is recreated (including by a
    // dump/restore with the same client version). Reparse the expected CHECKs
    // on empty TEMP tables, then compare the full canonical definitions. Public
    // tables and their records are only read, never altered by this verifier.
    const quote = value => '"' + value.replaceAll('"', '""') + '"';
    for (const constraint of expected.constraints) {
      if (!constraint.definition.startsWith('CHECK (')) continue;
      const temporary = quote('fixture_check_' + crypto.randomUUID().replaceAll('-', ''));
      await client.query(`CREATE TEMP TABLE ${temporary} (LIKE public.${quote(constraint.table_name)}) ON COMMIT DROP`);
      await client.query(`ALTER TABLE ${temporary} ADD CONSTRAINT fixture_expected ${constraint.definition}`);
      const canonicalDefinition = await client.query('SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=$1::regclass AND conname=$2', [temporary, 'fixture_expected']);
      constraint.definition = canonicalDefinition.rows[0].definition;
    }
    const canonical = rows => JSON.stringify(rows.map(row => JSON.stringify(row)).sort());
    if (canonical(columns.rows) !== canonical(expected.columns)
      || canonical(indexes.rows) !== canonical(expected.indexes)
      || canonical(constraints.rows) !== canonical(expected.constraints)) {
      throw new Error('Restored schema differs from the expected source inventory.');
    }
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    const result = {};
    for (const { tablename: table } of tables.rows) {
      const quoted = '"' + table.replaceAll('"', '""') + '"';
      // Hash records locally, sorted canonically, without exposing record contents.
      const rows = await client.query(`SELECT to_jsonb(t)::text AS row FROM public.${quoted} t ORDER BY to_jsonb(t)::text`);
      const hash = crypto.createHash('sha256');
      for (const item of rows.rows) hash.update(item.row + '\n');
      result[table] = { count: rows.rowCount, sha256: hash.digest('hex') };
    }
    await client.query('COMMIT');
    return result;
  } finally { await client.end(); }
}

async function verify() {
  const manifest = verifiedBackup();
  const [baseline, work] = await Promise.all(databaseNames.map(fingerprint));
  if (JSON.stringify(baseline) !== JSON.stringify(work)) throw new Error('Restored fixtures differ.');
  for (const database of databaseNames) {
    const markerPath = path.join(directory, database + '-restored.json');
    if (!fs.existsSync(markerPath)) throw new Error('Restored fixture has no completed restore marker.');
    const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
    if (marker.dumpSha256 !== manifest.sha256 || JSON.stringify(marker.fingerprint) !== JSON.stringify(baseline)) {
      throw new Error('Restored fixture does not match its verified backup marker.');
    }
  }
  const report = { restored: true, sourceAccess: manifest.sourceAccess, dumpSha256: manifest.sha256, tables: baseline };
  fs.writeFileSync(path.join(directory, 'restoration-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ restored: true, matchingTables: Object.keys(baseline).length, recordsMatch: true, privateReport: '.local/financial-spaces/restoration-report.json' }));
}

try {
  if (command === 'prepare') await prepare();
  else if (command === 'snapshot') { await prepare(); await sourceDump(); await restore(); await verify(); }
  else if (command === 'restore') { await prepare(); await restore(); await verify(); }
  else if (command === 'verify') await verify();
  else throw new Error('Use prepare, snapshot, restore or verify.');
} catch (error) {
  // All messages above are deliberately sanitized; never stringify external errors.
  console.error(error instanceof Error && /^(Use |Source |Backup |Fixture |Restored |Refusing |Local |Docker )/.test(error.message)
    ? error.message : 'Fixture operation failed; private data and credentials were not printed.');
  process.exitCode = 1;
}
