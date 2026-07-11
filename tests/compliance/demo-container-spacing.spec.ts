import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Standard §13 (docs/standards/DEMOS-AND-DOCS-STANDARDS.md): "Every example
 * has proper margins & padding — no cramped, zero-spacing layouts (>= 1rem)."
 * (#249)
 *
 * Scans src/styles/**\/*.css for rules whose selector names a demo/example
 * container (class names containing "demo", "example", or naming a known
 * container like component-box/code-example) and asserts any `gap`/
 * `padding` value on those rules is >= 1rem (16px) — not a live-DOM sweep of
 * every rendered page, but the CSS-source-level equivalent: catches the
 * class of bug found in #249 (`.demo-stack { gap: 0.75rem }`) and prevents
 * it recurring in any container matching the naming convention already
 * established across demos/**\/pages/**.
 *
 * Not exhaustive — a container styled entirely via inline `style="..."`
 * rather than a CSS class rule won't be caught here. If a new cramped inline
 * example turns up, add its pattern to CONTAINER_NAME_RE or file a
 * follow-up for inline-style coverage.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STYLES_DIR = path.join(ROOT, 'src/styles');
const SKIP_DIRS = new Set(['node_modules', '.git']);

const CONTAINER_NAME_RE = /\.(?:[\w-]*demo[\w-]*|[\w-]*example[\w-]*|component-box|code-example)\b/i;
const MIN_REM = 1;

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.css')) out.push(abs);
  }
}

function toRem(value: string): number | null {
  const rem = value.match(/^(-?[\d.]+)rem$/);
  if (rem) return parseFloat(rem[1]);
  const px = value.match(/^(-?[\d.]+)px$/);
  if (px) return parseFloat(px[1]) / 16;
  if (value === '0') return 0;
  return null; // var(), %, unitless, etc. — not checkable statically, skip
}

test('demo/example container CSS rules have >= 1rem gap/padding (Standard §13, #249)', () => {
  const files: string[] = [];
  walk(STYLES_DIR, files);

  const offenders: string[] = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    // Match `selector { ...body... }` blocks (non-greedy, no nested braces —
    // true for this project's flat CSS files).
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(text))) {
      const selector = m[1].trim();
      const body = m[2];
      if (!CONTAINER_NAME_RE.test(selector)) continue;

      for (const prop of ['gap', 'row-gap', 'column-gap', 'padding']) {
        const propRe = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+);`, 'i');
        const pm = body.match(propRe);
        if (!pm) continue;
        const value = pm[1].trim().split(/\s+/)[0]; // shorthand padding: use smallest-risk first value
        const rem = toRem(value);
        if (rem !== null && rem > 0 && rem < MIN_REM) {
          offenders.push(`  ${rel}: "${selector}" { ${prop}: ${value} } (${rem}rem < ${MIN_REM}rem)`);
        }
      }
    }
  }

  expect(offenders, `demo/example containers with < 1rem spacing:\n${offenders.join('\n')}`).toEqual([]);
});
