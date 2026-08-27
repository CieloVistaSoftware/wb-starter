/**
 * COMPLIANCE GATE (#501): the checked-in demos listing must be byte-for-byte
 * what `scripts/generate-demos-list.mjs` produces right now.
 *
 * `pages/demos.html` (the SPA fragment) and `demos/index.html` (the plain
 * standalone directory index) are BOTH generated files. They drifted anyway —
 * hand edits and stale stat counts accumulated because the only gate we had,
 * `demos-list-complete.spec.ts`, checks link completeness/validity, not that
 * the page content still matches the generator's current output. So a stat
 * count could rot (`203 demos` -> `210 demos`) or a curated `<div x-demo>`
 * example present in `CATEGORY_EXAMPLES` could be missing from the page, and
 * nothing failed.
 *
 * This gate closes that hole by re-running the generator in `--check` mode:
 * check mode builds the full output in memory and compares it against what is
 * on disk WITHOUT writing anything, so running it from a test is side-effect
 * free. Any difference -> non-zero exit -> this test fails.
 *
 * Fix a failure by regenerating, never by hand-editing the two outputs:
 *   node scripts/generate-demos-list.mjs
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GENERATOR = path.join(ROOT, 'scripts/generate-demos-list.mjs');
const PAGE = path.join(ROOT, 'pages', 'demos.html');
const RESULT = path.join(ROOT, 'data', 'site-generator-result.json');

test('pages/demos.html + demos/index.html match generate-demos-list.mjs output (#501)', () => {
  let output = '';
  let failed = false;
  try {
    output = execFileSync(process.execPath, [GENERATOR, '--check'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err: any) {
    failed = true;
    output = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim() || String(err.message);
  }

  expect(
    failed,
    `The checked-in demos listing has drifted from its generator:\n\n  ${output}\n\n` +
      `pages/demos.html and demos/index.html are GENERATED — do not hand-edit them. ` +
      `Regenerate with:\n  node scripts/generate-demos-list.mjs\n` +
      `(To change what is generated, edit scripts/generate-demos-list.mjs — CATEGORIES, ` +
      `DEMO_CATEGORY or CATEGORY_EXAMPLES — then regenerate.)`
  ).toBe(false);
});

/**
 * The per-category "N behaviors · M demos" line on each site-category card is
 * DERIVED — generate-demos-list.mjs reads it out of data/site-generator-result.json,
 * which generate-site.mjs computes by counting the real demos it emitted. This
 * asserts no one has typed a stat into pages/demos.html by hand: every stat
 * string on the page must be reproducible from the build report.
 */
test('demos page stat counts come from data/site-generator-result.json, never hardcoded (#501)', () => {
  const html = fs.readFileSync(PAGE, 'utf8');
  const onPage = [...html.matchAll(/(\d+) behaviors · (\d+) demos/g)].map((m) => `${m[1]} behaviors · ${m[2]} demos`);

  const report = fs.existsSync(RESULT) ? JSON.parse(fs.readFileSync(RESULT, 'utf8')) : { pages: [] };
  const fromReport = new Set(
    (report.pages ?? []).map((p: { componentCount: number; totalDemos: number }) => `${p.componentCount} behaviors · ${p.totalDemos} demos`)
  );

  const unbacked = onPage.filter((s) => !fromReport.has(s));
  expect(
    unbacked,
    `pages/demos.html shows stat counts that data/site-generator-result.json does not back:\n  ${unbacked.join('\n  ')}\n` +
      `Stats must be generated, not typed. Rebuild the report with ` +
      `\`node scripts/generate-site.mjs src/wb-models/pages/x-behavior-library.site.json\`, ` +
      `then \`node scripts/generate-demos-list.mjs\`.`
  ).toEqual([]);
});
