import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Source must not build a component class hierarchy (#789).
 *
 * Tier 1 §2: capability is APPLIED to an element by behavior functions, never
 * ACQUIRED by subclassing. no-legacy-component-inheritance-docs.spec.ts held
 * the docs to that, but read only .md files, so the code that broke it was
 * unchecked: `class WBFixCard extends WBCard` shipped and stayed.
 *
 * A class may extend a PLATFORM base only: HTMLElement or an HTML*Element (the
 * Custom Elements API requires one to register a tag), an Error type, Event /
 * CustomEvent, or EventTarget. Extending anything else -- a wb-starter class --
 * is a hierarchy, and fails here.
 *
 * Scans src/ and the scaffolding template that ships to every new project.
 * src/lib/ is vendored third-party code (minified highlight.js) and is skipped.
 * Comment lines are skipped, so a comment may quote the old form.
 */
const ROOT = process.cwd();
const DIRS = ['src', 'packages/create-wb-starter/template'];
const SKIP = new Set(['node_modules', '.git', 'lib']);
const PLATFORM_BASE = /^(?:HTMLElement|HTML[A-Z]\w*Element|\w*Error|Event|CustomEvent|EventTarget)$/;
const CLASS_EXTENDS = /\bclass\s+(\w+)\s+extends\s+([\w$.]+)/g;

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (/\.(m?js|ts)$/.test(e.name)) out.push(abs);
  }
}

test('no class in source extends anything but a platform base (composition, not inheritance)', () => {
  const files: string[] = [];
  for (const d of DIRS) walk(path.join(ROOT, d), files);
  expect(files.length, 'the scan found source files').toBeGreaterThan(50);

  const offenders: string[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      for (const m of line.matchAll(CLASS_EXTENDS)) {
        if (PLATFORM_BASE.test(m[2])) continue;
        offenders.push(`${path.relative(ROOT, file).replace(/\\/g, '/')}:${i + 1}  class ${m[1]} extends ${m[2]}`);
      }
    });
  }

  expect(
    offenders,
    'Apply the capability with a behavior function instead of subclassing (Tier 1 §2):\n  ' + offenders.join('\n  '),
  ).toEqual([]);
});
