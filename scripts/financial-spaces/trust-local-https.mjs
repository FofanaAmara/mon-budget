import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { X509Certificate, createPrivateKey } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Trust one existing leaf for localhost SSL, never a CA or the admin store. */
export function certificateTrustPlan(root, home, platform = process.platform) {
  if (platform !== 'darwin') throw new Error('This command is for the macOS user keychain only.');
  const directory = path.join(root, '.local/financial-spaces/https');
  const certPath = path.join(directory, 'localhost.pem');
  const pem = fs.readFileSync(certPath, 'utf8');
  if ((pem.match(/-----BEGIN CERTIFICATE-----/g) ?? []).length !== 1)
    throw new Error('Expected exactly one project leaf certificate.');
  const cert = new X509Certificate(pem);
  if (cert.ca || !cert.verify(cert.publicKey) || !cert.checkHost('localhost') ||
      !cert.checkIP('127.0.0.1') || !cert.checkPrivateKey(createPrivateKey(
        fs.readFileSync(path.join(directory, 'localhost-key.pem')),
      )) || Date.parse(cert.validFrom) > Date.now() || Date.parse(cert.validTo) <= Date.now()) {
    throw new Error('Refusing an invalid, expired, mismatched or CA certificate.');
  }
  const keychain = path.join(home, 'Library/Keychains/login.keychain-db');
  return {
    fingerprint: cert.fingerprint256,
    validUntil: cert.validTo,
    certificate: certPath,
    keychain,
    args: ['add-trusted-cert', '-r', 'trustRoot', '-p', 'ssl', '-s', 'localhost', '-k', keychain, certPath],
  };
}

if (process.argv[1] && fs.realpathSync(path.resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== '--install'))
    throw new Error('Only --install is accepted. Without it, no trust setting is changed.');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const plan = certificateTrustPlan(root, os.homedir());
  console.log(`Certificate: ${plan.certificate}\nSHA-256: ${plan.fingerprint}\nValid until: ${plan.validUntil}`);
  console.log(`Scope: localhost SSL only, current user keychain: ${plan.keychain}`);
  if (args[0] !== '--install') {
    console.log('Trust unchanged. To install this exact certificate yourself: npm run dev:spaces:trust -- --install');
  } else {
    const result = spawnSync('/usr/bin/security', plan.args, { stdio: 'inherit' });
    if (result.error || result.status !== 0) {
      console.error('Certificate trust installation failed; HTTPS validation is not established.');
      process.exitCode = 1;
    } else {
      console.log('User trust configured. Reload https://localhost:3443 and verify the browser reports no certificate warning.');
    }
  }
}
