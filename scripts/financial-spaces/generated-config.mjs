/** Restore only known Next-generated edits; never overwrite a human change. */
import fs from 'node:fs';
import path from 'node:path';

const generatedIncludes = new Set([
  '.next-spaces-dev/types/**/*.ts',
  '.next-spaces-dev/dev/types/**/*.ts',
]);

export function restoreGeneratedConfigs(root, originals) {
  for (const [file, original] of originals) {
    if (!['tsconfig.json', 'next-env.d.ts'].includes(file)) {
      throw Error('Unexpected configuration target.');
    }
    const target = path.join(root, file);
    const current = fs.readFileSync(target, 'utf8');
    if (current === original.toString()) continue;

    let expected;
    if (file === 'tsconfig.json') {
      const parsed = JSON.parse(current);
      const hasGeneratedIncludes = parsed.include.some(item => generatedIncludes.has(item));
      parsed.include = parsed.include.filter(item => !generatedIncludes.has(item));
      expected = JSON.stringify(parsed) === JSON.stringify(JSON.parse(original.toString()));
      // A formatting-only change has no generated additions to restore.
      if (expected && !hasGeneratedIncludes) continue;
    } else {
      let normalized = current.replaceAll('.next-spaces-dev/', '.next/');
      if (!original.toString().includes('types/root-params.d.ts')) {
        normalized = normalized.replace(/^import "\.\/\.next\/(?:dev\/)?types\/root-params\.d\.ts";\r?\n/gm, '');
      }
      expected = normalized === original.toString();
    }
    if (!expected) {
      throw Error('Unexpected compiler configuration change; preserving it for review.');
    }
    fs.writeFileSync(target, original);
  }
}
