import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { localConnection, testBaseline } from '../../scripts/financial-spaces/local-fixture.mjs';
import { legacyFingerprint } from '../../scripts/financial-spaces/migrate.mjs';
import { schemaFingerprint, verifySyntheticCertificate } from '../../scripts/financial-spaces/synthetic-certificate.mjs';

const database = 'spaces_migration_test_' + randomBytes(4).toString('hex');
let client, marker;
before(async () => {
  const admin = await localConnection();
  try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`); }
  finally { await admin.end(); }
  client = await localConnection(database);
  marker = { kind: 'mes-finances-synthetic-v1', checksum: 'fixture',
    fingerprint: await legacyFingerprint(client), schemaFingerprint: await schemaFingerprint(client) };
});
after(async () => {
  if (client) await client.end();
  const admin = await localConnection();
  try { await admin.query(`DROP DATABASE "${database}"`); }
  finally { await admin.end(); }
});
test('accepts an unchanged schema and rows, but never certifies unknown input', async () => {
  await verifySyntheticCertificate(client, marker, 'fixture');
  await assert.rejects(verifySyntheticCertificate(client, marker, 'changed-input'), /preserving/);
});
for (const [name, alteration] of [
  ['CHECK removal', 'ALTER TABLE expenses DROP CONSTRAINT expenses_type_check'],
  ['default change', "ALTER TABLE expenses ALTER COLUMN currency SET DEFAULT 'USD'"],
  ['new enum value', "ALTER TYPE income_frequency ADD VALUE 'FIXTURE_ONLY'"],
]) {
  test(`refuses ${name} with unchanged rows and leaves the altered schema untouched`, async () => {
    await client.query('BEGIN');
    try {
      await client.query(alteration);
      assert.deepEqual(await legacyFingerprint(client), marker.fingerprint);
      const altered = await schemaFingerprint(client);
      await assert.rejects(verifySyntheticCertificate(client, marker, 'fixture'), /preserving/);
      assert.equal(await schemaFingerprint(client), altered);
    } finally { await client.query('ROLLBACK'); }
  });
}
test('refuses a missing non-unique index without silently recreating it', async () => {
  const index = (await client.query(`SELECT i.relname FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid
    WHERE i.relnamespace='public'::regnamespace AND NOT x.indisunique ORDER BY i.relname LIMIT 1`)).rows[0].relname;
  await client.query('BEGIN');
  try {
    await client.query(`DROP INDEX public."${index.replaceAll('"', '""')}"`);
    assert.deepEqual(await legacyFingerprint(client), marker.fingerprint);
    await assert.rejects(verifySyntheticCertificate(client, marker, 'fixture'), /preserving/);
    assert.equal((await client.query('SELECT to_regclass($1) AS name', ['public.' + index])).rows[0].name, null);
  } finally { await client.query('ROLLBACK'); }
});
