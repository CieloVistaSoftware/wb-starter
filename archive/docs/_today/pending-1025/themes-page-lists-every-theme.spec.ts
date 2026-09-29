/**
 * THE THEMES PAGE SHOWS EVERY THEME THE SITE SHIPS
 * ================================================
 * John: "localhost:3000/?page=themes this page needs updating we have a lot
 * more themes now." (#1025)
 *
 * It was showing 23 of 50. Nothing was broken in the usual sense — the page
 * simply had its own hand-written copy of the theme list, so a theme added to
 * themes.css never appeared here, and the three places the page says how many
 * themes there are all went stale together.
 *
 * This test is the reason the page can be trusted to be complete: it compares
 * three lists that must agree —
 *
 *   src/styles/themes.css        [data-theme="..."] declarations   (the truth)
 *   src/core/themes-registry.js  what the site offers              (the list)
 *   ?page=themes                 the cards actually rendered       (the page)
 *
 * If they disagree the build fails, naming the missing ids. Adding a theme is
 * then a two-file change that CANNOT half-land.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

function themeIdsInCss(): string[] {
  const css = readFileSync('src/styles/themes.css', 'utf8')
    // Comments mention data-theme in examples; blank them so they are not counted.
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
  const ids = new Set<string>();
  for (const m of css.matchAll(/\[data-theme=["']([a-z0-9-]+)["']\]/gi)) ids.add(m[1]);
  return [...ids].sort();
}

function themeIdsInRegistry(): string[] {
  const src = readFileSync('src/core/themes-registry.js', 'utf8');
  const ids = new Set<string>();
  for (const m of src.matchAll(/\bid:\s*['"]([a-z0-9-]+)['"]/gi)) ids.add(m[1]);
  return [...ids].sort();
}

test.describe('themes page completeness (#1025)', () => {
  test('the registry lists every theme themes.css declares', () => {
    const css = themeIdsInCss();
    const registry = themeIdsInRegistry();

    const missing = css.filter((id) => !registry.includes(id));
    const extra = registry.filter((id) => !css.includes(id));

    expect(
      missing,
      'themes.css declares themes the registry does not offer, so they are '
      + 'unreachable from the dropdown AND absent from the themes page:\n  '
      + missing.join('\n  '),
    ).toEqual([]);
    expect(
      extra,
      'the registry offers themes themes.css does not declare — picking one '
      + 'would apply an attribute no stylesheet answers:\n  ' + extra.join('\n  '),
    ).toEqual([]);
  });

  test('the page renders one card per registered theme, and says so', async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelectorAll('#themes-grid .theme-card').length > 0,
      undefined,
      { timeout: 20_000 },
    );

    const registry = themeIdsInRegistry();
    const rendered = await page.evaluate(() =>
      [...document.querySelectorAll('#themes-grid .theme-card')].map(
        (c) => (c as HTMLElement).dataset.themeId || '',
      ).sort(),
    );

    const missing = registry.filter((id) => !rendered.includes(id));
    expect(
      missing,
      `the themes page is missing ${missing.length} theme card(s):\n  ` + missing.join('\n  '),
    ).toEqual([]);
    expect(rendered.length).toBe(registry.length);

    // The counts the page prints have to be the counts it shows. They were
    // literals ("23", "12", "11") and all three were wrong.
    const claimed = await page.evaluate(() => ({
      total: Number(document.querySelector('#themes-stats-total .x-card__stats-value, #themes-stats-total data')?.textContent || 0),
      dark: Number(document.querySelector('#themes-stats-dark .x-card__stats-value, #themes-stats-dark data')?.textContent || 0),
      light: Number(document.querySelector('#themes-stats-light .x-card__stats-value, #themes-stats-light data')?.textContent || 0),
      heading: document.querySelector('#themes-grid-title')?.textContent || '',
    }));

    expect(claimed.total).toBe(rendered.length);
    expect(claimed.dark + claimed.light).toBe(rendered.length);
    expect(claimed.heading).toContain(String(rendered.length));
  });

  test('clicking a card switches the site theme', async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    const card = page.locator('#themes-grid .theme-card[data-theme-id="sapphire-dark"]');
    await card.waitFor({ state: 'visible', timeout: 20_000 });
    await card.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sapphire-dark');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('no card paints a hardcoded colour — the theme paints itself', async ({ page }) => {
    await page.goto('/?page=themes', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelectorAll('#themes-grid .theme-card').length > 0,
      undefined,
      { timeout: 20_000 },
    );

    const withInlineStyle = await page.evaluate(() =>
      [...document.querySelectorAll('#themes-grid .theme-card, #themes-grid .theme-card *')]
        .filter((el) => (el as HTMLElement).getAttribute('style'))
        .map((el) => (el as HTMLElement).outerHTML.slice(0, 90)),
    );

    expect(
      withInlineStyle,
      'a theme card is painting itself with an inline style again — the swatches '
      + 'come from the card\'s own data-theme variables (standard §11).',
    ).toEqual([]);
  });
});
