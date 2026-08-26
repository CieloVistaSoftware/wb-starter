/**
 * x-spinner — renders animated, sized, themed (issue #128)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
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

test.describe('x-spinner', () => {
  test('gets base + size + color classes', async ({ page }) => {
    await setup(page, '<span x-spinner id="sp" size="lg" color="success"></span>');
    const sp = page.locator('#sp');
    await expect(sp).toHaveClass(/x-spinner/);
    await expect(sp).toHaveClass(/x-spinner--lg/);
    await expect(sp).toHaveClass(/x-spinner--success/);
  });

  test('inner ring has a running animation', async ({ page }) => {
    await setup(page, '<span x-spinner id="sp2" size="md" color="primary"></span>');
    const anim = await page.locator('#sp2').evaluate((el) => {
      const ring = el.querySelector('div') as HTMLElement;
      return ring ? getComputedStyle(ring).animationName : 'none';
    });
    expect(anim).not.toBe('none');
    expect(anim).not.toBe('');
  });
});
