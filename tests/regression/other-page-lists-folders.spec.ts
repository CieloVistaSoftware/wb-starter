/**
 * THE "OTHER" NAV ITEM AND ITS PAGE (#1738)
 * ========================================
 * John: "Create a nav button in our main navigator named other, then put links
 * to other folders for example demos or perhaps pages too."
 *
 * The left nav reached seven pages and the error log. Everything else on the
 * site -- the standalone demos, the component library, pages such as Contact
 * and Features, the schema and fix viewers, the articles -- was linked from no
 * menu at all. Now an "Other" item opens pages/other.html, which
 * scripts/generate-other-page.mjs generates from those folders.
 *
 * This checks it where visitors see it: on the test server, and again under
 * /wb-starter/ the way GitHub Pages serves the site, where a link that starts
 * at the domain root would 404. Every listed link must answer 200 from the
 * address the browser resolves it to.
 *
 * See it by hand: open the site, click "Other" in the left nav.
 * Before: there is no Other item, and ?page=other shows the not-found page.
 * Now: the Other page lists Demos, Pages, Tools and Articles, each card opening
 * its page.
 */
import { test, expect, type Page, type APIRequestContext } from '../fixtures/offline';
import { wbIdle } from '../base';
import { pagePath } from '../helpers/page-path';
import { mountUnderSubPath, PREFIX } from '../helpers/sub-path';
import { buildListing } from '../../scripts/generate-other-page.mjs';

type Link = { file: string; href: string; title: string };
const listing = buildListing() as { groups: { id: string; links: Link[] }[] };
const EXPECTED: Link[] = listing.groups.flatMap((g) => g.links);

const cards = (page: Page) => page.locator('#mainPage-other .x-card__link-overlay');

/** Open the Other page from `url` and wait until every generated card has its link. */
async function openOther(page: Page, url: string) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#mainPage-other', { timeout: 30000 });
  await expect(cards(page)).toHaveCount(EXPECTED.length, { timeout: 20000 });
}

/** Each card's href as written, and as the browser resolves it. */
function readLinks(page: Page) {
  return cards(page).evaluateAll((as) =>
    (as as HTMLAnchorElement[]).map((a) => ({ raw: a.getAttribute('href') || '', resolved: a.href })),
  );
}

/** Every URL that answers anything but 200, with its status. */
async function notOk(request: APIRequestContext, urls: string[]): Promise<string[]> {
  const bad: string[] = [];
  for (const url of urls) {
    const res = await request.get(url, { maxRedirects: 0 });
    if (res.status() !== 200) bad.push(`${res.status()} ${url}`);
  }
  return bad;
}

/**
 * The URLs a link needs: the link itself, and for a page link (?page=<id>)
 * the fragment the shell fetches, since the shell answers 200 for any page
 * id that exists.
 */
function urlsFor(resolved: string): string[] {
  const u = new URL(resolved);
  const id = u.searchParams.get('page');
  return id ? [resolved, new URL(`pages/${id}.html`, u.origin + u.pathname.replace(/[^/]*$/, '')).href] : [resolved];
}

test('the generator lists links from demos/ and pages/ (#1738)', () => {
  expect(EXPECTED.some((l) => l.file.startsWith('demos/')), 'a demos/ link').toBe(true);
  expect(EXPECTED.some((l) => l.file === 'demos/site/index.html'), 'the component library').toBe(true);
  expect(EXPECTED.some((l) => l.file.startsWith('pages/')), 'a pages/ link').toBe(true);
});

test('the Other nav item exists, is clickable and opens the Other page (#1738)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/?page=home', { waitUntil: 'domcontentloaded' });
  await wbIdle(page);
  const item = page.locator(`#siteNav .x-sidebar__item[href="${pagePath('other')}"]`);
  await expect(item).toHaveCount(1);
  await expect(item.locator('.x-sidebar__label')).toHaveText('Other');
  await item.click();
  await page.waitForSelector('#mainPage-other', { timeout: 30000 });
  await expect(page.locator('#mainPage-other h1')).toContainText('Other');
  await expect(page.locator('#siteNav .x-sidebar__item--active')).toHaveAttribute('href', pagePath('other'));
});

test('?page=other lists every generated link, and each one answers 200 (#1738)', async ({ page }) => {
  await openOther(page, '/?page=other');
  const links = await readLinks(page);
  expect(links.map((l) => l.raw)).toEqual(EXPECTED.map((l) => l.href));
  expect(links.some((l) => l.raw.startsWith('demos/')), 'a demos/ link on the page').toBe(true);
  expect(links.some((l) => l.raw.startsWith('?page=')), 'a pages/ link on the page').toBe(true);
  for (const l of links) expect(l.raw, 'relative to the site root, never the domain root').not.toMatch(/^\//);
  expect(await notOk(page.request, links.flatMap((l) => urlsFor(l.resolved)))).toEqual([]);
});

test('under /wb-starter/, as GitHub Pages serves it, every link stays on the site and answers 200 (#1738)', async ({ page, baseURL }) => {
  const mount = await mountUnderSubPath(baseURL!);
  try {
    await openOther(page, `${mount.base}?page=other`);
    const item = page.locator(`#siteNav .x-sidebar__item[href="${PREFIX}/other"]`);
    await expect(item, 'the nav item links to /wb-starter/other').toHaveCount(1);

    const links = await readLinks(page);
    const offSite = links.filter((l) => !new URL(l.resolved).pathname.startsWith(`${PREFIX}/`));
    expect(offSite.map((l) => l.resolved), 'links that leave /wb-starter/').toEqual([]);
    expect(await notOk(page.request, [`${mount.base}other`, ...links.flatMap((l) => urlsFor(l.resolved))])).toEqual([]);

    // A page card is an in-site navigation, not a reload to the domain root.
    await page.locator('#mainPage-other .x-card__link-overlay[href="?page=contact"]').click();
    await page.waitForSelector('#mainPage-contact', { timeout: 30000 });
    expect(new URL(page.url()).pathname).toBe(`${PREFIX}/contact`);
  } finally {
    await mount.close();
  }
});
