import { test, expect, Page } from '../fixtures/offline';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  await page.evaluate(() => document.querySelector('.x-toast-container')?.remove());
}

test.describe('site-wide click confirmation (#456)', () => {
  test('confirms native buttons and clickable cards without intercepting anchors', async ({ page }) => {
    await loadPage(page);
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'click-confirm-button';
      button.textContent = 'Save';

      const card = document.createElement('div');
      card.id = 'click-confirm-card';
      card.className = 'x-card--clickable';
      card.textContent = 'Open card';

      const link = document.createElement('a');
      link.id = 'click-confirm-link';
      link.href = '#click-confirm-target';
      link.textContent = 'Navigate';

      document.body.append(button, card, link);
    });

    await page.locator('#click-confirm-button').click();
    await expect(page.locator('.x-toast')).toHaveCount(1);
    await expect(page.locator('.x-toast')).toContainText('Clicked: click-confirm-button');

    await page.locator('#click-confirm-card').click();
    await expect(page.locator('.x-toast')).toHaveCount(2);
    await expect(page.locator('.x-toast').last()).toContainText('Clicked: click-confirm-card');

    await page.locator('#click-confirm-link').click();
    await expect(page.locator('.x-toast')).toHaveCount(2);
    await expect(page).toHaveURL(/#click-confirm-target$/);
  });

  test('does not duplicate an explicit x-toast confirmation', async ({ page }) => {
    await loadPage(page);
    // The Behaviors page is a catalogue now (#666): an x-toast trigger only
    // exists once its row is picked, so this used to wait out the timeout on a
    // button that was never there. A query opens the collapsed group (#995).
    await expect(page.locator('.behaviors-search-results__row').first()).toBeVisible({ timeout: 25000 });
    await page.locator('#behaviors-search').fill('x-toast');
    const row = page.locator('.behaviors-search-results__row[data-browse-token="x-toast"][data-variant="success"]').first();
    await row.scrollIntoViewIfNeeded();
    await row.click();
    const button = page.locator('#behaviors-live [x-toast][toast-variant="success"]').first();
    await button.scrollIntoViewIfNeeded();
    await expect(button).toHaveAttribute('x-ready', '', { timeout: 10000 });
    // The row click is a plain button, so it raised its own confirmation.
    await page.evaluate(() => document.querySelectorAll('.x-toast').forEach((el) => el.remove()));
    await button.click();
    await expect(page.locator('.x-toast--success')).toHaveCount(1);
    await expect(page.locator('.x-toast')).toHaveCount(1);
  });
});