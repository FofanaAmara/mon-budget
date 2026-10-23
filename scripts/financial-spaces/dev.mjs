/** Start the real Next app against the owned local copy; preserve .env.local. */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';
import { restoreGeneratedConfigs } from './generated-config.mjs';
import { root, localConnection, port, username, password } from './local-fixture.mjs';

if (process.argv.length > 2) throw new Error('This recipe accepts no database URL or arbitrary arguments.');
const client = await localConnection('spaces_work17');
let identifier;
try { identifier = (await client.query('SELECT system_identifier::text FROM pg_control_system()')).rows[0].system_identifier; }
finally { await client.end(); }

const inherited = { ...process.env, ...dotenv.parse(fs.readFileSync(path.join(root, '.env.local'))) };
const environment = Object.fromEntries(Object.entries(inherited).filter(([key]) =>
  !key.startsWith('PG') && !key.startsWith('POSTGRES_') && !/^(DATABASE_URL|NEON_DATABASE_URL)/.test(key)));
const localUrl = `postgresql://${username}:${password}@127.0.0.1:${port}/spaces_work17`;
Object.assign(environment, {
  POSTGRES_URL: localUrl, POSTGRES_URL_NON_POOLING: localUrl,
  MES_FINANCES_DB_DRIVER: 'local-fixture', MES_FINANCES_LOCAL_SYSTEM_ID: identifier,
  MES_FINANCES_BUILD_DIR: '.next-spaces-dev', MES_FINANCES_MAIL_TRANSPORT: 'mailpit',
});

const originals = new Map(['tsconfig.json', 'next-env.d.ts'].map(file => [file, fs.readFileSync(path.join(root, file))]));
function restoreGeneratedFiles() {
  restoreGeneratedConfigs(root, originals);
}

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3002'], {
  cwd: root, env: environment, stdio: ['inherit', 'pipe', 'inherit'],
});
child.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  if (/Ready in/.test(chunk.toString().replace(/\x1b\[[0-9;]*m/g, ''))) {
    try {
      // Next can announce Ready again after a config-triggered restart.
      restoreGeneratedFiles();
      console.log('Local fixture verified; .env.local and generated compiler files preserved. App: http://localhost:3002');
    } catch (error) { console.error(error.message); child.kill('SIGTERM'); process.exitCode = 1; }
  }
});
// Next 16.4 may generate files after Ready. Watch strictly validated changes,
// rather than treating Ready as the end of its compiler setup.
const watched = [...originals.keys()].map(file => path.join(root, file));
for (const file of watched) {
  fs.watchFile(file, { interval: 250, persistent: false }, () => {
    try {
      restoreGeneratedFiles();
    } catch (error) {
      console.error(error.message);
      child.kill('SIGTERM');
      process.exitCode = 1;
    }
  });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => {
  for (const file of watched) fs.unwatchFile(file);
  try { restoreGeneratedFiles(); } catch (error) { console.error(error.message); process.exitCode = 1; }
  process.exitCode ??= code ?? 1;
});
