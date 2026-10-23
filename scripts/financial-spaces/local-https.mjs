import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { X509Certificate, createPrivateKey } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const recipeHttpsOrigin = 'https://localhost:3443';

/** Project-only certificate. Never invokes mkcert -install or modifies a trust store. */
export function localHttpsCertificate(root) {
  const directory = path.join(root, '.local', 'financial-spaces', 'https');
  const key = path.join(directory, 'localhost-key.pem');
  const cert = path.join(directory, 'localhost.pem');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  if (fs.existsSync(key) !== fs.existsSync(cert)) {
    throw new Error('Local HTTPS certificate is incomplete. Preserve the existing files before repairing the pair.');
  }
  if (!fs.existsSync(key)) {
    const config = path.join(directory, 'openssl.cnf');
    fs.writeFileSync(config, `[req]
distinguished_name=subject
x509_extensions=extensions
prompt=no
[subject]
CN=localhost
[extensions]
subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
`, { mode: 0o600 });
    const generated = spawnSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-sha256', '-nodes', '-days', '30',
      '-keyout', key, '-out', cert, '-config', config,
    ], { stdio: 'pipe' });
    if (fs.existsSync(key)) fs.chmodSync(key, 0o600);
    if (generated.error || generated.status !== 0) {
      throw new Error('Local HTTPS certificate generation failed. Check OpenSSL; existing files have been preserved.');
    }
    fs.chmodSync(cert, 0o600);
  }
  const certificate = new X509Certificate(fs.readFileSync(cert));
  if (!certificate.checkHost('localhost') || !certificate.checkIP('127.0.0.1') ||
      !certificate.checkPrivateKey(createPrivateKey(fs.readFileSync(key))) ||
      Date.parse(certificate.validFrom) > Date.now() || Date.parse(certificate.validTo) <= Date.now()) {
    throw new Error('Local HTTPS certificate is invalid or expired. Preserve and renew the project certificate pair before restarting.');
  }
  return { key, cert };
}

/** Keep old recipe and emailed links usable, without copying cookies or credentials. */
export function recipeHttpRedirect(req, res) {
  const incoming = new URL(req.url || '/', 'http://localhost:3002');
  res.writeHead(307, {
    Location: recipeHttpsOrigin + incoming.pathname + incoming.search,
    'Cache-Control': 'no-store',
  });
  res.end();
}

export function startRecipeHttpRedirect(onError) {
  const server = http.createServer(recipeHttpRedirect);
  server.on('error', onError);
  server.listen(3002, '127.0.0.1');
  return server;
}
