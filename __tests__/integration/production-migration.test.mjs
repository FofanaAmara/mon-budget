import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { localConnection, testBaseline } from '../../scripts/financial-spaces/local-fixture.mjs';
import { runProductionMigration } from '../../scripts/financial-spaces/production-migration.mjs';

const database = 'spaces_migration_test_' + crypto.randomBytes(4).toString('hex');
let client, original;
const proofFrom = snapshot => ({ restored: true, preserved: true, backupSha256: 'a'.repeat(64),
  sourceFingerprint: snapshot.before, sourceState: snapshot.state, sourceSchema: snapshot.schema, migrations: snapshot.files });

describe('atomic production runner — disposable verified PostgreSQL rehearsal', { concurrency: false }, () => {
  before(async () => {
    const admin = await localConnection();
    try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`); }
    finally { await admin.end(); }
    client = await localConnection(database);
    original = await runProductionMigration(client);
  });
  after(async () => {
    if (client) await client.end();
    const admin = await localConnection();
    try { await admin.query(`DROP DATABASE "${database}"`); } finally { await admin.end(); }
  });

  test('dry-run leaves catalog untouched and requires a verified SQL client', async () => {
    assert.equal(original.phase, 'legacy');
    assert.equal(original.mutations, 0);
    assert.equal((await client.query("SELECT to_regclass('public.financial_space_migrations') AS ledger")).rows[0].ledger, null);
    await assert.rejects(runProductionMigration({ query() { throw new Error('must not query'); } }), /not verified/);
  });

  test('unreviewed source columns are refused rather than omitted from conservation', async () => {
    await client.query('ALTER TABLE expenses ADD COLUMN fixture_unreviewed text');
    try { await assert.rejects(runProductionMigration(client), /Unreviewed legacy schema/); }
    finally { await client.query('ALTER TABLE expenses DROP COLUMN fixture_unreviewed'); }
  });

  test('concurrent release refuses immediately and leaves no ledger', async () => {
    const other = await localConnection(database);
    try {
      await other.query('BEGIN');
      await other.query('SELECT pg_advisory_xact_lock(60122309)');
      await assert.rejects(runProductionMigration(client, { dryRun: false, writersStopped: true, proof: proofFrom(original) }), /Another migration/);
    } finally { await other.query('ROLLBACK'); await other.end(); }
  });

  test('stale source/schema proof and unstopped writers refuse before DDL', async () => {
    const valid = proofFrom(original);
    for (const proof of [{ ...valid, sourceFingerprint: {} }, { ...valid, sourceSchema: 'drift' }]) {
      await assert.rejects(runProductionMigration(client, { dryRun: false, proof, writersStopped: true }), /release proof/);
    }
    await assert.rejects(runProductionMigration(client, { dryRun: false, proof: valid }), /writers/);
    assert.equal((await client.query("SELECT to_regclass('public.financial_spaces') AS spaces")).rows[0].spaces, null);
  });

  test('interruption after constraints and financial operations rolls back the entire cutover', async () => {
    await assert.rejects(runProductionMigration(client, { dryRun: false, writersStopped: true,
      proof: proofFrom(original), failAfter: '005-financial-operations.sql' }), /Injected release/);
    const snapshot = await runProductionMigration(client);
    assert.deepEqual(snapshot.before, original.before);
    assert.equal(snapshot.schema, original.schema);
    assert.equal(snapshot.phase, 'legacy');
  });

  test('complete cutover preserves all historical columns and exposes ready with all six migrations', async () => {
    const result = await runProductionMigration(client, { dryRun: false, writersStopped: true, proof: proofFrom(original) });
    assert.equal(result.preserved, true);
    assert.equal(result.phase, 'ready');
    assert.deepEqual(result.after, original.before);
    assert.equal((await client.query('SELECT count(*)::int AS count FROM financial_space_migrations')).rows[0].count, 6);
    assert.notEqual((await client.query("SELECT to_regclass('public.space_invitations') AS invitations")).rows[0].invitations, null);
  });

  test('replay preserves memberships, rows and schema without rerunning the legacy backfill', async () => {
    const snapshot = await runProductionMigration(client);
    const memberships = (await client.query('SELECT * FROM space_memberships ORDER BY space_id,user_id')).rows;
    await runProductionMigration(client, { dryRun: false, writersStopped: true, proof: proofFrom(snapshot) });
    assert.deepEqual((await client.query('SELECT * FROM space_memberships ORDER BY space_id,user_id')).rows, memberships);
    const afterReplay = await runProductionMigration(client);
    assert.deepEqual(afterReplay.before, snapshot.before);
    assert.equal(afterReplay.schema, snapshot.schema);
  });

  test('backup freshness detects changes in shared copies outside the legacy column inventory', async () => {
    const snapshot = await runProductionMigration(client);
    await client.query("UPDATE space_settings SET default_currency='USD'");
    const changed = await runProductionMigration(client);
    assert.deepEqual(changed.before, snapshot.before);
    assert.notDeepEqual(changed.state, snapshot.state);
    await assert.rejects(runProductionMigration(client, { dryRun: false, writersStopped: true,
      proof: proofFrom(snapshot) }), /release proof/);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM space_settings WHERE default_currency='USD'")).rows[0].count,
      (await client.query('SELECT count(*)::int AS count FROM space_settings')).rows[0].count);
  });

  test('a regressed phase cannot reattribute settings after shared writes', async () => {
    await client.query("UPDATE space_settings SET default_currency='USD'");
    const shared = (await client.query('SELECT * FROM space_settings ORDER BY space_id')).rows;
    await client.query("UPDATE financial_space_rollout SET phase='backfilled'");
    try {
      await assert.rejects(runProductionMigration(client), /Inconsistent rollout phase/);
      await assert.rejects(runProductionMigration(client, { dryRun: false, writersStopped: true,
        proof: proofFrom(original) }), /Inconsistent rollout phase/);
      assert.deepEqual((await client.query('SELECT * FROM space_settings ORDER BY space_id')).rows, shared);
    } finally { await client.query("UPDATE financial_space_rollout SET phase='ready'"); }
  });

  test('a lost commit acknowledgement requires reconciliation and does not claim rollback', async () => {
    const snapshot = await runProductionMigration(client);
    const realQuery = client.query.bind(client);
    let rollbackSent = false;
    client.query = async (...args) => {
      if (args[0] === 'ROLLBACK') rollbackSent = true;
      const result = await realQuery(...args);
      if (args[0] === 'COMMIT') throw new Error('Simulated lost acknowledgement after PostgreSQL commit.');
      return result;
    };
    try {
      await assert.rejects(runProductionMigration(client, { dryRun: false, writersStopped: true,
        proof: proofFrom(snapshot) }), error => error.code === 'COMMIT_UNKNOWN');
      assert.equal(rollbackSent, false);
    } finally { client.query = realQuery; }
    const reconciled = await runProductionMigration(client);
    assert.equal(reconciled.phase, 'ready');
    assert.deepEqual(reconciled.before, snapshot.before);
    assert.equal(reconciled.schema, snapshot.schema);
  });

  test('recorded checksum drift refuses even a dry-run and is never auto-repaired', async () => {
    await client.query("UPDATE financial_space_migrations SET checksum='fixture-corrupted' WHERE name='006-invitations.sql'");
    await assert.rejects(runProductionMigration(client), /ledger\/checksum drift/);
    assert.equal((await client.query("SELECT checksum FROM financial_space_migrations WHERE name='006-invitations.sql'")).rows[0].checksum, 'fixture-corrupted');
  });
});
