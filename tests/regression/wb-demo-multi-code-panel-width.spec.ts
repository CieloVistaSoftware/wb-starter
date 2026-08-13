import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * A <wb-demo events="..."> renders TWO code panels -- the HTML markup
 * sample plus a separate JS event-listener sample (demo.js's
 * `events`-attribute handling). #563 follow-up's single-item shrink-to-fit
 * fix (demo.js measure()/applyNaturalWidth()) only ever measured the FIRST
 * `.wb-demo__code` via `element.querySelector(...)`, so a longer SECOND
 * panel's width was silently ignored -- confirmed live: cards.html's
 * wb-cardproduct demos (HTML sample + `el.addEventListener(...)` JS
 * sample) still cut the JS panel off by 100+ px even though the HTML
 * panel fit. Fixed by measuring ALL `.wb-demo__code` panels via
 * querySelectorAll and taking the max, in both the plain-element and
 * fluid-media measurement paths.
 */
test.describe('wb-demo with multiple code panels (events attribute) sizes to the widest one', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('both code panels render without horizontal overflow', async ({ page }) => {
    await setupTestContainer(
      page,
      '<wb-demo columns="1" events="wb:cardproduct:addtocart"><wb-cardproduct image="https://picsum.photos/seed/regtest/400/300" title="Test Product" description="A reasonably long description to widen the HTML sample line" price="$99" rating="4.5" reviews="100"></wb-cardproduct></wb-demo>'
    );

    const codePanels = page.locator('.wb-demo__code');
    const count = await codePanels.count();
    // At least 2: the HTML markup sample plus the events-attribute's JS
    // interaction sample -- the exact count isn't the point of this test
    // (wb-cardproduct's own doc-link/review markup may add more), only
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
