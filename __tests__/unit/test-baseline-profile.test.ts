import { afterEach, describe, expect, it, vi } from 'vitest';
import { testBaseline } from '../../scripts/financial-spaces/local-fixture.mjs';

afterEach(() => vi.unstubAllEnvs());
describe('test database template isolation', () => {
  it('uses the private historical copy only outside CI by default', () => {
    vi.stubEnv('CI', '');
    vi.stubEnv('MES_FINANCES_TEST_BASELINE', undefined);
    expect(testBaseline()).toBe('spaces_baseline17');
  });
  it('maps the synthetic profile to a distinct fixed template', () => {
    vi.stubEnv('MES_FINANCES_TEST_BASELINE', 'synthetic');
    expect(testBaseline()).toBe('spaces_ci_baseline17');
  });
  it('refuses arbitrary database names and URLs', () => {
    for (const profile of ['spaces_work17', 'spaces_baseline17', 'postgresql://example.test/db', 'synthetic; DROP DATABASE spaces_work17']) {
      vi.stubEnv('MES_FINANCES_TEST_BASELINE', profile);
      expect(() => testBaseline()).toThrow('Unknown test baseline profile');
    }
  });
  it('fails closed if CI would use a private backup', () => {
    vi.stubEnv('CI', 'true');
    vi.stubEnv('MES_FINANCES_TEST_BASELINE', undefined);
    expect(() => testBaseline()).toThrow('CI requires the synthetic');
    vi.stubEnv('MES_FINANCES_TEST_BASELINE', 'private');
    expect(() => testBaseline()).toThrow('CI requires the synthetic');
    vi.stubEnv('MES_FINANCES_TEST_BASELINE', 'synthetic');
    expect(testBaseline()).toBe('spaces_ci_baseline17');
  });
});
