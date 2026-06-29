/**
 * #184 — the home page Features cards must be clickable and navigate to their
 * subsystem pages (via the SPA ?page= router).
 */
import { test, expect } from '@playwright/test';

const EXPECTED = [
  { title: 'Component Library', href: '?page=components' },
  { title: 'Behaviors System', href: '?page=behaviors' },
  { title: 'Theme Engine', href: '?page=themes' },
  { title: 'Data Viz', href: '?page=demos' },
  { title: 'Accessible', href: '?page=docs' },
  { title: 'Performance', href: '?page=docs' },
];

test.describe('#184 — home feature cards are clickable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=home');
    await page.waitForSelector('.feature-card-link', { timeout: 20000 });
    await page.waitForTimeout(1000);
  });

  test('each feature card is an anchor to a ?page= route', async ({ page }) => {
    const links = await page.evaluate(() =>
      [...document.querySelectorAll('.feature-card-link')].map((a) => ({
        href: a.getAttribute('href'),
        title: (a.querySelector('h3')?.textContent || '').replace(/^[^A-Za-z]+/, '').trim(),
        hasCard: !!a.querySelector('wb-card'),
        underline: getComputedStyle(a as HTMLElement).textDecorationLine,
      }))
    );
    expect(links.length, 'expected 6 feature cards').toBe(6);
    for (const exp of EXPECTED) {
      const found = links.find((l) => l.title.startsWith(exp.title));
      expect(found, `feature card "${exp.title}" not found`).toBeTruthy();
      expect(found!.href, `"${exp.title}" links to wrong route`).toBe(exp.href);
      expect(found!.hasCard, `"${exp.title}" anchor does not wrap a wb-card`).toBe(true);
      expect(found!.underline, 'feature card link should not be underlined').toBe('none');
    }
  });

  test('clicking a feature card navigates via the SPA', async ({ page }) => {
    await page.click('.feature-card-link[href="?page=components"]');
    await page.waitForTimeout(800);
    const url = await page.evaluate(() => location.search);
    expect(url, 'clicking the Component Library card did not navigate').toContain('page=components');
  });
});
