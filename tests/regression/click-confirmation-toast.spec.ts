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

    // Each click is checked by ITS OWN toast, not by the total on the page:
    // confirmation toasts dismiss themselves after 2s, so on a slow runner
    // the first one is gone before the third click is checked (CI, PR #1228).
    const toastFor = (id: string) => page.locator('.x-toast', { hasText: `Clicked: ${id}` });

    await page.locator('#click-confirm-button').click();
    await expect(toastFor('click-confirm-button')).toHaveCount(1);

    await page.locator('#click-confirm-card').click();
    await expect(toastFor('click-confirm-card')).toHaveCount(1);

    await page.locator('#click-confirm-link').click();
    await expect(page).toHaveURL(/#click-confirm-target$/);
    // The confirmation is deferred one tick (click-confirm.js); give it that
    // tick, then require that the anchor raised none.
    await page.evaluate(() => new Promise((r) => setTimeout(r, 50)));
    await expect(page.locator('.x-toast', { hasText: /Clicked: (click-confirm-link|Navigate)/ })).toHaveCount(0);
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