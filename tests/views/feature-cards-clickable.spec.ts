/**
 * #184 — the home page Features cards must be clickable and navigate to their
 * subsystem pages (via the SPA router).
 */
import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';

// 'Component Library' became 'Behavior Library' when components were removed
// (a behavior is an x- attribute on a neutral host) -- pages/home.html's card
// was renamed with them; this list still named the old card.
const EXPECTED = [
  { title: 'Behavior Library', href: '?page=behaviors' },
  { title: 'Behaviors System', href: '?page=behaviors' },
  { title: 'Theme Engine', href: '?page=themes' },
  { title: 'Data Viz', href: '?page=demos' },
  { title: 'Accessible', href: '?page=docs' },
  { title: 'Performance', href: '?page=docs' },
];

test.describe('#184 — home feature cards are clickable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=home');
    await page.waitForSelector('.feature-card-link', { timeout: 20000 });
    // The page is built once WB settles (#1516: no fixed sleep).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));
  });

  test('each feature card is an anchor to a ?page= route', async ({ page }) => {
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('.feature-card-link')].map((a) => ({
        href: a.getAttribute('href'),
        title: (a.querySelector('h3')?.textContent || '').replace(/^[^A-Za-z]+/, '').trim(),
        // The card is the semantic <article> (#854), and card.js no longer
        // stamps an .x-card class on it (#448 -- card.css selects the element
        // and its [variant] directly), so `.x-card` matched nothing. "Wraps a
        // card" is an <article> the card behavior has settled on (x-ready).
        hasCard: !!a.querySelector('article[x-ready]'),
        underline: getComputedStyle(a as HTMLElement).textDecorationLine,
      }))
    );
    expect(links.length, 'expected 6 feature cards').toBe(6);
    for (const exp of EXPECTED) {
      const found = links.find((l) => l.title.startsWith(exp.title));
      expect(found, `feature card "${exp.title}" not found`).toBeTruthy();
      expect(found!.href, `"${exp.title}" links to wrong route`).toBe(exp.href);
      expect(found!.hasCard, `"${exp.title}" anchor does not wrap a built <article> card`).toBe(true);
      expect(found!.underline, 'feature card link should not be underlined').toBe('none');
    }
  });

  test('clicking a feature card navigates via the SPA', async ({ page }) => {
    await page.click('.feature-card-link[href="?page=behaviors"]');
    // The card still says ?page=behaviors; the site files it under the page's
    // real path (#1001). Polled until the SPA navigates (#1516: not 800ms).
    await expect.poll(() => page.evaluate(() => location.pathname + location.search), {
      message: 'clicking the Behavior Library card did not navigate',
    }).toBe(pagePath('behaviors'));
  });
});
