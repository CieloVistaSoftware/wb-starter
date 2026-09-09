import { test, expect } from '@playwright/test';

/**
 * #1098: the docs page must list EVERY behavior, in two sections.
 *
 * John: "I want to see every x-behavior -- we have many [that] don't have a
 * x-prefix", and "move the semantic and x-behaviors into 2 sections".
 *
 * Before this, /?page=docs listed 86 of 271 documents and 25 of 185 behaviors,
 * because the page read a hand-maintained `docs/manifest.json` that nothing
 * regenerated. Nothing noticed for months. This test is what notices.
 *
 * THE SOURCE MATTERS. The count is compared against `tag-map.js` UNION
 * `wb-lazy.js`, never tag-map alone: WB_LAZY_ONLY_ATTRIBUTES holds 39
 * behaviours that resolve at runtime and appear nowhere in tag-map
 * (x-breadcrumb, x-notify, x-copybutton, every animation effect). Reading
 * tag-map alone is a known bug -- #1056 fixed exactly that on
 * pages/behaviors.html, and wb-lazy.js's own comment predicts it:
 * "anything reading tag-map alone reports an incomplete behavior list."
 *
 * It is also NOT compared against docs/behaviors/*.md, which is wrong in both
 * directions: 6 behaviours have no file, and 14 files (aside, blockquote, ol,
 * ul, time, ...) describe nothing that is a behaviour.
 */

/** The authoritative behaviour surface, read in page context. */
async function readRegistries(page: import('@playwright/test').Page) {
  return page.evaluate(async () => {
    const [tag, lazy] = await Promise.all([
      import('/src/core/tag-map.js'),
      import('/src/core/wb-lazy.js').catch(() => ({} as Record<string, unknown>)),
    ]);
    const lazyOnly = (lazy as { WB_LAZY_ONLY_ATTRIBUTES?: Record<string, unknown> })
      .WB_LAZY_ONLY_ATTRIBUTES || {};
    const t = tag as { extensionMap: Record<string, unknown>; nativeMap: Record<string, unknown> };
    return {
      extension: Object.keys({ ...lazyOnly, ...t.extensionMap }).sort(),
      semantic: Object.keys(t.nativeMap || {}).sort(),
      lazyOnlyCount: Object.keys(lazyOnly).filter(k => !(k in t.extensionMap)).length,
    };
  });
}

test('[docs] lists every behavior, split into semantic and x- sections (#1098)', async ({ page }) => {
  await page.goto('/?page=docs');

  const sections = page.locator('#behaviors-sections');
  await expect(sections).toBeVisible();

  const registries = await readRegistries(page);

  // Guard the guard: if wb-lazy stopped contributing, this test would silently
  // start asserting the SHORT list and pass while the page was wrong again.
  expect(
    registries.lazyOnlyCount,
    'wb-lazy contributes no behaviours beyond tag-map — either the registries merged '
    + '(good, simplify this test) or the lazy import broke (bad, the list is now short)',
  ).toBeGreaterThan(0);

  const semanticItems = page.locator('#behaviors-semantic .behaviors-grid__item');
  const extensionItems = page.locator('#behaviors-extension .behaviors-grid__item');

  await expect(semanticItems).toHaveCount(registries.semantic.length);
  await expect(extensionItems).toHaveCount(registries.extension.length);

  // Two sections, not one merged list — a semantic behaviour and an x- behaviour
  // are different things, and flattening them hides the authoring surface.
  await expect(page.locator('#behaviors-semantic h2')).toHaveText('Semantic behaviors');
  await expect(page.locator('#behaviors-extension h2')).toHaveText('x- behaviors');

  // Every single name present — a count match alone could hide a swap.
  const rendered = await page.evaluate(() => ({
    semantic: [...document.querySelectorAll('#behaviors-semantic .behavior-chip__name')]
      .map(n => n.textContent!.trim()).sort(),
    extension: [...document.querySelectorAll('#behaviors-extension .behavior-chip__name')]
      .map(n => n.textContent!.trim()).sort(),
  }));

  expect(rendered.semantic).toEqual(registries.semantic);
  expect(rendered.extension).toEqual(registries.extension);
});

test('[docs] a behavior with no doc is shown and marked, never omitted (#1098)', async ({ page }) => {
  await page.goto('/?page=docs');
  await expect(page.locator('#behaviors-sections')).toBeVisible();

  // Absence used to be invisible: a behaviour whose doc was missing simply did
  // not appear, so a documentation gap was indistinguishable from a behaviour
  // that does not exist.
  //
  // This first asserted `undocumented > 0`, which then FAILED once docs were
  // resolved by behaviour name — every one of the 185 has a doc, so nothing is
  // marked. Requiring a gap to exist makes closing the last gap break the test.
  //
  // The invariant that actually matters is that NOTHING IS DROPPED: every
  // behaviour renders a chip whether or not it has a doc. The marking is
  // asserted conditionally, so it is still guarded the moment a gap reappears.
  const registries = await readRegistries(page);
  const total = registries.semantic.length + registries.extension.length;

  const chips = page.locator('#behaviors-sections .behavior-chip');
  await expect(chips, 'a behaviour is missing a chip — something is being dropped again')
    .toHaveCount(total);

  const undocumented = page.locator('.behavior-chip--undocumented');
  const count = await undocumented.count();

  if (count > 0) {
    await expect(undocumented.first()).toBeVisible();
    await expect(undocumented.first()).toContainText('no doc yet');

    // A marked chip must NOT be a link: there is nothing to open.
    const tag = await undocumented.first().evaluate(el => el.tagName.toLowerCase());
    expect(tag).not.toBe('a');
  }

  // The mechanism must survive even while unused, or the next undocumented
  // behaviour goes back to being invisible.
  const marksUndocumented = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => {
      try {
        return [...sheet.cssRules].some(r =>
          r.selectorText && r.selectorText.includes('behavior-chip--undocumented'));
      } catch { return false; }
    }));
  expect(marksUndocumented,
    'the undocumented-chip styling is gone — a behaviour with no doc would render '
    + 'indistinguishable from one that has one').toBe(true);
});

test('[docs] search filters both sections and reveals lazy-only behaviors (#1098)', async ({ page }) => {
  await page.goto('/?page=docs');
  await expect(page.locator('#behaviors-sections')).toBeVisible();

  const search = page.locator('#docs-search');

  // x-breadcrumb lives ONLY in wb-lazy. If the page ever reverts to reading
  // tag-map alone, this is the assertion that fails.
  await search.fill('breadcrumb');
  const breadcrumbHits = page.locator('#behaviors-extension .behaviors-grid__item:visible');
  await expect(breadcrumbHits).toHaveCount(1);
  // Scope the name read to the VISIBLE item. Filtering hides the <li>, not the
  // <span> inside it, so a bare .first() returns whatever is first in DOM order
  // (x-accordion) and says nothing about what the search matched.
  await expect(breadcrumbHits.locator('.behavior-chip__name')).toHaveText('x-breadcrumb');

  // "article" spans both sections — the semantic tag AND the x- attributes.
  // This is the case that shows why the split exists.
  await search.fill('article');
  await expect(page.locator('#behaviors-semantic')).toBeVisible();
  await expect(page.locator('#behaviors-extension')).toBeVisible();
  await expect(page.locator('#behaviors-semantic .behaviors-grid__item:visible')).toHaveCount(1);

  // Clearing restores the full list.
  await search.fill('');
  const registries = await readRegistries(page);
  await expect(page.locator('#behaviors-extension .behaviors-grid__item:visible'))
    .toHaveCount(registries.extension.length);
});

test('[docs] every behavior link actually opens its doc (#1098)', async ({ page }) => {
  await page.goto('/?page=docs');
  await expect(page.locator('#behaviors-sections')).toBeVisible();

  // A file existing is NOT the same as the link working. The first version of
  // this page built hrefs from the ATTRIBUTE name -- docs/behaviors/x-cardbutton.md
  // -- while every file is named after the BEHAVIOUR (cardbutton.md). Every
  // single x- link 404'd. The count and name assertions above all passed, because
  // none of them followed a link.
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#behaviors-sections .behavior-chip')]
      .filter(c => c.tagName === 'A')
      .map(c => ({ name: c.textContent!.trim(), file: new URLSearchParams(c.getAttribute('href')!.split('?')[1]).get('file')! })));

  expect(links.length).toBeGreaterThan(150);

  const broken = await page.evaluate(async (items) => {
    const bad: string[] = [];
    for (const it of items) {
      try {
        const res = await fetch('/' + it.file);
        const body = res.ok ? await res.text() : '';
        if (!res.ok || body.trim().length === 0) { bad.push(`${it.name} -> ${it.file} (${res.status})`); }
      } catch { bad.push(`${it.name} -> ${it.file} (fetch failed)`); }
    }
    return bad;
  }, links);

  expect(broken, 'behavior doc links that do not load: ' + broken.join(' | ')).toEqual([]);
});

test('[docs] clicking a behavior opens the doc, not an error page (#1098)', async ({ page }) => {
  await page.goto('/?page=docs');
  await expect(page.locator('#behaviors-sections')).toBeVisible();

  // x-cardbutton is one John reported as 404. Fetching a URL is a different
  // test from clicking the link, and only the click exercises the viewer.
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.behavior-chip')]
      .find(c => c.textContent!.trim() === 'x-cardbutton') as HTMLAnchorElement;
    el.removeAttribute('target');
    el.click();
  });

  await page.waitForURL(/doc-viewer\.html/);
  await expect(page.locator('body')).not.toContainText('Unable to Load');
  await expect(page.locator('body')).toContainText('Button Card');
});
