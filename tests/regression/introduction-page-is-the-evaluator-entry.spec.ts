import { test, expect } from '../fixtures/offline';
import { heroPermutations } from '../../src/lib/hero-permutations.js';

/**
 * THE INTRODUCTION IS WHERE AN EVALUATOR STARTS (#1244)
 * =====================================================
 * John: "add an issue to include an Introduction to what this framework is,
 * why it is the end for traditional web frameworks, put in links to other
 * docs" -- then: "make the introduction a webpage then include link to it
 * there", pinned on the Documentation page under search and sort.
 *
 * See it by hand: open ?page=docs. Before: the document list started straight
 * under the search box, and there was no Introduction. Now: a pinned
 * "New here? Start with the Introduction" card sits above the list, stays
 * through any sort or search, and opens ?page=introduction.
 */

test.describe('Introduction page (#1244)', () => {
  test('opens as ?page=introduction with its three parts', async ({ page }) => {
    await page.goto('/?page=introduction');
    await expect(page.locator('#intro-hero h1')).toHaveText('Introduction to wb-starter');
    await expect(page.locator('#intro-what h2')).toHaveText('What it is');
    await expect(page.locator('#intro-why h2')).toHaveText('Why it ends the traditional framework');
    await expect(page.locator('#intro-next h2')).toHaveText('Where to go next');
  });

  test('every "why" row links to evidence', async ({ page }) => {
    await page.goto('/?page=introduction');
    const rows = page.locator('#intro-why-table tbody tr');
    await expect(rows).toHaveCount(6);
    for (const row of await rows.all()) {
      await expect(row.locator('td').last().locator('a[href]').first()).toBeVisible();
    }
  });

  test('on a phone the comparison scrolls in its own box, not off the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?page=introduction');
    await expect(page.locator('#intro-why-table')).toBeVisible();
    await expect.poll(() => page.evaluate(() => {
      const box = document.querySelector('#intro-why-scroll') as HTMLElement;
      const doc = document.documentElement;
      return { scrolls: getComputedStyle(box).overflowX === 'auto', pageFits: doc.scrollWidth <= doc.clientWidth };
    })).toEqual({ scrolls: true, pageFits: true });
  });

  test('the Documentation page pins it above the list, whatever the sort or search', async ({ page }) => {
    await page.goto('/?page=docs');
    const pinned = page.locator('#docs-introduction a[href="?page=introduction"]');
    await expect(pinned).toBeVisible();
    // Above the document list, below the search and sort controls.
    const order = await page.evaluate(() => {
      const at = (sel: string) => document.querySelector(sel)!.getBoundingClientRect().top;
      return at('#docs-sort') < at('#docs-introduction') && at('#docs-introduction') < at('#docs-container');
    });
    expect(order).toBe(true);
    await page.locator('#docs-sort').selectOption('category');
    await page.fill('#docs-search', 'theme');
    await expect(pinned).toBeVisible();
    await pinned.click();
    await expect(page.locator('#intro-hero h1')).toHaveText('Introduction to wb-starter');
  });
});

test('a hero\'s "Read the guide" opens the Introduction (#1244)', () => {
  const guide = heroPermutations()
    .flatMap((h) => [h.cta, h.cta2])
    .filter((c) => c && /^Read the guide$/i.test(c.label));
  expect(guide.length).toBeGreaterThan(0);
  expect(new Set(guide.map((c) => c!.href))).toEqual(new Set(['https://cielovistasoftware.github.io/wb-starter/?page=introduction']));
});
