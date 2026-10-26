/** All SQL writes from migration tooling must pass this local-server identity guard. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { setTimeout as delay } from 'node:timers/promises';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const configuredDirectory = path.join(root, '.local/financial-spaces');
// Durable worktrees may share the owned fixture through an ignored symlink.
// Compare the real mount path, retaining port/label/system-identifier checks.
export const directory = fs.existsSync(configuredDirectory) ? fs.realpathSync(configuredDirectory) : configuredDirectory;
export const container = 'mon-budget-spaces-test-01a165b5';
export const owner = 'financial-spaces-01a165b5';
export const image = 'postgres:17-alpine';
export const port = 55437;
export const username = 'budget_test';
export const password = 'local-fixture-only';
export const databaseNames = ['spaces_baseline17', 'spaces_work17'];
const verifiedClients = new WeakMap();

/** Official image bootstrap exposes Unix before the final TCP server starts. */
export async function waitForFixtureReady({ run = spawnSync, pause = delay } = {}) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const result = run('docker', ['exec', container, 'pg_isready', '-h', '127.0.0.1',
      '-p', '5432', '-U', username, '-d', 'postgres', '-t', '1'], { stdio: 'ignore' });
    if (result.status === 0) return;
    await pause(250);
  }
  throw new Error('Local PostgreSQL TCP fixture did not become ready.');
}

/** Test templates are fixed names; an arbitrary database/URL is never accepted. */
export function testBaseline() {
  const profile = process.env.MES_FINANCES_TEST_BASELINE ?? 'private';
  if (!['private', 'synthetic'].includes(profile)) throw new Error('Unknown test baseline profile.');
  if (process.env.CI && profile !== 'synthetic') throw new Error('CI requires the synthetic test baseline.');
  return profile === 'synthetic' ? 'spaces_ci_baseline17' : 'spaces_baseline17';
}

export function assertLocalFixtureClient(client) {
  const database = verifiedClients.get(client);
  if (!database) throw new Error('Refusing a SQL client not verified against the owned local fixture.');
  return database;
}

export function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) throw new Error('Docker operation failed; no source credentials printed.');
  return result.stdout?.trim() ?? '';
}

export function assertOwned() {
  const [value] = JSON.parse(docker(['inspect', container]));
  const bindings = value.HostConfig?.PortBindings?.['5432/tcp'];
  const mount = value.Mounts?.find(item => item.Destination === '/fixture');
  if (value.Config?.Labels?.['codex.task'] !== owner
    || bindings?.length !== 1 || bindings[0].HostIp !== '127.0.0.1'
    || bindings[0].HostPort !== String(port)
    || mount?.Type !== 'bind' || path.resolve(mount.Source) !== directory) {
    throw new Error('Refusing a fixture with unexpected ownership, port or mount.');
  }
}

export async function localConnection(database = 'postgres') {
  assertOwned();
  const client = new pg.Client({ host: '127.0.0.1', port, user: username, password, database });
  await client.connect();
  try {
    const expected = docker(['exec', container, 'psql', '-U', username, '-d', 'postgres', '-Atc',
      'SELECT system_identifier::text FROM pg_control_system()']);
    const actual = await client.query('SELECT system_identifier::text FROM pg_control_system()');
    if (actual.rows[0]?.system_identifier !== expected) throw new Error('Refusing a different PostgreSQL server.');
    await client.query("SET TIME ZONE 'UTC'");
    verifiedClients.set(client, database);
  } catch (error) { await client.end(); throw error; }
  return client;
}
