import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * A <div x-demo events="..."> renders TWO code panels -- the HTML markup
 * sample plus a separate JS event-listener sample (demo.js's
 * `events`-attribute handling). #563 follow-up's single-item shrink-to-fit
 * fix (demo.js measure()/applyNaturalWidth()) only ever measured the FIRST
 * `.x-demo__code` via `element.querySelector(...)`, so a longer SECOND
 * panel's width was silently ignored -- confirmed live: cards.html's
 * x-cardproduct demos (HTML sample + `el.addEventListener(...)` JS
 * sample) still cut the JS panel off by 100+ px even though the HTML
 * panel fit. Fixed by measuring ALL `.x-demo__code` panels via
 * querySelectorAll and taking the max, in both the plain-element and
 * fluid-media measurement paths.
 *
 * Widest-one still holds, up to the 50vw cap -- see the loop below.
 */
test.describe('[x-demo] with multiple code panels (events attribute) sizes to the widest one', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('both code panels render without horizontal overflow', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1" events="wb:cardproduct:addtocart"><div x-cardproduct image="https://picsum.photos/seed/regtest/400/300" title="Test Product" description="A reasonably long description to widen the HTML sample line" price="$99" rating="4.5" reviews="100"></div></div>'
    );

    const codePanels = page.locator('.x-demo__code');
    const count = await codePanels.count();
    // At least 2: the HTML markup sample plus the events-attribute's JS
    // interaction sample -- the exact count isn't the point of this test
    // (x-cardproduct's own doc-link/review markup may add more), only
    // that NONE of however many panels overflow.
    expect(count).toBeGreaterThanOrEqual(2);

    // Width is committed once, when the measurement settles (#985).
    await expect(page.locator('[x-demo]').first()).toHaveClass(/x-demo--measured/, { timeout: 10000 });

    // "Show all the code up to 50% vw" (owner, 2026-08-07; the contract
    // demo-code-panel-50vw.spec.ts pins): a panel shows every line in full
    // unless that would take it past 50vw, where it sits at the cap and
    // scrolls (#390: x-demo code scrolls, never wraps). The JS sample's
    // `el.addEventListener(...)` line needs ~700px on a 1280px viewport, so a
    // flat "never overflows" was asking for a panel wider than the cap.
    const vw = await page.evaluate(() => window.innerWidth);
    for (let i = 0; i < count; i++) {
      const panel = codePanels.nth(i);
      const { scrollWidth, clientWidth, width } = await panel.evaluate(el => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        width: el.getBoundingClientRect().width,
      }));
      if (width >= vw * 0.5 - 2) continue; // at the cap: scrolling is the contract
      expect(scrollWidth, `code panel ${i} must not overflow its own box while below the 50vw cap`).toBeLessThanOrEqual(clientWidth + 2);
    }
    // Neither panel is starved: each is as wide as its code, or at the cap.
    for (let i = 0; i < count; i++) {
      const { scrollWidth, width } = await codePanels.nth(i).evaluate(el => ({
        scrollWidth: el.scrollWidth,
        width: el.getBoundingClientRect().width,
      }));
      expect(width, `code panel ${i} narrower than both its code and the cap`).toBeGreaterThanOrEqual(Math.min(scrollWidth, vw * 0.5) - 2);
    }
  });
});
