import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it.each([
  ['development', 'local-fixture', false],
  ['development', '', true],
  ['production', 'local-fixture', true],
  ['production', '', true],
] as const)('HSTS policy for %s/%s', async (mode, driver, expected) => {
  vi.stubEnv('NODE_ENV', mode);
  vi.stubEnv('MES_FINANCES_DB_DRIVER', driver);
  vi.resetModules();
  const config = (await import('../next.config')).default;
  const rules = await config.headers!();
  const general = rules.find(rule => rule.source === '/(.*)');
  expect(general?.headers.some(header => header.key === 'Strict-Transport-Security')).toBe(expected);
  expect(general?.headers.some(header => header.key === 'X-Content-Type-Options' && header.value === 'nosniff')).toBe(true);
});
