import { test, expect } from '@playwright/test';

/**
 * Standard §15 (#252): a popover must not overflow its bounds. `x-popover` is
 * position:fixed, so it must stay within the viewport — `positionPopover` in
 * overlay.js clamps top/left (and caps width). This is the shared popover
 * behavior, so the fix + this test cover every popover project-wide.
 *
 * Reproduces the exact defect deterministically: a trigger hard against the right
 * edge. Without clamping the centered popover spills past the right edge; with it,
 * the popover stays inside the viewport.
 */
test('popover clamps to the viewport when its trigger is at the edge (#252, §15)', async ({ page }) => {
  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).WB, { timeout: 20000 });

  // Inject a popover trigger hard against the right edge and upgrade it.
  await page.evaluate(async () => {
    document.querySelectorAll('#edge-pop, body > div.wb-popover').forEach((e) => e.remove());
    const btn = document.createElement('button');
    btn.id = 'edge-pop';
    btn.setAttribute('x-popover', '');
    btn.setAttribute('popover-title', 'Edge');
    btn.setAttribute('popover-content', 'This popover is triggered from a button hard against the right edge of the viewport.');
    btn.style.cssText = 'position:fixed; top:100px; right:2px; z-index:9999;';
    btn.textContent = 'Edge';
    document.body.appendChild(btn);
    await (window as any).WB.scan(document.body);
  });

  await page.locator('#edge-pop').click();

  const pop = page.locator('body > div.wb-popover');
  await expect(pop).toBeVisible({ timeout: 5000 });

  const box = await pop.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, vw: window.innerWidth, vh: window.innerHeight };
  });

  expect(box.left, `popover overflows left (left=${box.left})`).toBeGreaterThanOrEqual(-1);
  expect(box.top, `popover overflows top (top=${box.top})`).toBeGreaterThanOrEqual(-1);
  expect(box.right, `popover overflows right (right=${box.right}, vw=${box.vw})`).toBeLessThanOrEqual(box.vw + 1);
  expect(box.bottom, `popover overflows bottom (bottom=${box.bottom}, vh=${box.vh})`).toBeLessThanOrEqual(box.vh + 1);
});
