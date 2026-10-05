import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * #1503: data/search.json, the site's search index, held 112 hits for docs that
 * no longer existed, and nothing regenerated it. It could not be kept current:
 * every run wrote a fresh `$generated` timestamp, each document's date was its
 * MTIME (a checkout stamps every mtime), and file order was the filesystem's,
 * so regenerating it changed ~77,000 lines on any machine.
 *
 * Now the generator is deterministic and main's stamp workflow runs it on every
 * push, as it does the docs manifests. These guard both halves.
 */
const root = process.cwd();

test('main\'s stamp workflow regenerates the search index (#1503)', () => {
  const wf = fs.readFileSync(path.join(root, '.github', 'workflows', 'stamp-version-on-main.yml'), 'utf8');
  expect(wf).toMatch(/node scripts\/generate-search-index\.js/);
});

test('the search generator is deterministic: two runs, identical output (#1503)', () => {
  // Code only: the generator's comments explain why these are gone.
  const src = fs.readFileSync(path.join(root, 'scripts', 'generate-search-index.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  expect(src, 'a generated timestamp makes every run differ').not.toMatch(/\$generated/);
  expect(src, 'mtimes differ on every checkout; use the commit date').not.toMatch(/\.mtime/);

  const out = path.join(root, 'data', 'search.json');
  const before = fs.readFileSync(out);
  try {
    execFileSync(process.execPath, ['scripts/generate-search-index.js'], { cwd: root, encoding: 'utf8' });
    const first = fs.readFileSync(out);
    execFileSync(process.execPath, ['scripts/generate-search-index.js'], { cwd: root, encoding: 'utf8' });
    const second = fs.readFileSync(out);
    expect(second.equals(first), 'a second run changed data/search.json').toBe(true);

    const index = JSON.parse(first.toString('utf8'));
    const stale = index.documents
      .filter((d: { id: string }) => d.id.startsWith('docs/'))
      .filter((d: { id: string }) => !fs.existsSync(path.join(root, `${d.id}.md`)))
      .map((d: { id: string }) => d.id);
    expect(stale, 'the generator indexed docs that do not exist').toEqual([]);
  } finally {
    fs.writeFileSync(out, before); // leave the tree as the test found it
  }
});
