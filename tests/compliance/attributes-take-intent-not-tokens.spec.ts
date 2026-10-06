/**
 * An attribute takes intent, never CSS internals (#907).
 *
 * John: "the user must have ease of use no duplication or massive strings that
 * require internals knowledge". So `<button x-glow color="success">`, never
 * `color="var(--success-color)"`. The second form makes the author know the
 * token's name, and a wrong guess renders nothing with no error.
 *
 * Colour attributes accept the theme's colour names (src/core/theme-color.js)
 * or a real colour (hex, rgb(), hsl()). This gate fails on any attribute value
 * that starts with `var(` in the markup people copy from: pages, demos, docs,
 * templates, the example catalogue and the schemas. `style="…"` is exempt: an
 * author reaching for a custom property in a style attribute is the deliberate
 * escape hatch, not an attribute of a behavior.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIRS = ['pages', 'demos', 'docs', 'templates', 'src/wb-models'];
const FILES = ['index.html', 'data/behavior-examples.json'];
const EXTENSIONS = new Set(['.html', '.md', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'archive']);

// name="var(--…" or, inside JSON strings, name=\"var(--…
const TOKEN_VALUE = /\s([a-zA-Z][\w-]*)=\\?["']var\(--[^"'\\]*/g;

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (EXTENSIONS.has(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

test('no attribute value spells a CSS token: write color="success", not color="var(--success-color)"', () => {
  const files = [
    ...DIRS.flatMap((d) => walk(path.join(ROOT, d))),
    ...FILES.map((f) => path.join(ROOT, f)).filter((f) => fs.existsSync(f)),
  ];
  expect(files.length, 'the scan found files to read').toBeGreaterThan(100);

  const offenders: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(TOKEN_VALUE)) {
        if (m[1] === 'style') continue;
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}  ${m[0].trim()}`);
      }
    });
  }

  expect(
    offenders,
    'Name the colour (success, bg-tertiary, #22c55e), not its token. ' +
      'The names are THEME_COLORS in src/core/theme-color.js.\n' + offenders.join('\n'),
  ).toEqual([]);
});
