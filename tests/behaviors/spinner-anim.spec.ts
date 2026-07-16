/**
 * wb-spinner — renders animated, sized, themed (issue #128)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'spinner-test-area';
    c.style.cssText = 'padding:20px; display:flex; gap:16px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('wb-spinner', () => {
  test('gets base + size + color classes', async ({ page }) => {
    await setup(page, '<wb-spinner id="sp" size="lg" color="success"></wb-spinner>');
    const sp = page.locator('#sp');
    await expect(sp).toHaveClass(/wb-spinner/);
    await expect(sp).toHaveClass(/wb-spinner--lg/);
    await expect(sp).toHaveClass(/wb-spinner--success/);
  });

  test('inner ring has a running animation', async ({ page }) => {
    await setup(page, '<wb-spinner id="sp2" size="md" color="primary"></wb-spinner>');
    const anim = await page.locator('#sp2').evaluate((el) => {
      const ring = el.querySelector('div') as HTMLElement;
      return ring ? getComputedStyle(ring).animationName : 'none';
    });
    expect(anim).not.toBe('none');
    expect(anim).not.toBe('');
  });
});
