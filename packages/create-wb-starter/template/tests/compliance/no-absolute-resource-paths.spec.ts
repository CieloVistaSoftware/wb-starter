import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLIANCE GATE (#225): no absolute `/src` or `/assets` resource paths in source.
 *
 * The site is a GitHub PROJECT Pages deploy served under a sub-path (`/wb-starter/`).
 * Any `fetch('/src/…')`, `import '/src/…'`, `link.href = '/src/…'`, manifest icon
 * `"/assets/…"`, or registry `"/src/…"` resolves to the DOMAIN ROOT there and 404s —
 * which silently blanks schema components, view partials, page CSS, and icons.
 * Local dev serves at `/`, so absolute paths pass by luck — which is exactly why
 * no prior test caught it. This gate catches it in source, at any base.
 *
 * Rule: resource paths must be relative or resolved via `new URL(rel, import.meta.url)`
 * (JS) / relative to the file (JSON/manifest). Comments are ignored so JSDoc usage
 * examples don't false-positive.
 */
const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'test-results', '.playwright-artifacts', 'coverage', 'dist', 'out', 'tests']);
// Absolute paths to these top-level resource dirs break under a sub-path base.
const OFFENDER = /['"`](\/(?:src|assets|wb-models|wb-views|styles|lib|demos|images|media|audio|video|fonts|icons)\/[^'"`]*)['"`]/g;

function walk(dir: string, exts: string[], out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(path.relative(ROOT, abs).replace(/\\/g, '/'));
  }
}

function stripComments(src: string, isJson: boolean): string {
  // Blank block comments (keep newlines), then line comments — JSON has neither,
  // but stripping is harmless. Prevents JSDoc `import '/src/…'` examples flagging.
  let out = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (!isJson) out = out.replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + '');
  return out;
}

function files(): string[] {
  const out: string[] = [];
  walk(path.join(ROOT, 'src'), ['.js'], out);
  walk(path.join(ROOT, 'src', 'wb-views'), ['.json'], out);
  walk(path.join(ROOT, 'config'), ['.json'], out);
  for (const f of ['manifest.json']) if (fs.existsSync(path.join(ROOT, f))) out.push(f);
  return [...new Set(out)];
}

test.describe('No absolute /src or /assets resource paths (#225)', () => {
  for (const rel of files()) {
    test(`${rel}: no absolute resource paths`, () => {
      const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const src = stripComments(raw, rel.endsWith('.json'));
      const hits = [...src.matchAll(OFFENDER)].map((m) => m[1]);
      const offenders = [...new Set(hits)].sort();

      expect(
        offenders,
        `${rel} uses absolute resource paths that 404 under a sub-path base (e.g. /wb-starter/).\n  ` +
        `${offenders.join('\n  ')}\n  Use a relative path or new URL(rel, import.meta.url). (#225)`
      ).toEqual([]);
    });
  }
});
