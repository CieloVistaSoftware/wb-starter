import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * #294: `font-size` (and other literal text-sizing) in `px` ignores the
 * user's browser font-size preference — an accessibility issue. `rem`
 * scales with the root font-size (see #293's mobile 18px root bump);
 * `px` never does.
 *
 * This is a zero-tolerance gate (unlike `px-no-new-creep.spec.ts`, which
 * grandfathers in the pre-existing broader px/rem backlog for
 * padding/margin/gap/etc.): every literal `font-size: Npx` / `font-size:Npx`
 * declaration in CSS, HTML, and JS (inline styles / cssText / template
 * literals) across src/, pages/, demos/, and docs/ was converted to `rem`
 * in #294's font-size sweep. Any new one is a regression.
 *
 * If a genuinely fixed-pixel font-size is ever required (should be rare —
 * text should almost always scale), add its exact relative path to
 * ALLOWLIST with a comment explaining why, rather than disabling this test.
 */
const ROOT = process.cwd();
const DIRS = ['src', 'pages', 'demos', 'docs', 'public'];
const EXTS = new Set(['.css', '.html', '.js', '.ts', '.mjs', '.md']);
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'out', 'dist', 'coverage',
  'test-results', '.playwright-artifacts', 'data',
]);

// Matches `font-size` (CSS or inline-style form) followed by a literal
// pixel number — e.g. `font-size: 12px`, `font-size:11px`. Does NOT match
// dynamic template-literal sizes like `font-size:${size}rem` (no digits
// directly before `px` in that case) or already-converted rem/em/% values.
const PX_FONT_SIZE_RE = /font-size\s*:\s*-?[\d.]+px/i;

const ALLOWLIST = new Set<string>([
  // src/wb-overlay-ext/ is a local, gitignored browser-extension content
  // script (never committed — see .gitignore) that injects an inspector
  // overlay into arbitrary third-party host pages. Its UI must stay a fixed
  // size regardless of the host page's root font-size (rem would inherit
  // whatever site is being inspected), so px here is intentional, not a
  // #294 regression.
  'src/wb-overlay-ext/overlay.css',
]);

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (EXTS.has(path.extname(e.name))) out.push(abs);
  }
}

test('no literal font-size:Npx anywhere in src/pages/demos/docs (#294)', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);

  const offenders: string[] = [];
  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (PX_FONT_SIZE_RE.test(line)) offenders.push(`${rel}:${i + 1}`);
    });
  }

  expect(
    offenders,
    `Found font-size in px — use rem instead so text scales with the user's browser font-size preference (#294):\n  ${offenders.join('\n  ')}\n` +
      `16px base: 1px = 0.0625rem (e.g. 14px -> 0.875rem, 12px -> 0.75rem, 11px -> 0.6875rem, 10px -> 0.625rem). ` +
      `If this is a genuine, reviewed exception, add the file's relative path to ALLOWLIST in this test with a comment explaining why.`
  ).toEqual([]);
});
