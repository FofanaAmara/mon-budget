import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { spawnSync } from 'node:child_process';

const file = '.github/workflows/financial-spaces.yml';
const load = () => yaml.load(fs.readFileSync(file, 'utf8'));

test('validation belongs to PRs and main, never pull_request_target or feature pushes', () => {
  const workflow = load();
  assert.deepEqual(Object.keys(workflow.on).sort(), ['pull_request', 'push']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.equal(workflow.on.pull_request.paths, undefined);
});
test('only superseded PRs can cancel; main runs have unique concurrency identities', () => {
  const workflow = load();
  assert.equal(workflow.concurrency['cancel-in-progress'], "${{ github.event_name == 'pull_request' }}");
  assert.equal(workflow.concurrency.group, 'financial-spaces-${{ github.event.pull_request.number || github.run_id }}');
});
test('the required check always materializes and explicitly rejects every non-success dependency', () => {
  const workflow = load();
  const required = workflow.jobs.required;
  assert.equal(required.if, '${{ always() }}');
  assert.deepEqual(required.needs, ['quality', 'postgres']);
  assert.equal(required.name, 'Financial spaces required');
  assert.equal(required.env.QUALITY_RESULT, '${{ needs.quality.result }}');
  assert.equal(required.env.POSTGRES_RESULT, '${{ needs.postgres.result }}');
  const script = required.steps.find(step => step.run)?.run;
  assert.equal(script.trim(), 'test "$QUALITY_RESULT" = success && test "$POSTGRES_RESULT" = success');
});
test('the full proof has no conditional skips or secrets and executes real synthetic PG suites', () => {
  const workflow = load();
  for (const job of [workflow.jobs.quality, workflow.jobs.postgres]) {
    assert.equal(job.if, undefined);
    for (const step of job.steps) {
      assert.equal(step.if, undefined);
      assert.equal(step['continue-on-error'], undefined);
    }
  }
  const quality = workflow.jobs.quality.steps.map(step => step.run || '').join('\n');
  for (const command of ['npm ci', 'npm run test:delivery', 'npx vitest run', 'npm run test:spaces:navigation', 'npx next typegen', 'npx tsc --noEmit', 'npm run lint', 'npm run build -- --webpack', 'npm audit --omit=dev']) assert.ok(quality.includes(command), command);
  const postgres = workflow.jobs.postgres.steps.map(step => step.run || '').join('\n');
  for (const command of ['npm ci', 'npm run test:spaces:prepare', 'npm run test:spaces:services', 'npm run test:spaces:db']) assert.ok(postgres.includes(command), command);
  assert.equal(workflow.jobs.postgres.env.MES_FINANCES_TEST_BASELINE, 'synthetic');
  assert.equal(fs.readFileSync(file, 'utf8').includes('secrets.'), false);
  assert.equal(fs.readFileSync(file, 'utf8').includes('upload-artifact'), false);
  assert.equal(Object.keys(workflow.jobs).length, 3);
});

test('the final aggregation really fails for failed, cancelled, skipped and absent proofs', () => {
  const required = load().jobs.required;
  const script = required.steps.find(step => step.run).run;
  for (const quality of ['success', 'failure', 'cancelled', 'skipped', 'timed_out', '']) {
    for (const postgres of ['success', 'failure', 'cancelled', 'skipped', 'timed_out', '']) {
      const result = spawnSync('sh', ['-c', script], {
        env: { QUALITY_RESULT: quality, POSTGRES_RESULT: postgres },
      });
      assert.equal(result.status === 0, quality === 'success' && postgres === 'success', `${quality}/${postgres}`);
    }
  }
});
