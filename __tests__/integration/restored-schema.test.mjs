import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { localConnection, testBaseline } from '../../scripts/financial-spaces/local-fixture.mjs';
import { schemaInventory, schemaInventoryFingerprint, schemaFingerprint, verifyRestoredSchema } from '../../scripts/financial-spaces/synthetic-certificate.mjs';

const database = 'spaces_migration_test_' + randomBytes(4).toString('hex');
let client, inventory, originalHash;
const quote = value => '"' + value.replaceAll('"', '""') + '"';
before(async () => {
  const admin = await localConnection();
  try { await admin.query(`CREATE DATABASE ${quote(database)} TEMPLATE ${quote(testBaseline())}`); }
  finally { await admin.end(); }
  client = await localConnection(database);
  inventory = await schemaInventory(client);
  originalHash = await schemaFingerprint(client);
});
after(async () => {
  await client?.end();
  const admin = await localConnection();
  try { await admin.query(`DROP DATABASE ${quote(database)}`); } finally { await admin.end(); }
});

test('the actual historical CHECK syntax compares equal after PostgreSQL reparsing, without changing source or copy', async () => {
  const expected = structuredClone(inventory);
  const historical = JSON.parse(fs.readFileSync('.Codex/plans/espaces-financiers-evidence/schema-live.json', 'utf8')).constraints;
  for (const constraint of expected.constraints.filter(row => row.contype === 'c')) {
    const original = historical.find(row => row.table_name === constraint.relname && row.conname === constraint.conname);
    assert.ok(original);
    constraint.definition = original.definition;
  }
  assert.notEqual(schemaInventoryFingerprint(expected), originalHash, 'Fixture must reproduce the actual source/restored cast normalization difference.');
  const before = structuredClone(expected);
  const result = await verifyRestoredSchema(client, expected);
  assert.equal(result.matched, true);
  assert.deepEqual(expected, before);
  assert.equal(await schemaFingerprint(client), originalHash);
  assert.equal((await client.query("SELECT count(*)::int AS count FROM pg_class WHERE relname LIKE 'restore_check_%' AND relnamespace=pg_my_temp_schema()")).rows[0].count, 0);
});

test('a real CHECK predicate change is rejected, not normalized away', async () => {
  const changed = structuredClone(inventory);
  changed.constraints.find(row => row.contype === 'c').definition = 'CHECK (false)';
  await assert.rejects(verifyRestoredSchema(client, changed), /differs beyond/);
  assert.equal(await schemaFingerprint(client), originalHash);
});

test('constraint validation state is part of the comparison', async () => {
  const changed = structuredClone(inventory);
  const constraint = changed.constraints.find(row => row.contype === 'c');
  constraint.convalidated = false;
  await assert.rejects(verifyRestoredSchema(client, changed), /differs beyond/);
});

test('a missing real index is refused without recreating it or modifying other catalog objects', async () => {
  const index = inventory.indexes.find(row => !row.indexdef.startsWith('CREATE UNIQUE'));
  assert.ok(index);
  await client.query(`DROP INDEX public.${quote(index.indexname)}`);
  try {
    await assert.rejects(verifyRestoredSchema(client, inventory), /differs beyond/);
    assert.equal((await client.query('SELECT to_regclass($1) AS relation', ['public.' + index.indexname])).rows[0].relation, null);
  } finally { await client.query(index.indexdef); }
  assert.equal(await schemaFingerprint(client), originalHash);
});

test('an unverified client is refused before any SQL, including TEMP DDL', async () => {
  await assert.rejects(verifyRestoredSchema({ query() { throw new Error('Must never execute'); } }, inventory), /not verified/);
});
