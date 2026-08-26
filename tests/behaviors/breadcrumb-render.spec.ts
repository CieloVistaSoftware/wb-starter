/**
 * x-breadcrumb — renders trail from items (issue #132)
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
    c.id = 'crumb-test-area';
    c.style.cssText = 'padding:20px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('x-breadcrumb', () => {
  test('renders each items entry with the last marked current', async ({ page }) => {
    await setup(page, '<nav id="bc" x-breadcrumb items="Home,Products,Electronics,Smartphones"></nav>');
    const nav = page.locator('#bc');
    await expect(nav).toHaveClass(/x-breadcrumb/);
    await expect(nav).toContainText('Home');
    await expect(nav).toContainText('Smartphones');
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Smartphones');
    // 4 items → 3 separators
    await expect(nav.locator('.x-breadcrumb__separator')).toHaveCount(3);
  });
});
