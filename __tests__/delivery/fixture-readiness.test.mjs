import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForFixtureReady, container, username } from '../../scripts/financial-spaces/local-fixture.mjs';

test('a Unix-only bootstrap server cannot make the TCP fixture ready', async () => {
  let probes = 0, pauses = 0;
  await waitForFixtureReady({
    run(command, args) {
      assert.equal(command, 'docker');
      assert.equal(args[0], 'exec');
      assert.equal(args[1], container);
      assert.equal(args[2], 'pg_isready');
      probes++;
      // During official image bootstrap Unix is ready, but TCP is not.
      const tcp = args[args.indexOf('-h') + 1] === '127.0.0.1';
      return { status: !tcp || probes >= 3 ? 0 : 2 };
    },
    async pause(ms) { assert.equal(ms, 250); pauses++; },
  });
  assert.equal(probes, 3);
  assert.equal(pauses, 2);
});

test('an unavailable final TCP listener fails within the bounded readiness budget', async () => {
  let probes = 0;
  await assert.rejects(waitForFixtureReady({ run() { probes++; return { status: 2 }; }, async pause() {} }), /did not become ready/);
  assert.equal(probes, 40);
});

test('readiness uses the fixed fixture role and database with an explicit probe timeout', async () => {
  await waitForFixtureReady({ run(_command, args) {
    for (const [flag, value] of [['-p', '5432'], ['-U', username], ['-d', 'postgres'], ['-t', '1']]) {
      assert.equal(args[args.indexOf(flag) + 1], value);
    }
    return { status: 0 };
  } });
});
