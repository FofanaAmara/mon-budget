import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const source = '.app-factory/backlog/epics/finances-partagees/features/espaces-financiers';
const matrix = fs.readFileSync('.Codex/plans/espaces-financiers-evidence/acceptance-matrix.md', 'utf8');
test('the evidence matrix accounts for every backlog requirement exactly once', () => {
  const expected = [...fs.readFileSync(path.join(source, 'requirements.md'), 'utf8').matchAll(/^\| ((?:FR|NFR|UXR|TR)-\d+) \|/gm)].map(match => match[1]);
  const actual = [...matrix.matchAll(/^\| ((?:FR|NFR|UXR|TR)-\d+) \|/gm)].map(match => match[1]);
  assert.equal(expected.length, 17);
  assert.deepEqual(actual.sort(), expected.sort());
});
test('the evidence matrix accounts for every acceptance criterion exactly once', () => {
  const expected = [];
  for (const story of fs.readdirSync(path.join(source, 'stories')).filter(file => /^ESP-\d+\.md$/.test(file))) {
    const text = fs.readFileSync(path.join(source, 'stories', story), 'utf8');
    for (const match of text.matchAll(/^### (AC-\d+) /gm)) expected.push(story.slice(0, -3) + '/' + match[1]);
  }
  const actual = [...matrix.matchAll(/^\| (ESP-\d+\/AC-\d+) \|/gm)].map(match => match[1]);
  assert.equal(expected.length, 30);
  assert.deepEqual(actual.sort(), expected.sort());
});
