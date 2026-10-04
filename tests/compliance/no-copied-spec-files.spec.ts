import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

/**
 * #1463: tests/compliance/universal-compliance.spec.ts was
 * page-compliance.spec.ts with "Page" changed to "Universal" in two titles.
 * Every run checked the home page twice, and a change had to be made in both
 * or they drifted. no-duplicate-specs.spec.ts checks a different thing (one
 * file matched by several projects), so nothing caught it.
 *
 * Two spec files whose bodies are identical once comments and the
 * test()/describe() titles are set aside are one test under two names.
 */
function specs(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'fixtures') specs(p, out); }
    else if (/\.spec\.(ts|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

function fingerprint(src: string): string {
  const body = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    // A title is the first argument of test()/describe() and their modifiers.
    .replace(/\b(test|it|describe)((?:\.\w+)*)\(\s*(['"`])(?:\\.|(?!\3)[\s\S])*?\3/g, '$1$2(TITLE')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(body).digest('hex');
}

test('no two spec files are the same test under two names (#1463)', () => {
  const root = process.cwd();
  const byPrint = new Map<string, string[]>();
  for (const file of specs(path.join(root, 'tests'))) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const fp = fingerprint(fs.readFileSync(file, 'utf8'));
    byPrint.set(fp, [...(byPrint.get(fp) ?? []), rel]);
  }
  const copies = [...byPrint.values()].filter((files) => files.length > 1).map((files) => files.join(' == '));
  expect(copies, 'delete the copy, or make the second spec test something the first does not').toEqual([]);
});
