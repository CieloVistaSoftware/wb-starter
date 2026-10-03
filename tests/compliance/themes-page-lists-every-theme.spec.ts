/**
 * The Themes page lists every theme, and says how many there are (#1025).
 *
 * John, 2026-09-05 and again 2026-10-03: the page "needs updating, we have way
 * more themes than this". themes.css had 50 themes; the page had 23
 * hand-written cards and said "23 beautiful themes", 12 dark and 11 light.
 *
 * The page is now written from src/core/themes-registry.js by
 * scripts/build-themes-page.mjs. This fails when the registry, themes.css and
 * the page disagree, so the next theme added cannot go missing silently.
 */
import fs from 'fs';
import path from 'path';
import { test, expect } from '../fixtures/offline';
import { ROOT } from '../base';
import { THEMES } from '../../src/core/themes-registry.js';
import { classifyThemes, renderFeaturesPage, renderThemesPage, themeCounts } from '../../scripts/lib/themes-page.mjs';

const css = fs.readFileSync(path.join(ROOT, 'src/styles/themes.css'), 'utf8');
const pageHtml = fs.readFileSync(path.join(ROOT, 'pages/themes.html'), 'utf8');
const featuresHtml = fs.readFileSync(path.join(ROOT, 'pages/features.html'), 'utf8');

test('every theme in themes.css is in the registry, and the other way round', () => {
  const inCss = [...new Set([...css.matchAll(/\[data-theme="([a-z0-9-]+)"\]/g)].map((m) => m[1]))].sort();
  expect(THEMES.map((t) => t.id).sort()).toEqual(inCss);
});

test('pages/themes.html and the features page count are what the registry says', () => {
  const classified = classifyThemes(THEMES, css);
  expect(
    renderThemesPage(pageHtml, classified) === pageHtml,
    'pages/themes.html is stale -- run: node scripts/build-themes-page.mjs'
  ).toBe(true);
  expect(
    renderFeaturesPage(featuresHtml, classified) === featuresHtml,
    'pages/features.html is stale -- run: node scripts/build-themes-page.mjs'
  ).toBe(true);
});

test('the page shows one card per theme and the right counts', async ({ page }) => {
  const { total, dark, light } = themeCounts(classifyThemes(THEMES, css));
  await page.goto('/?page=themes');
  await expect(page.locator('.theme-card')).toHaveCount(total);
  expect(await page.locator('.theme-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-theme')))).toEqual(THEMES.map((t) => t.id));
  await expect(page.locator('#themes-hero-count')).toContainText(`${total} beautiful themes`);
  await expect(page.locator('#themes-grid-title')).toHaveText(`All ${total} Themes`);
  await expect(page.locator('#themes-stats-total')).toHaveAttribute('value', String(total));
  await expect(page.locator('#themes-stats-dark')).toHaveAttribute('value', String(dark));
  await expect(page.locator('#themes-stats-light')).toHaveAttribute('value', String(light));
});

test('a card previews its own theme, and clicking it switches the site to that theme', async ({ page }) => {
  await page.goto('/?page=themes');
  const card = page.locator('#theme-card-ocean');
  await expect(card).toBeVisible();
  // The card renders in its own theme: its swatch is that theme's --primary.
  const [swatch, oceanPrimary] = await card.evaluate((el) => [
    getComputedStyle(el.querySelector('.theme-card__colors span')!).backgroundColor,
    getComputedStyle(el).getPropertyValue('--primary').trim(),
  ]);
  expect(oceanPrimary, 'the card does not carry the ocean theme').not.toBe('');
  expect(swatch).not.toBe('rgba(0, 0, 0, 0)');

  await card.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
  await expect(page.locator('.x-themecontrol__select').first()).toHaveValue('ocean');
  expect(await page.evaluate(() => localStorage.getItem('x-theme'))).toBe('ocean');
});
