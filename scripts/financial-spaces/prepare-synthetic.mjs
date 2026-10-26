/** Portable test baseline. Never reads .env.local or any private backup. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { root, directory, container, owner, image, port, username, password, docker, assertOwned, localConnection, waitForFixtureReady } from './local-fixture.mjs';
import { legacyFingerprint } from './migrate.mjs';
import { seedSyntheticLegacy } from './synthetic-seed.mjs';
import { schemaFingerprint, verifySyntheticCertificate } from './synthetic-certificate.mjs';

const database = 'spaces_ci_baseline17';
if (process.argv.length > 2) throw new Error('Synthetic fixture accepts no target or arbitrary arguments.');
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const found = spawnSync('docker', ['inspect', container], { encoding: 'utf8' });
if (found.status === 0) {
  assertOwned();
  docker(['start', container]);
} else {
  docker(['run', '-d', '--name', container, '--label', `codex.task=${owner}`,
    '--publish', `127.0.0.1:${port}:5432`, '--env', `POSTGRES_USER=${username}`,
    '--env', `POSTGRES_PASSWORD=${password}`, '--mount', `type=bind,source=${directory},target=/fixture`, image]);
  assertOwned();
}
await waitForFixtureReady();
const schema = fs.readFileSync(path.join(root, '__tests__/fixtures/financial-spaces/legacy-schema.sql'), 'utf8');
const seed = fs.readFileSync(path.join(root, 'scripts/financial-spaces/synthetic-seed.mjs'), 'utf8');
const checksum = createHash('sha256').update(schema).update(seed).digest('hex');
const admin = await localConnection();
let created = false;
try {
  // Serialize setup, including the initial database creation and certificate.
  await admin.query('SELECT pg_advisory_lock(60122310)');
  const existing = await admin.query('SELECT shobj_description(oid,\'pg_database\') AS marker FROM pg_database WHERE datname=$1', [database]);
  if (!existing.rowCount) {
    await admin.query(`CREATE DATABASE "${database}"`);
    created = true;
  }
  const client = await localConnection(database);
  try {
    if (created) {
      await client.query('BEGIN');
      try {
        await client.query(schema);
        await client.query("SELECT set_config('search_path','public',false)");
        const expectedColumns = JSON.parse(fs.readFileSync(path.join(root, '.Codex/plans/espaces-financiers-evidence/schema-live.json'), 'utf8')).columns;
        const actualColumns = await client.query("SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public'");
        const canonical = rows => JSON.stringify(rows.map(row => JSON.stringify(row)).sort());
        if (canonical(expectedColumns) !== canonical(actualColumns.rows)) throw new Error('Synthetic historical schema differs from the recorded 175 columns.');
        await seedSyntheticLegacy(client);
        const fingerprint = await legacyFingerprint(client);
        const marker = JSON.stringify({ kind: 'mes-finances-synthetic-v1', checksum, fingerprint, schemaFingerprint: await schemaFingerprint(client) });
        await client.query(`COMMENT ON DATABASE "${database}" IS '${marker.replaceAll("'", "''")}'`);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    } else {
      const marker = JSON.parse(existing.rows[0].marker || 'null');
      await verifySyntheticCertificate(client, marker, checksum);
    }
    const fingerprint = await legacyFingerprint(client);
    console.log(JSON.stringify({ synthetic: true, created, tables: Object.keys(fingerprint).length,
      records: Object.values(fingerprint).reduce((sum, table) => sum + table.count, 0) }));
  } finally { await client.end(); }
} finally {
  await admin.query('SELECT pg_advisory_unlock(60122310)');
  await admin.end();
}
