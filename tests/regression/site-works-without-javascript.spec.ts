import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';

/**
 * With JavaScript off the site still offers its pages (#1877).
 *
 * John: "one of the selling points is that the page will render anyway using
 * just semantic html". The shell is built by JavaScript, so with it off `/`
 * showed only "Loading..." and no links. index.html now carries a <noscript>
 * menu linking every page in config/site.json's navigationMenu.
 */
const ROOT = process.cwd();
const menu: { menuItemId: string; href?: string }[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config/site.json'), 'utf8'),
).navigationMenu;
// An item names its own href (error-log), or else opens its page fragment.
const links = menu.map((m) => m.href ?? `pages/${m.menuItemId}.html`);

test.use({ javaScriptEnabled: false, serviceWorkers: 'block' });

test('the noscript menu links every page in the navigation menu', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/i)?.[1] ?? '';
  for (const href of links) {
    expect(noscript, `index.html <noscript> links ${href}`).toContain(`href="${href}"`);
  }
});

test('with JavaScript off, home shows links to every page, and each one opens', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('nav[aria-label="Pages"] a').evaluateAll((as) =>
    as.map((a) => a.getAttribute('href')),
  );
  expect(hrefs, 'links in the no-JavaScript menu').toEqual(links);

  for (const href of hrefs) {
    const res = await page.goto(`/${href}`);
    expect(res?.status(), `${href} answers`).toBe(200);
    const text = (await page.locator('body').innerText()).trim();
    expect(text.length, `${href} has readable text`).toBeGreaterThan(20);
  }
});
