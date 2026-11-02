import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { productionConnectionOptions, validateReleaseProof, privateReleaseFile } from '../../scripts/financial-spaces/production-migration.mjs';
import { directory } from '../../scripts/financial-spaces/local-fixture.mjs';

const target = { host: 'ep-release-123.eu-west-2.aws.neon.tech', database: 'neondb', user: 'release_owner' };
const url = 'postgresql://release_owner:fixture-only@' + target.host + '/neondb?sslmode=require&channel_binding=require';

test('production connection pins the direct endpoint, database and user with certificate validation', () => {
  const options = productionConnectionOptions(url, target);
  assert.equal(options.host, target.host);
  assert.equal(options.database, target.database);
  assert.equal(options.user, target.user);
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(options.connectionString, undefined);
});

test('wrong target, pooled host, overridden parameters and missing TLS fail before connection', () => {
  for (const value of [url.replace(target.host, 'localhost'), url.replace('ep-release-123.', 'ep-release-123-pooler.'),
    url.replace('/neondb?', '/other?'), url.replace('release_owner:', 'other:'),
    url + '&host=other.neon.tech', url + '&ssl=false', url + '#fragment', url.replace('sslmode=require', 'sslmode=disable')]) {
    assert.throws(() => productionConnectionOptions(value, target), /production target/);
  }
});

test('apply refuses stale backup rows, schema, rehearsal, migration hashes or maintenance evidence', () => {
  const fingerprint = { expenses: { count: 2, sha256: 'rows' } };
  const files = [{ name: '001-expand.sql', checksum: 'sql' }];
  const proof = { restored: true, preserved: true, backupSha256: 'a'.repeat(64),
    sourceFingerprint: fingerprint, sourceState: fingerprint, sourceSchema: 'schema', migrations: files };
  assert.doesNotThrow(() => validateReleaseProof(proof, { fingerprint, state: fingerprint, schema: 'schema', files, cutover: true, writersStopped: true }));
  for (const patch of [{ restored: false }, { preserved: false }, { backupSha256: '' },
    { sourceFingerprint: {} }, { sourceState: {} }, { sourceSchema: 'changed' }, { migrations: [] }]) {
    assert.throws(() => validateReleaseProof({ ...proof, ...patch }, { fingerprint, state: fingerprint, schema: 'schema', files, cutover: true, writersStopped: true }), /release proof/);
  }
  assert.throws(() => validateReleaseProof(proof, { fingerprint, state: fingerprint, schema: 'schema', files, cutover: true, writersStopped: false }), /writers/);
});

test('private release storage accepts the canonical shared fixture parent and refuses symlink escapes', () => {
  const root = path.join(path.dirname(directory), 'production-release');
  fs.mkdirSync(root, { recursive: true });
  const owned = fs.mkdtempSync(path.join(root, 'path-guard-'));
  try {
    assert.equal(privateReleaseFile(path.join(owned, 'report.json')), path.join(owned, 'report.json'));
    assert.throws(() => privateReleaseFile(path.join(root, '..', 'escape.json')), /private release directory/);
    const link = path.join(owned, 'linked.json');
    fs.symlinkSync(path.join(owned, 'elsewhere.json'), link);
    assert.throws(() => privateReleaseFile(link), /Symlinked/);
  } finally { fs.rmSync(owned, { recursive: true }); }
});
