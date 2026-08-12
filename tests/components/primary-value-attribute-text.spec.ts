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
    await inject(page, '<wb-chip id="attribute" label="Attribute label"></wb-chip><wb-chip id="text">Authored label</wb-chip>');

    await expect(page.locator('#attribute .wb-chip__label')).toHaveText('Attribute label');
    await expect(page.locator('#text .wb-chip__label')).toHaveText('Authored label');
  });

  test('supports input value attributes and authored text', async ({ page }) => {
    await inject(page, '<wb-input id="attribute" value="Attribute value"></wb-input><wb-input id="text">Authored value</wb-input>');

    await expect(page.locator('#attribute input')).toHaveValue('Attribute value');
    await expect(page.locator('#text input')).toHaveValue('Authored value');
  });

  test('supports progress value attributes and authored text', async ({ page }) => {
    await inject(page, '<wb-progress id="attribute" value="25"></wb-progress><wb-progress id="text">75</wb-progress>');

    await expect(page.locator('#attribute')).toHaveAttribute('aria-valuenow', '25');
    await expect(page.locator('#text')).toHaveAttribute('aria-valuenow', '75');
  });

  test('supports rating value attributes and authored text', async ({ page }) => {
    await inject(page, '<wb-rating id="attribute" value="2"></wb-rating><wb-rating id="text">4</wb-rating>');

    await expect(page.locator('#attribute .wb-rating__star--full')).toHaveCount(2);
    await expect(page.locator('#text .wb-rating__star--full')).toHaveCount(4);
  });

  test('supports timeline items attributes and authored text', async ({ page }) => {
    await inject(page, '<wb-timeline id="attribute" items="One,Two"></wb-timeline><wb-timeline id="text">Three,Four</wb-timeline>');

    await expect(page.locator('#attribute .wb-timeline-item')).toHaveText(['One', 'Two']);
    await expect(page.locator('#text .wb-timeline-item')).toHaveText(['Three', 'Four']);
  });
});