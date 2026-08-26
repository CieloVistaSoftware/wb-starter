/**
 * Docs Page Tests
 * Verifies the /pages/docs.html (?page=docs) showcase page, including the
 * <div x-themecontrol> added to the hero so John can switch themes while
 * browsing documentation, matching the pattern already used on
 * pages/themes.html and pages/behaviors.html.
 */
import { test, expect } from '@playwright/test';

test.describe('Docs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=docs');
    // Wait for WB to initialize
    await page.waitForTimeout(500);
  });

  test('page loads successfully', async ({ page }) => {
    const hero = page.locator('#docs-hero.page__hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('Documentation');
  });

  test('theme control renders in the hero', async ({ page }) => {
    const themeControl = page.locator('#docs-hero x-themecontrol');
    await expect(themeControl).toBeVisible();

    const select = themeControl.locator('select.x-themecontrol__select');
    await expect(select).toBeVisible();

    // Sanity check a representative set of themes is present.
    const optionValues = await select.locator('option').evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value)
    );
    expect(optionValues).toEqual(expect.arrayContaining(['dark', 'light']));
  });

  test('selecting a theme in the control updates the page theme', async ({ page }) => {
    const select = page.locator('#docs-hero x-themecontrol select.x-themecontrol__select');
    await expect(select).toBeVisible();

    // Start from a known theme, then switch and confirm data-theme follows.
    await select.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await select.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await select.selectOption('ocean');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
  });
});
