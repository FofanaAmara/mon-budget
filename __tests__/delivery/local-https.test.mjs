import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';
import { localHttpsCertificate, recipeHttpRedirect } from '../../scripts/financial-spaces/local-https.mjs';

test('local HTTPS creates a restricted non-CA certificate and reuses the same pair', () => {
  const parent = path.resolve('.local/safari-auth');
  fs.mkdirSync(parent, { recursive: true });
  const root = fs.mkdtempSync(path.join(parent, 'certificate-test-'));
  const result = localHttpsCertificate(root);
  const original = fs.readFileSync(result.key);
  const cert = new X509Certificate(fs.readFileSync(result.cert));
  assert.equal(cert.ca, false);
  assert.ok(cert.checkHost('localhost'));
  assert.ok(cert.checkIP('127.0.0.1'));
  assert.equal(fs.statSync(result.key).mode & 0o777, 0o600);
  assert.deepEqual(localHttpsCertificate(root), result);
  assert.deepEqual(fs.readFileSync(result.key), original);
  fs.unlinkSync(result.cert);
  assert.throws(() => localHttpsCertificate(root), /incomplete/);
  assert.deepEqual(fs.readFileSync(result.key), original);
  fs.rmSync(root, { recursive: true });
});

test('legacy links keep path/query and cannot select an external redirect host', () => {
  for (const requestUrl of ['/invitation/fake.token?source=mail', '//untrusted.example/path', 'http://untrusted.example/auth/sign-in?redirectTo=hello']) {
    let status, headers;
    recipeHttpRedirect({ url: requestUrl }, {
      writeHead: (s, h) => { status = s; headers = h; }, end() {},
    });
    assert.equal(status, 307);
    const destination = new URL(headers.Location);
    assert.equal(destination.origin, 'https://localhost:3443');
    assert.equal(destination.pathname, new URL(requestUrl, 'http://localhost:3002').pathname);
    assert.equal(destination.search, new URL(requestUrl, 'http://localhost:3002').search);
    assert.equal(headers['Cache-Control'], 'no-store');
  }
});
