import { test, expect, Page } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  await page.evaluate(() => document.querySelector('.wb-toast-container')?.remove());
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
      card.className = 'wb-card--clickable';
      card.textContent = 'Open card';

      const link = document.createElement('a');
      link.id = 'click-confirm-link';
      link.href = '#click-confirm-target';
      link.textContent = 'Navigate';

      document.body.append(button, card, link);
    });

    await page.locator('#click-confirm-button').click();
    await expect(page.locator('.wb-toast')).toHaveCount(1);
    await expect(page.locator('.wb-toast')).toContainText('Clicked: Save');

    await page.locator('#click-confirm-card').click();
    await expect(page.locator('.wb-toast')).toHaveCount(2);
    await expect(page.locator('.wb-toast').last()).toContainText('Clicked: Open card');

    await page.locator('#click-confirm-link').click();
    await expect(page.locator('.wb-toast')).toHaveCount(2);
    await expect(page).toHaveURL(/#click-confirm-target$/);
  });

  test('does not duplicate an explicit x-toast confirmation', async ({ page }) => {
    await loadPage(page);
    const button = page.locator('[x-toast][toast-variant="success"]').first();
    await button.click();
    await expect(page.locator('.wb-toast--success')).toHaveCount(1);
    await expect(page.locator('.wb-toast')).toHaveCount(1);
  });
});