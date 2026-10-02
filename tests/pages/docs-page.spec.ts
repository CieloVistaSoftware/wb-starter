/**
 * Docs Page Tests
 * Verifies the /pages/docs.html (?page=docs) showcase page, including the
 * <div x-themecontrol> added to the hero so John can switch themes while
 * browsing documentation (owner decision). It is the same x-themecontrol
 * behavior the site header uses (#headerThemeControl), not a second
 * implementation -- #1018 rules out duplicate controls -- so the two must stay
 * in sync: changing the hero's control changes the site theme AND the header's.
 */
import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

test.describe('Docs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=docs');
    // Wait for WB to initialize
    await wbIdle(page);
  });

  test('page loads successfully', async ({ page }) => {
    const hero = page.locator('#docs-hero.page__hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('Documentation');
  });

  test('theme control renders in the hero', async ({ page }) => {
    const themeControl = page.locator('#docs-hero [x-themecontrol]');
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
    const select = page.locator('#docs-hero [x-themecontrol] select.x-themecontrol__select');
    await expect(select).toBeVisible();

    // Start from a known theme, then switch and confirm data-theme follows.
    await select.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await select.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await select.selectOption('ocean');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');

    // One theme, two views of it: the header's control follows the hero's.
    await expect(page.locator('#headerThemeControl select.x-themecontrol__select')).toHaveValue('ocean');
  });
});
