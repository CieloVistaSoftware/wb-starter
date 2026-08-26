import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * John, live report: "Expandable cards still do not work showing more or
 * less when clicked." The click handler (card.js's cardexpandable() toggle)
 * was never actually broken -- confirmed live: it correctly flips
 * `.x-card__expandable-content`'s max-height between the collapsed value
 * and 1000px on every click. The bug is that cards.html's demo instance had
 * no `size` attribute, defaulting to `x-card--auto` ("no constraints,
 * fills container") -- combined with #563's demo-width fix (x-demo now
 * grows to fit a long code sample's full unwrapped line), this specific
 * demo's card grew wide enough (~700px, confirmed live) that its content
 * paragraph wrapped to fewer lines than the 100px collapsed max-height
 * could ever clip -- scrollHeight (95px) came out SMALLER than the
 * collapsed max-height (100px), so toggling between collapsed/expanded
 * produced literally zero visible change regardless of whether the click
 * handler ran correctly.
 *
 * Fix: demos/site/cards.html's expandable-card demo now sets `size="sm"`
 * (max-width: 300px) so its content reliably wraps past the collapsed
 * threshold regardless of any code-panel width. This test locks in BOTH
 * halves: the collapsed state must actually clip content, AND toggling
 * must produce a real height increase.
 */
test.describe('[x-cardexpandable] actually shows more/less content on click', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('collapsed state clips content shorter than its natural height', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><div x-cardexpandable size="sm" title="FAQ" subtitle="Click to reveal" content="The card system uses a behavior-based architecture. Each variant is an independent component that composes the shared card structure and CSS — there is no base class to inherit from."></div></div>'
    );

    const content = page.locator('.x-card__expandable-content');
    const { scrollHeight, clientHeight } = await content.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    // The whole point of "collapsed" is that there's more content than fits --
    // if scrollHeight <= clientHeight, there's nothing to reveal on expand.
    expect(scrollHeight).toBeGreaterThan(clientHeight);
  });

  test('clicking the expand button visibly grows the content area', async ({ page }) => {
    await setupTestContainer(
      page,
      '<div x-demo columns="1"><div x-cardexpandable size="sm" title="FAQ" subtitle="Click to reveal" content="The card system uses a behavior-based architecture. Each variant is an independent component that composes the shared card structure and CSS — there is no base class to inherit from."></div></div>'
    );

    const content = page.locator('.x-card__expandable-content');
    const btn = page.locator('.x-card__expand-btn');

    const collapsedHeight = await content.evaluate(el => el.getBoundingClientRect().height);
    await expect(btn).toHaveText(/Show More/);

    await btn.click();
    // max-height transitions over 0.3s (card.js) -- wait past the transition.
    await page.waitForTimeout(400);

    const expandedHeight = await content.evaluate(el => el.getBoundingClientRect().height);
    expect(expandedHeight).toBeGreaterThan(collapsedHeight);
    await expect(btn).toHaveText(/Show Less/);

    // Toggling back collapses it again -- the interaction is reversible.
    await btn.click();
    await page.waitForTimeout(400);
    const recollapsedHeight = await content.evaluate(el => el.getBoundingClientRect().height);
    expect(recollapsedHeight).toBeLessThan(expandedHeight);
    await expect(btn).toHaveText(/Show More/);
  });
});
