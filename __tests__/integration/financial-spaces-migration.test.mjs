import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { localConnection } from '../../scripts/financial-spaces/local-fixture.mjs';
import { runMigrations, preflight, legacyFingerprint, financialTables } from '../../scripts/financial-spaces/migrate.mjs';

const database = 'spaces_migration_test_' + crypto.randomBytes(4).toString('hex');
let client, original, mapping;
const uuid = () => crypto.randomUUID();
const q = value => '"' + value.replaceAll('"', '""') + '"';
const phase = async () => (await client.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0].phase;

async function expectSqlFailure(sql, values, code, constraint) {
  await client.query('SAVEPOINT expected_failure');
  try {
    await assert.rejects(client.query(sql, values), error => error.code === code && (!constraint || error.constraint === constraint));
  } finally { await client.query('ROLLBACK TO SAVEPOINT expected_failure'); }
}

async function seedSpace(actor, month = '2099-01') {
  const ids = Object.fromEntries(['space', ...financialTables.filter(table => table !== 'allocation_sections'), 'notification_log'].map(key => [key, uuid()]));
  const insert = async (table, row) => {
    const columns = Object.keys(row);
    await client.query(`INSERT INTO ${q(table)} (${columns.map(q)}) VALUES (${columns.map((_, index) => '$' + (index + 1))})`, Object.values(row));
  };
  await insert('financial_spaces', { id: ids.space, name: 'Fixture', created_by: actor, creation_key: uuid(), creation_fingerprint: 'fixture' });
  await insert('space_memberships', { space_id: ids.space, user_id: actor });
  const financial = (table, fields) => insert(table, { id: ids[table], user_id: actor, space_id: ids.space, ...fields });
  await financial('sections', { name: 'Fixture category', position: 0 });
  await financial('cards', { name: 'Fixture card' });
  await financial('incomes', { name: 'Fixture income', amount: '1450.00', frequency: 'MONTHLY', is_active: true });
  await financial('expenses', { name: 'Fixture project', amount: '3.99', type: 'PLANNED', saved_amount: '100.00', section_id: ids.sections, card_id: ids.cards });
  await financial('debts', { name: 'Fixture debt', original_amount: '1000.00', remaining_balance: '900.00', payment_amount: '100.00', payment_frequency: 'MONTHLY', section_id: ids.sections, card_id: ids.cards });
  await financial('monthly_expenses', { name: 'Fixture monthly expense', amount: '3.99', month, status: 'UPCOMING', expense_id: ids.expenses, section_id: ids.sections, card_id: ids.cards });
  await financial('monthly_incomes', { income_id: ids.incomes, month, expected_amount: '1450.00', status: 'EXPECTED' });
  await financial('income_allocations', { label: 'Fixture allocation', amount: '100.00', section_id: ids.sections, project_id: ids.expenses });
  await financial('monthly_allocations', { allocation_id: ids.income_allocations, month, allocated_amount: '100.00' });
  await financial('savings_contributions', { expense_id: ids.expenses, amount: '10.00' });
  await financial('debt_transactions', { debt_id: ids.debts, type: 'PAYMENT', amount: '100.00', month: '2099-01' });
  await financial('expense_transactions', { monthly_expense_id: ids.monthly_expenses, amount: '1.00' });
  await insert('allocation_sections', { allocation_id: ids.income_allocations, section_id: ids.sections, space_id: ids.space });
  await financial('notification_log', { expense_id: ids.expenses, channel: 'push', status: 'sent' });
  return ids;
}

describe('financial spaces migration — real isolated PostgreSQL', { concurrency: false }, () => {
  before(async () => {
    const admin = await localConnection();
    try { await admin.query(`CREATE DATABASE ${q(database)} TEMPLATE spaces_baseline17`); }
    finally { await admin.end(); }
    client = await localConnection(database);
    // Explicit fixtures with deleted/absent templates: backfill must use the
    // instance's owner, rather than dropping them through an inner parent join.
    await client.query("INSERT INTO monthly_expenses(user_id,name,amount,month,status) VALUES('fixture-parentless-owner','Fixture parentless expense',3.99,'2098-01','UPCOMING')");
    await client.query("INSERT INTO monthly_incomes(user_id,month,expected_amount,status) VALUES('fixture-parentless-owner','2098-01',1450,'EXPECTED')");
    original = await legacyFingerprint(client);
  });
  after(async () => {
    if (client) await client.end();
    const admin = await localConnection();
    try { await admin.query(`DROP DATABASE ${q(database)}`); }
    finally { await admin.end(); }
  });

  test('dry-run performs no catalog or data mutations', async () => {
    const beforeCatalog = (await client.query('SELECT count(*)::integer AS count FROM pg_class')).rows;
    const result = await runMigrations(client);
    assert.equal(result.mutations, 0);
    assert.deepEqual(result.issues, []);
    assert.deepEqual((await client.query('SELECT count(*)::integer AS count FROM pg_class')).rows, beforeCatalog);
    assert.equal((await client.query("SELECT to_regclass('public.financial_space_migrations') AS ledger")).rows[0].ledger, null);
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('an arbitrary client cannot opt into migration by spoofing its database name', async () => {
    const fake = { database, query: () => { throw new Error('Unverified SQL must not run'); } };
    await assert.rejects(runMigrations(fake, { dryRun:false }), /not verified/);
  });

  test('interrupted expansion rolls back both schema and migration ledger', async () => {
    await assert.rejects(runMigrations(client, { through: '001', dryRun: false, failAfter: '001-expand.sql' }), /Injected migration interruption/);
    const row = (await client.query("SELECT to_regclass('public.financial_spaces') AS spaces, to_regclass('public.financial_space_migrations') AS ledger")).rows[0];
    assert.deepEqual(row, { spaces: null, ledger: null });
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('interrupted backfill keeps expansion but no partial spaces or attribution', async () => {
    await runMigrations(client, { through: '001', dryRun: false });
    await assert.rejects(runMigrations(client, { dryRun: false, failAfter: '002-backfill.sql' }), /Injected migration interruption/);
    assert.equal(await phase(), 'expanded');
    assert.equal((await client.query('SELECT count(*)::integer AS count FROM financial_spaces')).rows[0].count, 0);
    assert.equal((await client.query('SELECT count(*)::integer AS count FROM expenses WHERE space_id IS NOT NULL')).rows[0].count, 0);
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('backfill preserves every original column, including parentless monthly instances', async () => {
    const result = await runMigrations(client, { dryRun: false });
    assert.equal(result.preserved, true);
    assert.equal(await phase(), 'backfilled');
    assert.deepEqual(await legacyFingerprint(client), original);
    for (const table of financialTables) {
      assert.equal((await client.query(`SELECT count(*)::integer AS count FROM ${q(table)} WHERE space_id IS NULL`)).rows[0].count, 0);
    }
    const mismatch = await client.query('SELECT count(*)::integer AS count FROM monthly_expenses r JOIN legacy_user_space_map m ON m.user_id=r.user_id WHERE r.space_id<>m.space_id');
    assert.equal(mismatch.rows[0].count, 0);
    mapping = (await client.query('SELECT user_id,space_id FROM legacy_user_space_map ORDER BY user_id')).rows;
    assert.ok(mapping.length > 1);
    assert.equal((await client.query('SELECT count(*)::integer AS count FROM financial_spaces WHERE name<>$1', ['Mes finances'])).rows[0].count, 0);
  });

  test('replaying backfill does not duplicate spaces or memberships', async () => {
    await runMigrations(client, { dryRun: false });
    assert.deepEqual((await client.query('SELECT user_id,space_id FROM legacy_user_space_map ORDER BY user_id')).rows, mapping);
    assert.equal((await client.query('SELECT count(*)::integer AS count FROM space_memberships')).rows[0].count, mapping.length);
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('two simultaneous runners serialize without duplicate provisioning', async () => {
    const other = await localConnection(database);
    try { await Promise.all([runMigrations(client,{dryRun:false}),runMigrations(other,{dryRun:false})]); }
    finally { await other.end(); }
    assert.deepEqual((await client.query('SELECT user_id,space_id FROM legacy_user_space_map ORDER BY user_id')).rows,mapping);
    assert.equal((await client.query('SELECT count(*)::integer AS count FROM space_memberships')).rows[0].count,mapping.length);
  });

  test('an altered applied checksum is rejected before any migration mutation', async () => {
    const recorded=(await client.query("SELECT checksum FROM financial_space_migrations WHERE name='001-expand.sql'")).rows[0].checksum;
    await client.query("UPDATE financial_space_migrations SET checksum='fixture-invalid-checksum' WHERE name='001-expand.sql'");
    try {
      await assert.rejects(runMigrations(client,{dryRun:false}),/Applied migration checksum changed/);
      assert.deepEqual(await legacyFingerprint(client),original);
    } finally { await client.query("UPDATE financial_space_migrations SET checksum=$1 WHERE name='001-expand.sql'",[recorded]); }
  });

  test('legacy settings and guide state are copied exactly; account preferences stay intact', async () => {
    assert.equal((await client.query(`SELECT count(*)::integer AS count FROM settings s JOIN legacy_user_space_map m ON m.user_id=s.user_id JOIN space_settings p ON p.space_id=m.space_id
      WHERE (s.default_currency,s.default_reminder_offsets,s.created_at,s.updated_at) IS DISTINCT FROM (p.default_currency,p.default_reminder_offsets,p.created_at,p.updated_at)`)).rows[0].count, 0);
    assert.equal((await client.query(`SELECT count(*)::integer AS count FROM setup_guide g JOIN legacy_user_space_map m ON m.user_id=g.user_id JOIN space_setup_guide p ON p.space_id=m.space_id
      WHERE (g.completed_at,g.dismissed_at,g.reset_at,g.created_at) IS DISTINCT FROM (p.completed_at,p.dismissed_at,p.reset_at,p.created_at)`)).rows[0].count, 0);
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('ambiguous owners stop migration without claiming or losing their rows', async () => {
    const id = uuid();
    await client.query("INSERT INTO expenses(id,user_id,name,amount,type) VALUES($1,'unclaimed','Fixture ambiguous',1,'ONE_TIME')", [id]);
    try {
      await assert.rejects(runMigrations(client, { dryRun: false }), error => error.issues?.some(issue => issue.kind === 'ambiguous-owner'));
      assert.equal((await client.query('SELECT space_id FROM expenses WHERE id=$1', [id])).rows[0].space_id, null);
      assert.equal((await client.query('SELECT count(*)::integer AS count FROM financial_spaces')).rows[0].count, mapping.length);
    } finally { await client.query('DELETE FROM expenses WHERE id=$1', [id]); }
  });

  test('cross-owner historical references and duplicate free savings are reported, never merged', async () => {
    const section = uuid(), expense = uuid(), free1 = uuid(), free2 = uuid();
    await client.query("INSERT INTO sections(id,user_id,name,position) VALUES($1,'fixture-historical-a','Fixture',0)", [section]);
    await client.query("INSERT INTO expenses(id,user_id,name,amount,type,section_id) VALUES($1,'fixture-historical-b','Fixture',1,'ONE_TIME',$2)", [expense, section]);
    await client.query("INSERT INTO expenses(id,user_id,name,amount,type,is_active) VALUES($1,'fixture-duplicate','Épargne libre',0,'PLANNED',true),($2,'fixture-duplicate','Épargne libre',0,'PLANNED',true)", [free1, free2]);
    try {
      const issues = await preflight(client);
      assert.ok(issues.some(issue => issue.kind === 'cross-owner-reference' && issue.column === 'section_id'));
      assert.ok(issues.some(issue => issue.kind === 'duplicate-free-savings'));
      await assert.rejects(runMigrations(client, { dryRun: false }), /preflight failed/);
    } finally {
      await client.query('DELETE FROM expenses WHERE id=ANY($1::uuid[])', [[expense, free1, free2]]);
      await client.query('DELETE FROM sections WHERE id=$1', [section]);
    }
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('interrupted final cutover rolls back NOT NULL and composite constraints together', async () => {
    await assert.rejects(runMigrations(client, { through: '003', dryRun: false, allowCutover: true, failAfter: '003-isolation.sql' }), /Injected migration interruption/);
    assert.equal(await phase(), 'backfilled');
    assert.equal((await client.query("SELECT is_nullable FROM information_schema.columns WHERE table_name='expenses' AND column_name='space_id'")).rows[0].is_nullable, 'YES');
    assert.deepEqual(await legacyFingerprint(client), original);
  });

  test('later changes and newly appearing settings/guide are refreshed by the final pass', async () => {
    const existing = (await client.query('SELECT user_id FROM settings ORDER BY user_id LIMIT 1')).rows[0].user_id;
    const appearing = 'fixture-parentless-owner';
    await client.query("UPDATE settings SET default_currency='USD',default_reminder_offsets=NULL,updated_at='2099-01-02T03:04:05Z' WHERE user_id=$1",[existing]);
    await client.query("INSERT INTO settings(user_id,default_currency,default_reminder_offsets,created_at,updated_at) VALUES($1,NULL,ARRAY[2,8],NULL,NULL)",[appearing]);
    await client.query("INSERT INTO setup_guide(user_id,completed_at,dismissed_at,reset_at,created_at) VALUES($1,NULL,'2099-01-01T00:00:00Z',NULL,'2098-01-01T00:00:00Z') ON CONFLICT(user_id) DO UPDATE SET completed_at=NULL,dismissed_at=EXCLUDED.dismissed_at,reset_at=NULL,created_at=EXCLUDED.created_at",[existing]);
    await client.query("INSERT INTO setup_guide(user_id,completed_at,dismissed_at,reset_at,created_at) VALUES($1,'2099-02-01T00:00:00Z',NULL,NULL,NULL)",[appearing]);
    await runMigrations(client,{dryRun:false});
    const mismatches = await client.query(`SELECT count(*)::integer AS count FROM settings s JOIN legacy_user_space_map m ON m.user_id=s.user_id JOIN space_settings p ON p.space_id=m.space_id
      WHERE (s.default_currency,s.default_reminder_offsets,s.created_at,s.updated_at) IS DISTINCT FROM (p.default_currency,p.default_reminder_offsets,p.created_at,p.updated_at)`);
    assert.equal(mismatches.rows[0].count,0);
    const guideMismatches = await client.query(`SELECT count(*)::integer AS count FROM setup_guide g JOIN legacy_user_space_map m ON m.user_id=g.user_id JOIN space_setup_guide p ON p.space_id=m.space_id
      WHERE (g.completed_at,g.dismissed_at,g.reset_at,g.created_at) IS DISTINCT FROM (p.completed_at,p.dismissed_at,p.reset_at,p.created_at)`);
    assert.equal(guideMismatches.rows[0].count,0);
    original = await legacyFingerprint(client);
  });

  test('final pass catches newly written legacy rows before enforcing isolation', async () => {
    const id = uuid();
    const owner = mapping[0].user_id;
    const existing=(await client.query('SELECT user_id FROM settings ORDER BY user_id LIMIT 1')).rows[0].user_id;
    await client.query("UPDATE settings SET default_currency='EUR',default_reminder_offsets=ARRAY[4,9],updated_at=NULL WHERE user_id=$1",[existing]);
    await client.query("INSERT INTO settings(user_id,default_currency,default_reminder_offsets,created_at,updated_at) VALUES('fixture-final-config-owner','USD',NULL,NULL,NULL)");
    await client.query("INSERT INTO setup_guide(user_id,completed_at,dismissed_at,created_at) VALUES('fixture-final-config-owner',NULL,'2099-03-01T00:00:00Z',NULL)");
    await client.query("INSERT INTO expenses(id,user_id,name,amount,type) VALUES($1,$2,'Fixture late legacy write',3.99,'ONE_TIME')", [id, owner]);
    try {
      const writer = await localConnection(database);
      let attempt;
      try {
        const pid = (await writer.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
        await writer.query("SET lock_timeout='5s'");
        await runMigrations(client, { through:'003',dryRun:false,allowCutover:true,onBeforeCutover:async () => {
          attempt = writer.query("INSERT INTO expenses(user_id,name,amount,type) VALUES($1,'Fixture concurrent legacy write',1,'ONE_TIME')",[owner]).then(()=>({success:true}),error=>({code:error.code}));
          let waiting=false;
          for(let index=0;index<100;index++) {
            waiting=(await client.query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=$1 AND relation='expenses'::regclass AND NOT granted) AS waiting",[pid])).rows[0].waiting;
            if(waiting) break;
            await delay(5);
          }
          assert.equal(waiting,true,'Concurrent writer must actually be observed waiting on the migration lock.');
        }});
        assert.deepEqual(await attempt,{code:'23502'});
      } finally { await writer.end(); }
      assert.equal(await phase(), 'ready');
      assert.equal((await client.query('SELECT space_id FROM expenses WHERE id=$1', [id])).rows[0].space_id, mapping[0].space_id);
      assert.equal((await client.query(`SELECT count(*)::integer AS count FROM settings s JOIN legacy_user_space_map m ON m.user_id=s.user_id JOIN space_settings p ON p.space_id=m.space_id
        WHERE (s.default_currency,s.default_reminder_offsets,s.created_at,s.updated_at) IS DISTINCT FROM (p.default_currency,p.default_reminder_offsets,p.created_at,p.updated_at)`)).rows[0].count,0);
      assert.equal((await client.query(`SELECT count(*)::integer AS count FROM setup_guide g JOIN legacy_user_space_map m ON m.user_id=g.user_id JOIN space_setup_guide p ON p.space_id=m.space_id
        WHERE (g.completed_at,g.dismissed_at,g.reset_at,g.created_at) IS DISTINCT FROM (p.completed_at,p.dismissed_at,p.reset_at,p.created_at)`)).rows[0].count,0);
    } finally { await client.query('DELETE FROM expenses WHERE id=$1', [id]); }
    original=await legacyFingerprint(client);
  });

  test('all 18 cross-space parent references are rejected by the specific composite FK', async () => {
    await client.query('BEGIN');
    try {
      const a = await seedSpace('fixture-member-a'), b = await seedSpace('fixture-member-b','2099-02');
      const relations = [
        ['expenses','section_id','sections'],['expenses','card_id','cards'],
        ['debts','section_id','sections'],['debts','card_id','cards'],
        ['monthly_expenses','expense_id','expenses'],['monthly_expenses','debt_id','debts'],
        ['monthly_expenses','section_id','sections'],['monthly_expenses','card_id','cards'],
        ['monthly_incomes','income_id','incomes'],['income_allocations','section_id','sections'],
        ['income_allocations','project_id','expenses'],['monthly_allocations','allocation_id','income_allocations'],
        ['savings_contributions','expense_id','expenses'],['debt_transactions','debt_id','debts'],
        ['expense_transactions','monthly_expense_id','monthly_expenses'],
        ['allocation_sections','allocation_id','income_allocations'],['allocation_sections','section_id','sections'],
        ['notification_log','expense_id','expenses'],
      ];
      for (const [table,column,parent] of relations) {
        const where = table === 'allocation_sections' ? 'allocation_id=$2 AND section_id=$3' : 'id=$2';
        const values = table === 'allocation_sections' ? [b[parent],a.income_allocations,a.sections] : [b[parent],a[table]];
        await expectSqlFailure(`UPDATE ${q(table)} SET ${q(column)}=$1 WHERE ${where}`, values, '23503', table+'_'+column+'_fkey');
      }
    } finally { await client.query('ROLLBACK'); }
  });

  test('optional parent deletion clears only its reference and preserves the space', async () => {
    await client.query('BEGIN');
    try {
      const a = await seedSpace('fixture-delete-a'), b = await seedSpace('fixture-delete-b');
      await client.query('DELETE FROM cards WHERE id=$1', [a.cards]);
      for (const table of ['expenses','debts','monthly_expenses']) {
        assert.deepEqual((await client.query(`SELECT card_id,space_id FROM ${q(table)} WHERE id=$1`, [a[table]])).rows[0], { card_id:null, space_id:a.space });
        assert.equal((await client.query(`SELECT card_id FROM ${q(table)} WHERE id=$1`, [b[table]])).rows[0].card_id,b.cards);
      }
      await client.query('DELETE FROM incomes WHERE id=$1', [a.incomes]);
      assert.equal((await client.query('SELECT count(*)::integer AS count FROM monthly_incomes WHERE id=$1', [a.monthly_incomes])).rows[0].count,0);
      assert.equal((await client.query('SELECT count(*)::integer AS count FROM monthly_incomes WHERE id=$1', [b.monthly_incomes])).rows[0].count,1);
    } finally { await client.query('ROLLBACK'); }
  });

  test('every financial table requires a space; free savings uniqueness survives renaming', async () => {
    await client.query('BEGIN');
    try {
      const a = await seedSpace('fixture-not-null');
      for (const table of financialTables) {
        const where = table === 'allocation_sections' ? 'allocation_id=$1' : 'id=$1';
        await expectSqlFailure(`UPDATE ${q(table)} SET space_id=NULL WHERE ${where}`, [table === 'allocation_sections' ? a.income_allocations : a[table]], '23502');
      }
      await client.query("UPDATE expenses SET name='Renamed savings',system_kind='FREE_SAVINGS' WHERE id=$1", [a.expenses]);
      await expectSqlFailure("INSERT INTO expenses(user_id,space_id,name,amount,type,system_kind) VALUES('fixture-not-null',$1,'Another savings',0,'PLANNED','FREE_SAVINGS')",[a.space],'23505','expenses_free_savings_space_key');
    } finally { await client.query('ROLLBACK'); }
  });

  test('a replay after shared contributions never reattributes data to its author', async () => {
    const a = await seedSpace('fixture-shared-a');
    await client.query('INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)', [a.space,'fixture-shared-b']);
    await client.query('UPDATE savings_contributions SET user_id=$1 WHERE id=$2', ['fixture-shared-b',a.savings_contributions]);
    const before = await legacyFingerprint(client);
    await runMigrations(client, { through:'003',dryRun:false,allowCutover:true });
    assert.deepEqual(await legacyFingerprint(client), before);
    assert.equal((await client.query('SELECT space_id FROM savings_contributions WHERE id=$1',[a.savings_contributions])).rows[0].space_id,a.space);
  });
});
