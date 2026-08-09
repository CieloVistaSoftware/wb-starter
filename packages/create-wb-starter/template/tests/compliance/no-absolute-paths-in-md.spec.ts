import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE: no domain-absolute internal paths in markdown docs.
 *
 * Docs render in the doc-viewer, which rebases RELATIVE links/media against the
 * doc's location so they work under the /wb-starter/ project base. But a
 * domain-absolute path — `](/src/…)`, `href="/images/…"`, `src="/demos/…"` — has
 * a leading slash, so it resolves to the DOMAIN root (github.io/src/…) and 404s,
 * rebasing can't save it. Links must be relative; code samples must not teach
 * absolute paths either.
 */
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out']);

// A leading-slash internal path in a markdown link, href, or src.
const OFFENDER = /(?:\]\(|href=["']|src=["'])(\/(?:src|demos|pages|public|assets|styles|node_modules|wb-models|wb-views|lib|images|media|audio|video)\/[^)"'`\s]*)/g;

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (e.name.endsWith('.md')) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function mdFiles(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'docs'), out);
  for (const f of ['README.md', 'CONTRIBUTING.md']) if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  return [...new Set(out)];
}

test.describe('No domain-absolute internal paths in markdown docs', () => {
  for (const rel of mdFiles()) {
    test(`${rel}: no domain-absolute internal paths`, () => {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const hits = [...src.matchAll(OFFENDER)].map((m) => m[1]);
      const offenders = [...new Set(hits)].sort();

      expect(
        offenders,
        `${rel} uses domain-absolute paths that 404 under the /wb-starter/ base.\n  ` +
        `${offenders.join('\n  ')}\n  Use a relative path (the doc-viewer rebases it correctly).`
      ).toEqual([]);
    });
  }
});
