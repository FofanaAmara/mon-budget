import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('the release PR can run CI without automatically exposing an unconfigured Vercel preview', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.equal(config.git?.deploymentEnabled?.['feature/financial-spaces-production'], false);
  assert.notEqual(config.git?.deploymentEnabled?.main, false, 'No permanent main deployment shutdown hidden in this PR.');
  assert.deepEqual(config.crons, [{ path: '/api/cron/push', schedule: '0 13 * * *' }]);
});
