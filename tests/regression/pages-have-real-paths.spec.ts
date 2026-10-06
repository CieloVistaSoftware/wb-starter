import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { pageFromUrl, pageHref, isPageLink, FOLDER_PAGES } from '../../src/core/routes.js';
import { build404, pagesBase } from '../../scripts/generate-404.mjs';

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
  const folders = pages.filter((p) => fs.existsSync(path.join(ROOT, p)) && fs.statSync(path.join(ROOT, p)).isDirectory());
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

test('on GitHub Pages, /wb-starter/behaviors is served 404.html and shows Behaviors', async ({ page }) => {
  // GitHub Pages: the site lives at /wb-starter/, and a path with no file gets
  // 404.html. Simulated: /wb-starter/<file> serves <file>, anything else 404.html.
  const shell404 = fs.readFileSync(path.join(ROOT, '404.html'), 'utf8');
  await page.route(/\/wb-starter\//, async (route) => {
    const url = new URL(route.request().url());
    const rel = url.pathname.replace(/^\/wb-starter\//, '');
    const file = path.join(ROOT, rel);
    if (rel && fs.existsSync(file) && fs.statSync(file).isFile()) {
      const res = await route.fetch({ url: `${url.origin}/${rel}${url.search}` });
      return route.fulfill({ response: res });
    }
    if (rel === '' ) return route.fulfill({ response: await route.fetch({ url: `${url.origin}/index.html` }) });
    return route.fulfill({ status: 404, contentType: 'text/html', body: shell404 });
  });
  await page.goto('/wb-starter/behaviors');
  await expect(page.locator('#mainPage-behaviors')).toBeAttached({ timeout: 20_000 });
  const href = await page.locator('#siteNav a', { hasText: /releases/i }).first().getAttribute('href');
  expect(href, 'nav links carry the site root').toBe('/wb-starter/releases');
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});
