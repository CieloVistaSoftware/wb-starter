import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { pageFromUrl, pageHref, isPageLink, FOLDER_PAGES } from '../../src/core/routes.js';
import { build404, pagesBase, shellPages, generatedFolders } from '../../scripts/generate-404.mjs';

/**
 * Pages live at real paths (#1001), and a path naming no page is a 404 (#957).
 *
 * John: "I want regular routing for navigation pull out the pages thing",
 * routing like `http://home/route`. Every page lived at /?page=<name>, and an
 * unknown path such as /behaviors rendered HOME with a 200.
 */
const ROOT = process.cwd();

// The GitHub Pages test answers requests itself; a live service worker would
// answer first (#1349).
test.use({ serviceWorkers: 'block' });

test('an address names its page, and a page has one address', () => {
  const site = 'https://example.github.io/wb-starter/';
  expect(pageFromUrl(`${site}behaviors`, site)).toEqual({ page: 'behaviors', legacy: false, path: 'behaviors' });
  expect(pageFromUrl(`${site}behaviors/`, site).page).toBe('behaviors');
  expect(pageFromUrl(site, site).page).toBe('home');
  expect(pageFromUrl(`${site}?page=releases`, site)).toEqual({ page: 'releases', legacy: true, path: 'releases' });
  expect(pageFromUrl(`${site}a/b`, site).page, 'a nested path is no page').toBeNull();
  expect(pageHref('behaviors', '?page=behaviors&file=x', site)).toBe('/wb-starter/behaviors?file=x');
  expect(pageHref('home', '', site)).toBe('/wb-starter/');
  expect(pageHref('demos', '', site), 'a page that is also a folder keeps ?page=').toBe('/wb-starter/?page=demos');
  expect(isPageLink(`${site}behaviors`, site)).toBe(true);
  expect(isPageLink(`${site}demos/site/cards.html`, site), 'a file is not a page').toBe(false);
  expect(isPageLink('https://github.com/x', site)).toBe(false);
});

test('a page that is also a folder of the site is listed, and only those', () => {
  const pages = fs.readdirSync(path.join(ROOT, 'pages')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
  // A folder holding only a generated page shell is the page's own address,
  // not a folder that shadows it.
  const generated = new Set(generatedFolders());
  const folders = pages.filter((p) => !generated.has(p) && fs.existsSync(path.join(ROOT, p)) && fs.statSync(path.join(ROOT, p)).isDirectory());
  expect(folders.sort()).toEqual([...FOLDER_PAGES].sort());
});

test('404.html is index.html plus the site root, nothing else', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const committed = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  // The ?v= cache keys are left out: main's stamp workflow rewrites them in
  // index.html on every merge and regenerates 404.html in the same step, so a
  // branch is one stamp behind main's index until it merges.
  const unstamped = (html: string) => html.replace(/\?v=\d+\.\d+\.\d+/g, '?v=');
  expect(unstamped(committed), 'run node scripts/generate-404.mjs')
    .toBe(unstamped(build404(index, pagesBase())));
  expect(committed).toContain('<base href="/wb-starter/">');
});

test('every page has a real file at its path, the same shell as 404.html, and nothing else does', () => {
  // GitHub Pages answers 404.html with a 404 status, and a search engine
  // drops a page that answers 404. A real <page>/index.html is answered 200.
  // ?v= left out, as for 404.html above: main's stamp rewrites it in every
  // shell on each merge, so a branch's copies are one stamp behind until then.
  const unstamped = (html: string) => html.replace(/\?v=\d+\.\d+\.\d+/g, '?v=');
  const shell = unstamped(fs.readFileSync(path.join(ROOT, '404.html'), 'utf8'));
  const pages = shellPages();
  expect(pages.length, 'the page list is not empty, so this can fail').toBeGreaterThan(5);
  const wrong = pages.filter((p) => {
    const file = path.join(ROOT, p, 'index.html');
    return !fs.existsSync(file) || unstamped(fs.readFileSync(file, 'utf8')) !== shell;
  });
  expect(wrong, 'run node scripts/generate-404.mjs and commit the folders').toEqual([]);
  expect(generatedFolders(), 'a generated folder for a page that no longer exists').toEqual(pages);
});

test('the dev server answers a page path with the shell, an unknown path with 404', async ({ request }) => {
  expect((await request.get('/behaviors')).status()).toBe(200);
  expect((await request.get('/releases/')).status()).toBe(200);
  expect((await request.get('/behaviorz')).status(), '#957: no page, no 200').toBe(404);
  expect((await request.get('/a/b')).status()).toBe(404);
});

test('opening /behaviors shows the Behaviors page and keeps the path', async ({ page }) => {
  await page.goto('/behaviors');
  await expect(page.locator('#mainPage-behaviors')).toBeAttached({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe('/behaviors');
});

test('an old ?page= address shows the page and moves to its path', async ({ page }) => {
  await page.goto('/?page=releases');
  await expect(page.locator('#mainPage-releases')).toBeAttached({ timeout: 20_000 });
  await expect.poll(() => new URL(page.url()).pathname).toBe('/releases');
  expect(new URL(page.url()).search).toBe('');
});

test('the nav links are paths, a click keeps the path, and Back returns', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('#siteNav a[href="/behaviors"]').first();
  await expect(link).toBeAttached({ timeout: 20_000 });
  await link.click();
  await expect(page.locator('#mainPage-behaviors')).toBeAttached({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe('/behaviors');
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
});

test('/behaviors/ moves to /behaviors, so the shell\'s assets still resolve', async ({ page }) => {
  await page.goto('/behaviors/?file=x');
  await expect(page.locator('#mainPage-behaviors')).toBeAttached({ timeout: 20_000 });
  const url = new URL(page.url());
  expect(url.pathname + url.search).toBe('/behaviors?file=x');
});

test('a path naming no page shows "Page not found", not home (#957)', async ({ page }) => {
  await page.goto('/behaviorz');
  await expect(page.locator('#page-404')).toBeAttached({ timeout: 20_000 });
  await expect(page.locator('#mainPage-home')).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/behaviorz');
});

/**
 * GitHub Pages, simulated: the site lives at /wb-starter/; a file is served as
 * itself; a folder without its trailing slash is redirected to it, and with it
 * serves the folder's index.html; anything else gets 404.html with a 404.
 */
async function serveLikeGitHubPages(page: import('@playwright/test').Page) {
  const shell404 = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  await page.route(/\/wb-starter\//, async (route) => {
    const url = new URL(route.request().url());
    const rel = url.pathname.replace(/^\/wb-starter\//, '');
    const target = path.join(ROOT, rel);
    const isDir = rel !== '' && fs.existsSync(target) && fs.statSync(target).isDirectory();
    if (isDir && !rel.endsWith('/')) {
      return route.fulfill({ status: 301, headers: { location: `${url.pathname}/${url.search}` } });
    }
    const file = rel === '' ? 'index.html' : isDir ? `${rel}index.html` : rel;
    if (fs.existsSync(path.join(ROOT, file)) && fs.statSync(path.join(ROOT, file)).isFile()) {
      const res = await route.fetch({ url: `${url.origin}/${file}${url.search}` });
      return route.fulfill({ response: res });
    }
    return route.fulfill({ status: 404, contentType: 'text/html', body: shell404 });
  });
}

test('on GitHub Pages, /wb-starter/behaviors/ answers 200 and shows Behaviors', async ({ page }) => {
  await serveLikeGitHubPages(page);
  // Pages redirects /wb-starter/behaviors to the folder, /wb-starter/behaviors/.
  // Playwright does not route a redirect's target, so this opens the target.
  const response = await page.goto('/wb-starter/behaviors/');
  expect(response?.status(), 'a real file at the path, so not 404.html\'s 404').toBe(200);
  await expect(page.locator('#mainPage-behaviors')).toBeAttached({ timeout: 20_000 });
  const href = await page.locator('#siteNav a', { hasText: /releases/i }).first().getAttribute('href');
  expect(href, 'nav links carry the site root').toBe('/wb-starter/releases');
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

test('on GitHub Pages, a path naming no page answers 404 and says so (#957)', async ({ page }) => {
  await serveLikeGitHubPages(page);
  const response = await page.goto('/wb-starter/behaviorz');
  expect(response?.status()).toBe(404);
  await expect(page.locator('#page-404')).toBeAttached({ timeout: 20_000 });
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});
