/**
 * wb-skeleton — renders text lines / circle / rect (issue #129)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'skeleton-test-area';
    c.style.cssText = 'padding:20px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('wb-skeleton', () => {
  test('text variant renders the requested number of visible lines', async ({ page }) => {
    await setup(page, '<wb-skeleton id="sk-text" variant="text" lines="3" style="width:200px;"></wb-skeleton>');
    const spans = page.locator('#sk-text > span');
    await expect(spans).toHaveCount(3);
    // first line must actually paint (not background:none inherited)
    const bg = await spans.first().evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
  });

  test('circle variant is square and round', async ({ page }) => {
    await setup(page, '<wb-skeleton id="sk-circle" variant="circle" width="60px"></wb-skeleton>');
    const box = await page.locator('#sk-circle').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box!.width) - (box!.height))).toBeLessThan(4);
    expect(box!.width).toBeGreaterThan(40);
  });

  test('rect variant honors width and height', async ({ page }) => {
    await setup(page, '<wb-skeleton id="sk-rect" variant="rect" width="150px" height="100px"></wb-skeleton>');
    const box = await page.locator('#sk-rect').boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(140);
    expect(box!.height).toBeGreaterThan(90);
  });
});
