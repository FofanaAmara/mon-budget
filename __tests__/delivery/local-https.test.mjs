import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { X509Certificate } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { localHttpsCertificate, recipeHttpRedirect } from '../../scripts/financial-spaces/local-https.mjs';
import { certificateTrustPlan } from '../../scripts/financial-spaces/trust-local-https.mjs';

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

test('certificate trust is limited to one valid matching leaf and localhost SSL for the user', () => {
  const parent = path.resolve('.local/safari-auth');
  fs.mkdirSync(parent, { recursive: true });
  const root = fs.mkdtempSync(path.join(parent, 'trust-test-'));
  const other = fs.mkdtempSync(path.join(parent, 'other-key-test-'));
  try {
    const leaf = localHttpsCertificate(root);
    const plan = certificateTrustPlan(root, '/fixture-user', 'darwin');
    assert.deepEqual(plan.args, ['add-trusted-cert', '-r', 'trustRoot', '-p', 'ssl', '-s', 'localhost',
      '-k', '/fixture-user/Library/Keychains/login.keychain-db', leaf.cert]);
    assert.equal(plan.fingerprint, new X509Certificate(fs.readFileSync(leaf.cert)).fingerprint256);
    assert.throws(() => certificateTrustPlan(root, '/fixture-user', 'linux'), /macOS user keychain/);
    const pem = fs.readFileSync(leaf.cert);
    fs.appendFileSync(leaf.cert, pem);
    assert.throws(() => certificateTrustPlan(root, '/fixture-user', 'darwin'), /exactly one/);
    fs.writeFileSync(leaf.cert, pem);
    const otherLeaf = localHttpsCertificate(other);
    fs.copyFileSync(otherLeaf.key, leaf.key);
    assert.throws(() => certificateTrustPlan(root, '/fixture-user', 'darwin'), /mismatched/);
    const caConfig = path.join(other, '.local/financial-spaces/https/openssl.cnf');
    fs.writeFileSync(caConfig, fs.readFileSync(caConfig, 'utf8')
      .replace('CA:FALSE', 'CA:TRUE')
      .replace('digitalSignature,keyEncipherment', 'digitalSignature,keyEncipherment,keyCertSign,cRLSign'));
    const ca = spawnSync('openssl', ['req', '-x509', '-new', '-sha256', '-days', '1',
      '-key', otherLeaf.key, '-out', leaf.cert, '-config', caConfig], { encoding: 'utf8' });
    assert.equal(ca.status, 0, ca.stderr);
    assert.throws(() => certificateTrustPlan(root, '/fixture-user', 'darwin'), /CA certificate/);
  } finally {
    fs.rmSync(root, { recursive: true });
    fs.rmSync(other, { recursive: true });
  }
});

test('certificate setup CLI is a dry run by default and rejects unexpected flags', () => {
  const parent = path.resolve('.local/safari-auth');
  fs.mkdirSync(parent, { recursive: true });
  const root = fs.mkdtempSync(path.join(parent, 'trust-cli-test-'));
  try {
    localHttpsCertificate(root);
    const script = path.join(root, 'scripts/financial-spaces/trust-local-https.mjs');
    fs.mkdirSync(path.dirname(script), { recursive: true });
    fs.copyFileSync('scripts/financial-spaces/trust-local-https.mjs', script);
    const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
    if (process.platform === 'darwin') {
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Trust unchanged/);
    } else {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /macOS user keychain/);
    }
    const rejected = spawnSync(process.execPath, [script, '--install', '--all-hosts'], { encoding: 'utf8' });
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /Only --install/);
  } finally {
    fs.rmSync(root, { recursive: true });
  }
});
