import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { localConnection, testBaseline } from '../../scripts/financial-spaces/local-fixture.mjs';
import { runMigrations, legacyFingerprint } from '../../scripts/financial-spaces/migrate.mjs';

const statement = fs.readFileSync('scripts/financial-spaces/reconcile-confirmed-delivery.sql', 'utf8');
const database = 'spaces_migration_test_' + randomBytes(4).toString('hex');
let client, space;
before(async () => {
  const admin = await localConnection();
  try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`); }
  finally { await admin.end(); }
  client = await localConnection(database);
  await runMigrations(client, { through: '006', dryRun: false, allowCutover: true });
  space = randomUUID();
  await client.query(`INSERT INTO financial_spaces(id,name,created_by,creation_key,creation_fingerprint) VALUES($1,'Fixture reconciliation','fixture-reconciliation',$2,'fixture')`, [space, randomUUID()]);
  await client.query('INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)', [space, 'fixture-reconciliation']);
});
after(async () => {
  if (client) await client.end();
  const admin = await localConnection();
  try { await admin.query(`DROP DATABASE "${database}"`); }
  finally { await admin.end(); }
});
async function invitation() {
  const id = randomUUID(), lease = randomUUID();
  await client.query(`INSERT INTO space_invitations(id,space_id,recipient_email,invited_by,token_nonce,token_hash,origin,space_name_snapshot,inviter_name_snapshot,mail_from,
    delivery_status,first_attempt_at,last_attempt_at,delivery_lease,lease_until)
    VALUES($1,$2,$5,'fixture-reconciliation','fixture-nonce',$3,'https://finance.example.test','Fixture','Fixture','sender@example.test',
    'uncertain',now()-interval '25 hours',now()-interval '24 hours',$4,now()-interval '23 hours')`, [id, space, randomBytes(32).toString('hex'), lease, `recipient-${id}@example.test`]);
  await client.query(`INSERT INTO space_invitation_delivery_attempts(id,invitation_id,requested_by,lease,outcome) VALUES($1,$2,'fixture-reconciliation',$3,'failed')`, [randomUUID(), id, lease]);
  return readInvitation(id);
}
async function readInvitation(id) {
  return (await client.query('SELECT i.*,first_attempt_at::text AS first_snapshot,last_attempt_at::text AS last_snapshot FROM space_invitations i WHERE id=$1', [id])).rows[0];
}
const parameters = row => [row.id, row.space_id, row.first_snapshot, row.last_snapshot];
test('a confirmed receipt changes delivery only, invalidates the old lease and preserves all business data/history', async () => {
  const row = await invitation();
  const before = await legacyFingerprint(client);
  const attempts = (await client.query('SELECT * FROM space_invitation_delivery_attempts WHERE invitation_id=$1', [row.id])).rows;
  const members = (await client.query('SELECT * FROM space_memberships WHERE space_id=$1', [space])).rows;
  assert.equal((await client.query(statement, parameters(row))).rowCount, 1);
  const after = await readInvitation(row.id);
  assert.equal(after.delivery_status, 'sent');assert.equal(after.delivery_lease, null);assert.equal(after.lease_until, null);
  for (const key of ['status','token_hash','token_nonce','recipient_email','expires_at','first_attempt_at','last_attempt_at','origin','mail_from']) assert.deepEqual(after[key], row[key]);
  assert.deepEqual(await legacyFingerprint(client), before);
  assert.deepEqual((await client.query('SELECT * FROM space_invitation_delivery_attempts WHERE invitation_id=$1', [row.id])).rows, attempts);
  assert.deepEqual((await client.query('SELECT * FROM space_memberships WHERE space_id=$1', [space])).rows, members);
  const stale = await client.query("UPDATE space_invitations SET delivery_status='failed' WHERE id=$1 AND delivery_lease=$2", [row.id, row.delivery_lease]);
  assert.equal(stale.rowCount, 0);
  assert.equal((await client.query(statement, parameters(row))).rowCount, 0);
});
test('wrong space and stale attempt snapshots cannot reconcile an invitation', async () => {
  const row = await invitation();
  for (const values of [
    [row.id, randomUUID(), row.first_snapshot, row.last_snapshot],
    [row.id, row.space_id, new Date(0), row.last_snapshot],
    [row.id, row.space_id, row.first_snapshot, new Date(0)],
  ]) assert.equal((await client.query(statement, values)).rowCount, 0);
  assert.deepEqual(await readInvitation(row.id), row);
});
test('active leases, expired/answered invitations and unconfirmed deliveries remain untouched', async () => {
  for (const change of [
    "lease_until=now()+interval '1 minute'",
    'expires_at=now()',
    "status='declined',responded_by='fixture-recipient',responded_at=now()",
    "delivery_status='sending'",
    "delivery_status='failed'",
  ]) {
    const row = await invitation();
    await client.query(`UPDATE space_invitations SET ${change} WHERE id=$1`, [row.id]);
    const before = await readInvitation(row.id);
    assert.equal((await client.query(statement, parameters(row))).rowCount, 0, change);
    assert.deepEqual(await readInvitation(row.id), before);
  }
});
