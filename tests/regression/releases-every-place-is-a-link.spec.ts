import { readFileSync } from 'node:fs';
import { test, expect } from '../fixtures/offline';
import { linkify, linksFrom } from '../../scripts/lib/release-item.mjs';

/**
 * The Releases page links to all the work, and every place it names is a
 * clickable link.
 *
 * John: "the release page should show links to all work", then, pointing at
 * a See it line that read "Open demos/site/cards.html" and one that read
 * "Open https://…/icon-192.png", both plain text: "A link always means a
 * click-able link".
 *
 * scripts/release-versions.mjs now gives every version:
 *   - a Links row: the commit that holds its whole change, then each commit's
 *     own `Links:` block (PR, issue, the page to look at);
 *   - a link to the commit on every item;
 *   - See it and summary text where every URL, repo path and ?page= is a link
 *     (linkify in scripts/lib/release-item.mjs).
 */

const data = JSON.parse(readFileSync('data/releases.json', 'utf8'));
const generated = data.releases.filter((r: { version: string }) => /^1\.0\.(\d+)$/.test(r.version) && Number(r.version.split('.')[2]) > 132);
const outsideLinks = (html: string) => String(html || '').replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ' ');
// A place a reader would want to click: a URL with a real host, a repo file, or ?page=.
const PLACE = /(?<![\w/.:-])(https?:\/\/(?:localhost|[\w-]+(?:\.[\w-]+)+)|(?:demos|pages|public|docs|tests|scripts|src|data)\/[\w./-]*\.(?:html|md|mjs|json|js|ts)\b|\?page=[\w-]+)/;

test('linkify turns every place into a link, and nothing else', () => {
  const cases: [string, string][] = [
    ['Open demos/site/cards.html now.', 'href="https://cielovistasoftware.github.io/wb-starter/demos/site/cards.html"'],
    ['Open https://cielovistasoftware.github.io/wb-starter/assets/icons/icon-192.png (or install).', 'href="https://cielovistasoftware.github.io/wb-starter/assets/icons/icon-192.png"'],
    ['Open ?page=hero-gallery.', 'href="https://cielovistasoftware.github.io/wb-starter/?page=hero-gallery"'],
    ['Open pages/home.html.', 'href="https://cielovistasoftware.github.io/wb-starter/?page=home"'],
    ['Read docs/behaviors/table.md.', 'href="https://cielovistasoftware.github.io/wb-starter/public/doc-viewer.html?file=docs%2Fbehaviors%2Ftable.md"'],
    ['Run <code>npx playwright test tests/regression/x.spec.ts</code>.', 'href="https://github.com/CieloVistaSoftware/wb-starter/blob/main/tests/regression/x.spec.ts"'],
    ['Open <code>data/search.json</code>.', '>data/search.json</a>'],
    ['Visit http://localhost:3000/?page=hero-gallery.', 'href="http://localhost:3000/?page=hero-gallery"'],
  ];
  for (const [text, want] of cases) {
    const out = linkify(text);
    expect(out, text).toContain(want);
    expect(outsideLinks(out), `${text}: nothing left unlinked`).not.toMatch(PLACE);
  }
  // An elided example is not a place, and a link is never linked twice.
  expect(linkify('six URLs read https://… and clean absolute https:// links')).not.toContain('<a ');
  const linked = '<a href="https://x.io/demos/a.html" target="_blank" rel="noopener">demos/a.html</a>';
  expect(linkify(linked)).toBe(linked);
});

test('linksFrom reads a commit message Links block', () => {
  const body = 'Summary: x\nSee it: y\n\nLinks:\n- PR (hero gallery): https://github.com/CieloVistaSoftware/wb-starter/pull/1617\n- See it (local): http://localhost:3000/?page=hero-gallery\n\nCo-Authored-By: someone';
  expect(linksFrom(body)).toEqual([
    { label: 'PR (hero gallery)', href: 'https://github.com/CieloVistaSoftware/wb-starter/pull/1617' },
    { label: 'See it (local)', href: 'http://localhost:3000/?page=hero-gallery' },
  ]);
  expect(linksFrom('no block here')).toEqual([]);
});

test('every generated version links its commit, its items, and every place it names', () => {
  expect(generated.length, 'there are generated 1.0.N versions').toBeGreaterThan(0);
  const unlinked: string[] = [];
  for (const r of generated) {
    expect(r.links?.[0]?.label, `${r.version} has a Code link`).toBe('Code');
    expect(r.links[0].html, `${r.version} Code link is a commit`).toMatch(/href="https:\/\/github\.com\/CieloVistaSoftware\/wb-starter\/commit\/[0-9a-f]{40}"/);
    for (const it of r.items) {
      expect(it.html, `${r.version} item links its commit`).toMatch(/\/commit\/[0-9a-f]{40}"/);
    }
    for (const field of ['summary', 'seeIt'] as const) {
      const m = outsideLinks(r[field]).match(PLACE);
      if (m) unlinked.push(`${r.version} ${field}: "${m[0]}"`);
    }
  }
  expect(unlinked, 'places named as plain text').toEqual([]);
});

test('the Releases page shows the links as links', async ({ page }) => {
  await page.goto('/?page=releases');
  await expect(page.locator('#releases-list')).toHaveAttribute('rendered', '1', { timeout: 20_000 });
  const first = page.locator('.releases__release').first();
  await expect(first.locator('.releases__links a[href*="/commit/"]')).toHaveCount(1);
  expect(await first.locator('.releases__item a[href*="/commit/"]').count(), 'every item on the newest release links its commit')
    .toBe(await first.locator('.releases__item').count());
  // A See it line that names a page: its place is an <a> (the reported 1.0.328 line).
  const withPlace = page.locator('.releases__see-it a[href^="https://cielovistasoftware.github.io/"]').first();
  await expect(withPlace).toHaveAttribute('target', '_blank');
});
