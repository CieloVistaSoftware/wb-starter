import { test, expect } from '@playwright/test';

test('progress renders its Light DOM fill after schema-aware scanning', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors,
    { timeout: 15000 }
  );

  await page.evaluate(() => {
    const container = document.createElement('div');
    container.id = 'progress-render-test';
    container.style.width = '400px';
    container.innerHTML = '<progress id="progress-render-target" value="65" max="100"></progress>';
    document.body.appendChild(container);
  });

  await page.evaluate(async () => {
    await (window as any).WB.scan(document.getElementById('progress-render-test'), { eager: true });
  });

  const progress = page.locator('#progress-render-target');
  const bar = progress.locator('.x-progress__bar');
  await expect(bar).toHaveCount(1);
  await expect(bar).toHaveAttribute('style', /width: 65%/);
  await expect(progress).toBeVisible();

  const dimensions = await progress.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height
  }));
  expect(dimensions.width).toBeGreaterThan(0);
  expect(dimensions.height).toBeGreaterThan(0);
});
