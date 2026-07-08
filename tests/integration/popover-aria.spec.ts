import { test, expect } from '@playwright/test';

/**
 * #209: a popover opening/closing was invisible to assistive tech — no role,
 * no state announcement, no programmatic link between trigger and content.
 * Fixed in overlay.js's popover(): the trigger gets a static aria-haspopup
 * (describes what activating it does), a live aria-expanded (open/closed
 * state), and aria-controls (links to the panel's id) whenever it's open;
 * the panel itself gets role="dialog" + aria-label (from title, falling
 * back to content). This is the shared popover behavior, so the fix covers
 * every popover project-wide.
 */
test('popover announces itself to assistive tech via ARIA (#209)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).WB, { timeout: 20000 });

  await page.evaluate(async () => {
    document.querySelectorAll('#aria-pop, body > div.wb-popover').forEach((e) => e.remove());
    const btn = document.createElement('button');
    btn.id = 'aria-pop';
    btn.setAttribute('x-popover', '');
    btn.setAttribute('popover-title', 'Info');
    btn.setAttribute('popover-content', 'Extra detail shown on click.');
    btn.textContent = 'Info';
    document.body.appendChild(btn);
    await (window as any).WB.scan(document.body);
  });

  const btn = page.locator('#aria-pop');
  await expect(btn).toHaveClass(/wb-popover-trigger/, { timeout: 15000 });

  // Static hint present before any interaction; not yet expanded.
  await expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).not.toHaveAttribute('aria-controls');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  const panelId = await btn.getAttribute('aria-controls');
  expect(panelId).toBeTruthy();

  const panel = page.locator(`#${panelId}`);
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('aria-label', 'Info');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(btn).not.toHaveAttribute('aria-controls');
  await expect(panel).toHaveCount(0);
});
