/**
 * COMPLIANCE GATE (#1738): pages/other.html must be exactly what
 * `scripts/generate-other-page.mjs` produces right now.
 *
 * The "Other" nav item's page lists every visitor-facing page in demos/,
 * pages/, public/ and articles/ that the main nav does not reach. A hand list
 * drifts the day someone adds a demo, so the page is generated, and this gate
 * re-runs the generator in --check mode (it compares in memory and writes
 * nothing). A new file in demos/ or pages/ without a regenerate fails here.
 *
 * Fix a failure by regenerating, never by hand-editing pages/other.html:
 *   node scripts/generate-other-page.mjs
 * To change what is listed or skipped, edit SKIP in that script.
 */
import { test, expect } from '../fixtures/offline';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GENERATOR = path.join(ROOT, 'scripts/generate-other-page.mjs');

/** Runs the generator in --check mode; `failed` is true when it reports drift. */
function check(root?: string): { failed: boolean; output: string } {
  const args = [GENERATOR, '--check', ...(root ? ['--root', root] : [])];
  try {
    const output = execFileSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { failed: false, output };
  } catch (err: any) {
    return { failed: true, output: `${err.stdout ?? ''}${err.stderr ?? ''}`.trim() || String(err.message) };
  }
}

test('pages/other.html matches generate-other-page.mjs output (#1738)', () => {
  const { failed, output } = check();
  expect(
    failed,
    `pages/other.html has drifted from its generator:\n\n  ${output}\n\n` +
      'pages/other.html is GENERATED, do not hand-edit it. Regenerate with:\n' +
      '  node scripts/generate-other-page.mjs\n' +
      '(To change what is listed or skipped, edit SKIP in scripts/generate-other-page.mjs, then regenerate.)',
  ).toBe(false);
});

/**
 * The gate must be seen to fail: in a copy of the tree, a new demo and a new
 * page each make --check report drift until the page is regenerated, and the
 * regenerated page lists them.
 */
test('a new file in demos/ or pages/ without a regenerate fails the gate (#1738)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-1738-'));
  try {
    for (const dir of ['config', 'demos', 'pages', 'public', 'articles']) {
      fs.cpSync(path.join(ROOT, dir), path.join(tmp, dir), { recursive: true });
    }
    expect(check(tmp).failed, 'the copied tree starts in sync').toBe(false);

    fs.writeFileSync(path.join(tmp, 'demos', 'brand-new-demo.html'), '<title>Brand New Demo</title>');
    expect(check(tmp).failed, 'a new demo without a regenerate must fail').toBe(true);

    execFileSync(process.execPath, [GENERATOR, '--root', tmp], { cwd: ROOT, encoding: 'utf8' });
    expect(check(tmp).failed, 'regenerating fixes it').toBe(false);
    const regenerated = fs.readFileSync(path.join(tmp, 'pages', 'other.html'), 'utf8');
    expect(regenerated).toContain('title="Brand New Demo" description="demos/brand-new-demo.html" href="demos/brand-new-demo.html"');

    fs.writeFileSync(path.join(tmp, 'pages', 'brand-new-page.html'), '<h1>Brand New Page</h1>');
    expect(check(tmp).failed, 'a new page without a regenerate must fail').toBe(true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
