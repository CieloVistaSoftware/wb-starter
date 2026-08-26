import { test, expect, Page } from '@playwright/test';

async function inject(page: Page, html: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((markup) => {
    const container = document.createElement('main');
    container.id = 'test-container';
    container.innerHTML = markup;
    document.body.appendChild(container);
    (window as any).WB.scan(container);
  }, html);
  await page.waitForTimeout(500);
}

test.describe('wb-* primary values', () => {
  test('supports chip label attributes and authored text', async ({ page }) => {
    await inject(page, '<span x-chip id="attribute" label="Attribute label"></span><span x-chip id="text">Authored label</span>');

    await expect(page.locator('#attribute .x-chip__label')).toHaveText('Attribute label');
    await expect(page.locator('#text .x-chip__label')).toHaveText('Authored label');
  });

  test('supports input value attributes and authored text', async ({ page }) => {
    await inject(page, '<div x-input id="attribute" value="Attribute value"></div><div x-input id="text">Authored value</div>');

    await expect(page.locator('#attribute input')).toHaveValue('Attribute value');
    await expect(page.locator('#text input')).toHaveValue('Authored value');
  });

  test('supports progress value attributes and authored text', async ({ page }) => {
    await inject(page, '<progress id="attribute" value="25"></progress><progress id="text">75</progress>');

    await expect(page.locator('#attribute')).toHaveAttribute('aria-valuenow', '25');
    await expect(page.locator('#text')).toHaveAttribute('aria-valuenow', '75');
  });

  test('supports rating value attributes and authored text', async ({ page }) => {
    await inject(page, '<span x-rating id="attribute" value="2"></span><span x-rating id="text">4</span>');

    await expect(page.locator('#attribute .x-rating__star--full')).toHaveCount(2);
    await expect(page.locator('#text .x-rating__star--full')).toHaveCount(4);
  });

  test('supports timeline items attributes and authored text', async ({ page }) => {
    await inject(page, '<div x-timeline id="attribute" items="One,Two"></div><div x-timeline id="text">Three,Four</div>');

    await expect(page.locator('#attribute .x-timeline-item')).toHaveText(['One', 'Two']);
    await expect(page.locator('#text .x-timeline-item')).toHaveText(['Three', 'Four']);
  });
});