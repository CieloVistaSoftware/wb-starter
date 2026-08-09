import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #296: authored demos/pages must use the button SHORTHAND (`variant`/`size` on a
 * native <button> or <wb-button>), NOT the long-hand `class="wb-btn wb-btn--*"`.
 * `variant`/`size` are wired on native buttons (button.js), so the class markup is
 * legacy verbosity.
 */
const ROOT = process.cwd();
const DIRS = ['demos', 'pages', 'public', 'articles'];
const SKIP = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);
// A wb-btn modifier class (variant/size) — the thing to migrate. Bare structural
// uses without a modifier are rare; flag anything with `wb-btn--`.
const RE = /class\s*=\s*["'][^"']*\bwb-btn--[a-z0-9-]+/i;

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html')) out.push(abs);
  }
}

test('demos/pages use variant/size, not long-hand wb-btn-- classes (#296)', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);

  const offenders: string[] = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    let n = 0;
    for (const line of lines) if (RE.test(line)) n++;
    if (n) offenders.push(`${rel}: ${n}`);
  }
  expect(
    offenders,
    `Use variant="…"/size="…" instead of class="wb-btn wb-btn--…":\n  ${offenders.join('\n  ')}`
  ).toEqual([]);
});
