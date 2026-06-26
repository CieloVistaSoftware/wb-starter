/**
 * Behaviors page — Effects section actions (issue #138).
 * Every entrance/attention effect must (a) inject when scanned and
 * (b) animate when clicked. Particle effects (confetti/rainbow/etc.) must
 * inject without error. Relative-time must render a formatted string.
 */
import { test, expect, Page, Locator } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForSelector('.behavior-card, .demo-area, [x-bounce]', { timeout: 20000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}
async function reveal(loc: Locator) {
  try { await loc.first().scrollIntoViewIfNeeded({ timeout: 4000 }); } catch { /* zero-box ok */ }
  await loc.page().waitForTimeout(200);
}

// clickAnim-based effects: inject a wb-<name> class + el.wbAnim, set style.animation on click
const ANIM = [
  { sel: '[x-slidein][data-direction="left"]', label: 'slidein-left' },
  { sel: '[x-slidein][data-direction="right"]', label: 'slidein-right' },
  { sel: '[x-slidein][data-direction="up"]', label: 'slidein-up' },
  { sel: '[x-zoomin]', label: 'zoomin' },
  { sel: '[x-wobble]', label: 'wobble' },
  { sel: '[x-tada]', label: 'tada' },
  { sel: '[x-jello]', label: 'jello' },
  { sel: '[x-heartbeat]', label: 'heartbeat' },
  { sel: '[x-flip]', label: 'flip' },
  { sel: '[x-flash]', label: 'flash' },
  { sel: '[x-bounce]', label: 'bounce' },
  { sel: '[x-shake]', label: 'shake' },
  { sel: '[x-pulse]', label: 'pulse' },
  { sel: '[x-fadein]', label: 'fadein' },
];

test.describe('Behaviors page — Effects', () => {
  for (const e of ANIM) {
    test(`${e.label} injects and animates on click`, async ({ page }) => {
      await loadPage(page);
      const btn = page.locator(e.sel).first();
      expect(await btn.count(), `${e.sel} present on page`).toBeGreaterThan(0);
      await reveal(btn);
      // behavior injected: clickAnim set el.wbAnim and added a wb-* class
      const injected = await btn.evaluate((el) => !!(el as any).wbAnim);
      expect(injected, `${e.label} behavior injected (el.wbAnim)`).toBe(true);
      await btn.click();
      const anim = await btn.evaluate((el) => getComputedStyle(el).animationName);
      expect(anim, `${e.label} animates on click`).not.toBe('none');
    });
  }

  test('particle effects (confetti/rainbow/glow/sparkle/snow/fireworks) inject without error', async ({ page }) => {
    await loadPage(page);
    for (const sel of ['[x-confetti]', '[x-rainbow]', '[x-glow]', '[x-sparkle]', '[x-snow]', '[x-fireworks]']) {
      const el = page.locator(sel).first();
      if (await el.count() === 0) continue;
      await reveal(el);
      await expect(el, `${sel} not errored`).not.toHaveAttribute('x-error', 'true');
      await el.click(); // must not throw
    }
    await page.waitForTimeout(150);
  });

  test('relative-time renders a formatted string', async ({ page }) => {
    await loadPage(page);
    const rt = page.locator('[x-relativetime]').first();
    if (await rt.count() === 0) test.skip();
    await reveal(rt);
    await expect(rt).not.toHaveText('');
  });

  test('no Effects behavior throws (no [x-error])', async ({ page }) => {
    await loadPage(page);
    const errs = await page.locator('[x-error="true"]').evaluateAll((els) => els.map((e) => e.tagName.toLowerCase()));
    expect(errs, 'x-error elements: ' + errs.join(', ')).toHaveLength(0);
  });
});
