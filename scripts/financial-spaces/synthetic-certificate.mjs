/** Certify schema as well as rows; a stale fixture must never be silently repaired. */
import { createHash, randomUUID } from 'node:crypto';
import { assertLocalFixtureClient } from './local-fixture.mjs';
import { legacyFingerprint } from './migrate.mjs';

export async function schemaInventory(client) {
  const queries = {
    tables: `SELECT relname,relkind,relpersistence,relrowsecurity,relforcerowsecurity
      FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p','v','m','S')`,
    columns: `SELECT c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,
        a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid) AS default_value
      FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
      LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p','v','m') AND a.attnum>0 AND NOT a.attisdropped`,
    constraints: `SELECT c.relname,k.conname,k.contype,k.convalidated,pg_get_constraintdef(k.oid) AS definition
      FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid WHERE c.relnamespace='public'::regnamespace`,
    indexes: `SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public'`,
    enums: `SELECT t.typname,e.enumsortorder,e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid WHERE t.typnamespace='public'::regnamespace`,
    extensions: `SELECT e.extname,e.extversion,n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace`,
    functions: `SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prokind='f'
        AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')`,
    triggers: `SELECT c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t
      JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='public'::regnamespace AND NOT t.tgisinternal`,
  };
  const inventory = {};
  for (const [name, query] of Object.entries(queries)) inventory[name] = (await client.query(query)).rows;
  return inventory;
}

export function schemaInventoryFingerprint(inventory) {
  const hash = createHash('sha256');
  for (const [name, rows] of Object.entries(inventory)) {
    hash.update(name + '\n');
    for (const row of rows.map(row => JSON.stringify(row)).sort()) hash.update(row + '\n');
  }
  return hash.digest('hex');
}

export async function schemaFingerprint(client) {
  return schemaInventoryFingerprint(await schemaInventory(client));
}

/** Canonicalize source CHECKs only on an empty TEMP table in a verified copy.
 * Every other catalog field remains strict, including validation state/name.
 * The immutable source inventory/hash is never changed by this comparison.
 */
export async function verifyRestoredSchema(client, sourceInventory) {
  const database = assertLocalFixtureClient(client);
  if (!/^spaces_migration_test_[a-f0-9]{8}$/.test(database)) throw new Error('Restore verification requires a disposable verified copy.');
  const expected = structuredClone(sourceInventory);
  const quote = value => '"' + value.replaceAll('"', '""') + '"';
  await client.query('BEGIN');
  let checks = 0;
  try {
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL search_path=public,pg_catalog");
    for (const constraint of expected.constraints) {
      if (constraint.contype !== 'c') continue;
      const temporary = quote('restore_check_' + randomUUID().replaceAll('-', ''));
      await client.query(`CREATE TEMP TABLE ${temporary} (LIKE public.${quote(constraint.relname)}) ON COMMIT DROP`);
      await client.query(`ALTER TABLE ${temporary} ADD CONSTRAINT restore_expected ${constraint.definition}`);
      constraint.definition = (await client.query('SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=$1::regclass AND conname=$2', [temporary, 'restore_expected'])).rows[0].definition;
      checks++;
    }
    const actual = await schemaInventory(client);
    if (schemaInventoryFingerprint(actual) !== schemaInventoryFingerprint(expected)) throw new Error('Restored schema differs beyond PostgreSQL CHECK normalization.');
    return { canonicalChecks: checks, matched: true, restoredSchema: schemaInventoryFingerprint(actual) };
  } finally { await client.query('ROLLBACK'); }
}

export async function verifySyntheticCertificate(client, marker, checksum) {
  if (marker?.kind !== 'mes-finances-synthetic-v1' || marker.checksum !== checksum
    || marker.schemaFingerprint !== await schemaFingerprint(client)
    || JSON.stringify(marker.fingerprint) !== JSON.stringify(await legacyFingerprint(client))) {
    throw new Error('Existing synthetic baseline differs; preserving it without overwriting.');
  }
}
