/**
 * MODULE IMPORT RESOLUTION
 * ========================
 * Every named import must be exported by the file it names.
 *
 * #988: demo.js imported `extractAttrBlock` from page-source-cache.js, which
 * exports `extractTagBlock`. Half of a rename shipped. An unresolved named
 * import is a MODULE-LEVEL SyntaxError, not a runtime one -- the module never
 * evaluates, the graph never completes, and the entire site sat on
 * "Loading..." on every route for every visitor.
 *
 * Nothing caught it. No check loads the real module graph, the pre-commit hook
 * on main dies before running, and the deploy was verified by grepping the
 * served HTML -- which was fine. The JavaScript was not.
 *
 * This is a static check: no browser, no server, no fixtures. It reads the
 * files and compares what is asked for against what is offered.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from '../base';

const SRC = path.join(ROOT, 'src');

/** Every .js file under src/, recursively. */
function jsFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) jsFiles(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/**
 * Names a module makes available. Covers the forms this codebase actually
 * uses: declaration exports, brace exports with `as`, default, and `export *`
 * re-exports (followed, so a name re-exported through a barrel still counts).
 */
function exportsOf(file: string, seen = new Set<string>()): Set<string> {
  const names = new Set<string>();
  if (seen.has(file) || !fs.existsSync(file)) return names;
  seen.add(file);

  const src = fs.readFileSync(file, 'utf8');

  for (const m of src.matchAll(
    /^\s*export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm
  )) {
    names.add(m[1]);
  }

  // export { a, b as c }  --  but NOT `export { x } from './y.js'`, handled below
  for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*(?:from\s*['"]([^'"]+)['"])?/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }

  if (/^\s*export\s+default\b/m.test(src)) names.add('default');

  // export * from './other.js'  -- follow it
  for (const m of src.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)) {
    for (const n of exportsOf(resolve(file, m[1]), seen)) names.add(n);
  }

  return names;
}

/** Resolve a relative specifier against the importing file. */
function resolve(fromFile: string, spec: string): string {
  const base = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(base)) return base;
  for (const ext of ['.js', '/index.js']) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return base;
}

interface Broken {
  file: string;
  spec: string;
  name: string;
  reason: 'missing file' | 'not exported';
  available?: string[];
}

test.describe('module imports resolve', () => {
  test('every named import is exported by the file it names', () => {
    const broken: Broken[] = [];
    const files = jsFiles(SRC);
    expect(files.length, 'found no .js files under src/ — the walk is wrong').toBeGreaterThan(0);

    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');

      // import { a, b as c } from './x.js'  -- relative specifiers only:
      // bare specifiers are npm packages we do not resolve here.
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"](\.[^'"]+)['"]/g)) {
        const target = resolve(file, m[2]);
        const rel = path.relative(ROOT, file).split(path.sep).join('/');

        if (!fs.existsSync(target)) {
          for (const part of m[1].split(',')) {
            const name = part.trim().split(/\s+as\s+/)[0]?.trim();
            if (name) broken.push({ file: rel, spec: m[2], name, reason: 'missing file' });
          }
          continue;
        }

        const available = exportsOf(target);
        for (const part of m[1].split(',')) {
          const name = part.trim().split(/\s+as\s+/)[0]?.trim();
          if (!name) continue;
          if (!available.has(name)) {
            broken.push({
              file: rel,
              spec: m[2],
              name,
              reason: 'not exported',
              available: [...available].sort(),
            });
          }
        }
      }
    }

    const report = broken
      .map(
        (b) =>
          `  ${b.file}\n` +
          `    imports { ${b.name} } from '${b.spec}'  —  ${b.reason}` +
          (b.available ? `\n    that file exports: ${b.available.join(', ') || '(nothing)'}` : '')
      )
      .join('\n\n');

    expect(
      broken,
      broken.length
        ? `\n${broken.length} unresolved import(s). Each one is a module-level ` +
            `SyntaxError that stops the whole site from booting (#988):\n\n${report}\n`
        : ''
    ).toEqual([]);
  });
});
