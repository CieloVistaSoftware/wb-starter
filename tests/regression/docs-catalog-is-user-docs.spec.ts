/**
 * #1239 -- the Docs page catalog lists what a casual user needs, nothing else.
 *
 * John: "I think we have way too many docs for casual users. Consider things
 * like do they really need to know the internals design?" The catalog listed
 * all 274 docs: status files, standards, agent instructions and audits beside
 * the guides and the behavior pages.
 *
 * Decided 2026-10-10: no paid tier, two audiences. scripts/lib/doc-audience.mjs
 * holds the rule; scripts/update-docs-manifest.js records each doc's answer as
 * `audience` in data/docs-manifest.json. Maintainer docs stay where sessions,
 * CLAUDE.md, gates and scripts read them and open by direct URL; docs nothing
 * referenced any more moved to docs/archive/.
 *
 * Checked here:
 *   1. every doc carries the audience the rule gives (the manifest is current);
 *   2. the curated catalog (docs/manifest.json) is exactly the user set: every
 *      user doc in it, no maintainer doc in it, no archived doc in it;
 *   3. no user doc links to an archived doc;
 *   4. the paths that sessions and CLAUDE.md read were not moved;
 *   5. in the browser, the Docs menu item opens a catalog whose cards are the
 *      user set in both views, and a maintainer doc still opens by its URL.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { classifyDocs, ARCHIVE_DIR } from '../../scripts/lib/doc-audience.mjs';
import { extractLinks, resolveLink } from '../../scripts/lib/md-links.mjs';

const generated = JSON.parse(fs.readFileSync('data/docs-manifest.json', 'utf8'));
const curated = JSON.parse(fs.readFileSync('docs/manifest.json', 'utf8'));

const docsOnDisk = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'docs/*.md'], { encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((p) => fs.existsSync(p));
const liveDocs = docsOnDisk.filter((p) => !p.startsWith(ARCHIVE_DIR + '/')).sort();
const archived = docsOnDisk.filter((p) => p.startsWith(ARCHIVE_DIR + '/')).sort();

const audienceOf = new Map<string, string>(generated.files.map((f: { path: string; audience: string }) => [f.path, f.audience]));
const userDocs = [...audienceOf].filter(([, a]) => a === 'user').map(([p]) => p).sort();

const curatedPaths = (curated.categories || []).flatMap((c: { docs?: { file: string }[] }) => (c.docs || []).map((d) => {
  const rel = d.file.replace(/^\/+/, '');
  return rel.startsWith('docs/') ? rel : `docs/${rel}`;
})).sort();

test('every doc carries the audience the rule gives it', async () => {
  expect(generated.files.map((f: { path: string }) => f.path).sort(), 'data/docs-manifest.json lists every doc outside docs/archive/; run scripts/update-docs-manifest.js').toEqual(liveDocs);
  const rule = await classifyDocs(process.cwd(), liveDocs);
  const wrong = liveDocs.filter((p) => audienceOf.get(p) !== rule.get(p))
    .map((p) => `${p}: recorded ${audienceOf.get(p)}, rule says ${rule.get(p)}`);
  expect(wrong, 'stale audience in data/docs-manifest.json; run scripts/update-docs-manifest.js').toEqual([]);
  expect(generated.audiences).toEqual({ user: userDocs.length, maintainer: liveDocs.length - userDocs.length });
  // A catalog of everything is the bug; a catalog of nothing is a broken rule.
  expect(userDocs.length).toBeGreaterThan(0);
  expect(liveDocs.length - userDocs.length).toBeGreaterThan(0);
});

test('the curated catalog lists exactly the user docs', () => {
  const maintainerListed = curatedPaths.filter((p: string) => audienceOf.get(p) === 'maintainer');
  expect(maintainerListed, 'maintainer docs listed in docs/manifest.json').toEqual([]);
  const archivedListed = curatedPaths.filter((p: string) => p.startsWith(ARCHIVE_DIR + '/'));
  expect(archivedListed, 'archived docs listed in docs/manifest.json').toEqual([]);
  expect(curatedPaths, 'docs/manifest.json must list every user doc, once').toEqual(userDocs);
});

test('no user doc links to an archived doc', () => {
  expect(archived.length, 'docs/archive/ holds the docs #1239 retired').toBeGreaterThan(0);
  const bad: string[] = [];
  for (const doc of userDocs) {
    for (const { dest, line } of extractLinks(fs.readFileSync(doc, 'utf8'))) {
      const r = resolveLink(dest, doc);
      if (r.type === 'internal' && r.file && r.file.startsWith(ARCHIVE_DIR + '/')) bad.push(`${doc}:${line} -> ${r.file}`);
    }
  }
  expect(bad).toEqual([]);
});

test('the docs sessions read by path were not moved', () => {
  const missing: string[] = [];
  for (const file of ['.claude/CLAUDE.md', '.github/copilot-instructions.md', 'docs/claude/README.md']) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\bdocs\/[\w./-]+\.md\b/g)) {
      if (!fs.existsSync(m[0])) missing.push(`${file} names ${m[0]}`);
    }
  }
  expect(missing).toEqual([]);
});

test('the Docs menu opens a catalog of user docs only, and maintainer docs open by URL', async ({ page }) => {
  const site = JSON.parse(fs.readFileSync('config/site.json', 'utf8'));
  expect(site.navigationMenu.some((m: { pageToLoad?: string }) => m.pageToLoad === 'docs'), 'a Docs item in the site menu').toBe(true);

  const cardDocs = async () => (await page.locator('#docs-container a.docs-card').evaluateAll((as) =>
    as.map((a) => new URL((a as HTMLAnchorElement).href).searchParams.get('file') || ''))).sort();

  for (const sort of ['newest', 'category', 'created']) {
    await page.goto(`/?page=docs&sort=${sort}`);
    const cards = page.locator('#docs-container a.docs-card');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    await expect(cards).toHaveCount(sort === 'category' || sort === 'newest' ? curatedPaths.length : userDocs.length);
    expect(await cardDocs(), `the ${sort} view lists exactly the user docs`).toEqual(userDocs);
  }

  // Hidden from the catalog, not removed: a maintainer doc still renders.
  const maintainer = 'docs/_today/CURRENT-STATUS.md';
  expect(audienceOf.get(maintainer)).toBe('maintainer');
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(maintainer));
  // The first two words of its title: the viewer typesets hyphens in the rest.
  const heading = fs.readFileSync(maintainer, 'utf8').split('\n')[0].replace(/^#\s*/, '').split(/\s+/).slice(0, 2).join(' ');
  await expect(page.locator('h1', { hasText: heading })).toBeVisible({ timeout: 15_000 });
});
