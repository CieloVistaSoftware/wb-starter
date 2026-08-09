import { test, expect, Page } from '@playwright/test';

/**
 * Home page link integrity.
 * Every visible <a> on the home page must have a real, working destination —
 * no dead href="#"/empty/javascript: links — and the in-app ?page= routes
 * must actually navigate. Runs every time so a regressed CTA fails CI.
 */

const BASE = 'http://localhost:3000/';

async function loadHome(page: Page) {
  await page.goto(BASE);
  // Site engine fetches pages/home.html into #app; wait for the hero CTA.
  await page.locator('wb-cardhero a, .hero a, #app a').first().waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('Home page — link integrity', () => {
  test('no dead links (no #, empty, or javascript: hrefs)', async ({ page }) => {
    await loadHome(page);

    const dead = await page.$$eval('#app a[href], main a[href], wb-cardhero a[href]', (as) =>
      as
        .map((a) => ({ text: (a.textContent || '').trim().slice(0, 40), href: a.getAttribute('href') || '' }))
        .filter((l) => {
          const h = l.href.trim();
          return h === '' || h === '#' || h.startsWith('javascript:');
        })
    );

    expect(dead, `Dead links found: ${JSON.stringify(dead, null, 2)}`).toEqual([]);
  });

  test('hero CTAs point to real routes and navigate', async ({ page }) => {
    await loadHome(page);

    const explore = page.getByRole('link', { name: /explore components/i });
    const docs = page.getByRole('link', { name: /documentation/i });

    await expect(explore).toHaveAttribute('href', '?page=components');
    await expect(docs).toHaveAttribute('href', '?page=docs');

    // Clicking "Explore Components" routes to the components page.
    await explore.click();
    await expect(page).toHaveURL(/\?page=components/);
    await page.waitForTimeout(300);

    // Back home, then "Documentation" routes to the docs page.
    await page.goto(BASE);
    await loadHome(page);
    await page.getByRole('link', { name: /documentation/i }).click();
    await expect(page).toHaveURL(/\?page=docs/);
  });

  test('every in-app ?page= link resolves to a fetchable page', async ({ page, request }) => {
    await loadHome(page);

    const pageLinks: string[] = await page.$$eval('#app a[href^="?page="], wb-cardhero a[href^="?page="]', (as) =>
      Array.from(new Set(as.map((a) => (a.getAttribute('href') || '').replace('?page=', '')).filter(Boolean)))
    );

    for (const slug of pageLinks) {
      const res = await request.get(`${BASE}pages/${slug}.html`);
      expect(res.status(), `pages/${slug}.html should exist (linked from home)`).toBeLessThan(400);
    }
  });
});
