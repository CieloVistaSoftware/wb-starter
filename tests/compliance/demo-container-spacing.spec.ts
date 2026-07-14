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
 *
 * Second check (missing padding, not just insufficient): the original
 * version only flagged padding that was PRESENT but under 1rem
 * (`rem > 0 && rem < MIN_REM`) — a container with NO padding rule at all
 * (or an explicit `padding: 0`) silently passed, since there was nothing
 * to compare. `wb-demo` had exactly this gap undetected (0 padding,
 * confirmed live) until found by hand. Scoped to *base* container
 * selectors only (bare tag/class name, no `__part`/`:pseudo`/`>` combinator)
 * — BEM sub-parts legitimately may not need their own padding if the
 * outer wrapper already provides it, so requiring padding on every
 * matching selector would false-positive.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STYLES_DIR = path.join(ROOT, 'src/styles');
const SKIP_DIRS = new Set(['node_modules', '.git']);

// A REAL, second bug found while adding the missing-padding check below:
// this regex required a leading "." (class selector), so it never matched
// bare custom-element TAG selectors like "wb-demo" or "wb-code-card" at
// all -- the entire test (not just the new check) silently skipped
// wb-demo.css's own top-level rule since day one. "." is now optional.
const CONTAINER_NAME_RE = /\.?(?:[\w-]*demo[\w-]*|[\w-]*example[\w-]*|component-box|code-example)\b/i;
const BASE_CONTAINER_RE = /^(?:wb-demo|wb-code-card|\.component-box|\.code-example)$/i;
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
  // name -> file it was first seen in, for the missing-padding report below.
  const baseContainersSeen = new Map<string, string>();
  const baseContainersWithPadding = new Set<string>();

  for (const file of files) {
    // Strip /* ... */ comments before matching -- without this, a rule's
    // "selector" capture below can accidentally swallow a preceding
    // comment block, and if that comment happens to mention "demo"/
    // "example" in prose (e.g. "Extracted from demo.css"), it was matching
    // CONTAINER_NAME_RE and misattributing an unrelated rule's gap/padding
    // as a Standard §13 offender -- found live once CONTAINER_NAME_RE was
    // widened below to also catch bare tag selectors like "wb-demo".
    const text = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
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

      // Missing-padding check, scoped to base containers only (see header
      // comment) — a selector can be a comma-separated list sharing one rule
      // body (e.g. "wb-demo,\nwb-code-card { ... }").
      const tokens = selector.split(',').map(s => s.trim());
      const hasSufficientPadding = (() => {
        const pm = body.match(/(?:^|;)\s*padding\s*:\s*([^;]+);/i);
        if (!pm) return false;
        const rem = toRem(pm[1].trim().split(/\s+/)[0]);
        return rem !== null && rem >= MIN_REM;
      })();
      for (const token of tokens) {
        if (!BASE_CONTAINER_RE.test(token)) continue;
        if (!baseContainersSeen.has(token)) baseContainersSeen.set(token, rel);
        if (hasSufficientPadding) baseContainersWithPadding.add(token);
      }
    }
  }

  for (const [name, file] of baseContainersSeen) {
    if (!baseContainersWithPadding.has(name)) {
      offenders.push(`  ${file}: "${name}" has no padding rule (or padding: 0) — needs >= ${MIN_REM}rem`);
    }
  }

  expect(offenders, `demo/example containers with < 1rem spacing:\n${offenders.join('\n')}`).toEqual([]);
});
