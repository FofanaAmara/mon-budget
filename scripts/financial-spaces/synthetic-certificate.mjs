/** Certify schema as well as rows; a stale fixture must never be silently repaired. */
import { createHash } from 'node:crypto';
import { legacyFingerprint } from './migrate.mjs';

export async function schemaFingerprint(client) {
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
  const hash = createHash('sha256');
  for (const [name, query] of Object.entries(queries)) {
    const { rows } = await client.query(query);
    hash.update(name + '\n');
    for (const row of rows.map(row => JSON.stringify(row)).sort()) hash.update(row + '\n');
  }
  return hash.digest('hex');
}

export async function verifySyntheticCertificate(client, marker, checksum) {
  if (marker?.kind !== 'mes-finances-synthetic-v1' || marker.checksum !== checksum
    || marker.schemaFingerprint !== await schemaFingerprint(client)
    || JSON.stringify(marker.fingerprint) !== JSON.stringify(await legacyFingerprint(client))) {
    throw new Error('Existing synthetic baseline differs; preserving it without overwriting.');
  }
}
