/**
 * wb-progress — value renders a proportional fill (issue #127)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'progress-test-area';
    c.style.cssText = 'padding:20px; width:400px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('wb-progress — fill from value', () => {
  for (const v of [25, 50, 100]) {
    test(`value="${v}" fills ~${v}%`, async ({ page }) => {
      await setup(page, `<wb-progress id="p${v}" value="${v}"></wb-progress>`);
      const host = page.locator(`#p${v}`);
      await expect(host).toBeVisible();
      const bar = host.locator('.wb-progress__bar');
      await expect(bar).toHaveCount(1);
      const ratio = await host.evaluate((el) => {
        const b = el.querySelector('.wb-progress__bar') as HTMLElement;
        return b.getBoundingClientRect().width / el.getBoundingClientRect().width;
      });
      expect(ratio).toBeGreaterThan(v / 100 - 0.08);
      expect(ratio).toBeLessThan(v / 100 + 0.08);
    });
  }

  test('striped adds striped modifier', async ({ page }) => {
    await setup(page, '<wb-progress id="ps" value="75" striped></wb-progress>');
    await expect(page.locator('#ps .wb-progress__bar')).toHaveClass(/wb-progress__bar--striped/);
  });
});
