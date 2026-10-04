import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/**
 * #1430: scripts/generate-schema-tests.js predated 4.0.0 (it keyed schemas
 * on `behavior` and built wb- tags), so it wrote data/schema-tests.json as an
 * empty object, and nothing read that file. Both were deleted. A script
 * entry left behind for a deleted file is a command that fails the first
 * time someone runs it, so every `node <file>` in package.json must name a
 * file that exists.
 */
test('every package.json script runs a node file that exists (#1430)', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const targets: string[] = [];
  const missing: string[] = [];
  for (const [name, cmd] of Object.entries(pkg.scripts as Record<string, string>)) {
    for (const m of String(cmd).matchAll(/\bnode\s+(?:--[\w-]+(?:=\S+)?\s+)*([\w./\\-]+\.(?:m?js|cjs))/g)) {
      targets.push(m[1]);
      if (!fs.existsSync(m[1])) missing.push(`${name}: ${m[1]}`);
    }
  }
  expect(targets.length, 'the scan found the node scripts').toBeGreaterThan(20);
  expect(missing, 'npm scripts that run a file that does not exist').toEqual([]);
});
