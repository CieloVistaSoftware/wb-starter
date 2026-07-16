import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * <wb-alert>'s real behavior (alert() in src/wb-viewmodels/feedback.js) reads
 * ONLY the `variant` attribute — there is no fallback to `type` at all. Using
 * type="..." silently no-ops: every instance falls back to the 'info'
 * default, so multiple "variants" render identically.
 *
 * Found live 2026-07-11: pages/behaviors.html and pages/newbehaviors.html
 * both used type= for their "Alerts (All Variants)" showcase — all 4 alerts
 * rendered the same blue/info style. The existing live-DOM test
 * (behaviors-page-full.spec.ts's "alerts: 4 variants render distinct
 * backgrounds") DOES catch this reliably in isolation, but a source-level
 * check like this one is faster, doesn't depend on page-load/lazy-injection
 * timing, and catches it in any file — not just the one page that happens to
 * have a live-DOM test pointed at it.
 *
 * docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md already documents
 * this exact gotcha as an intentional BAD-example comparison — allowlisted,
 * not a violation.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// .claude/worktrees holds full checkouts for OTHER agent sessions -- stale
// copies of this same repo, including old (already-fixed) revisions of
// files like ATTRIBUTE-NAMING-STANDARD.md. Scanning them re-flags content
// that was already fixed here, just not yet in those other worktrees.
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

// Files where `type=` on <wb-alert> is intentional (a documented BAD example).
const ALLOWLIST = new Set([
  'docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md',
]);

function walk(dir: string, out: string[]): void {
  let ents: fs.Dirent[];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.html') || e.name.endsWith('.md')) out.push(abs);
  }
}

test('<wb-alert> never uses type= — only variant= is read (attribute audit)', () => {
  const files: string[] = [];
  walk(ROOT, files);

  const offenders: string[] = [];
  const WB_ALERT_TYPE = /<wb-alert\b[^>]*\btype=/;

  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    const text = fs.readFileSync(abs, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      if (WB_ALERT_TYPE.test(line)) {
        offenders.push(`  ${rel}:${i + 1}: ${line.trim()}`);
      }
    });
  }

  expect(
    offenders,
    `<wb-alert type="..."> found — alert() only reads 'variant', type= is silently ignored (every instance falls back to the 'info' default):\n${offenders.join('\n')}`
  ).toEqual([]);
});
