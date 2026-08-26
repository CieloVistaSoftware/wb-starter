import { test, expect } from '@playwright/test';
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

    for (let i = 0; i < count; i++) {
      const panel = codePanels.nth(i);
      const { scrollWidth, clientWidth } = await panel.evaluate(el => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }));
      expect(scrollWidth, `code panel ${i} must not overflow its own box`).toBeLessThanOrEqual(clientWidth + 2);
    }
  });
});
