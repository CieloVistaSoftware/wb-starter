import { test, expect } from '@playwright/test';

/**
 * #586: demos/site/cards.html's <div x-demo> code panels didn't show all the
 * code -- confirmed live in the "Card Gallery" section's x-card,
 * x-cardexpandable, and x-cardvideo single-item demos (columns="1", one
 * child each), which should be governed by demo.js's #486/#563 single-item
 * shrink-to-fit width measurement (measure(), in demo()).
 *
 * Root cause (two layered races, both in demo()):
 *  1. The measurement block used to run IMMEDIATELY after the grid was
 *     built -- BEFORE `<pre class="x-demo__code">` existed (pre creation
 *     was gated behind `await loadDocsManifest()`, further down). With no
 *     `<pre>` in the DOM, codeWidth read a stable `0` and could lock in
 *     alongside controlWidth before the real code panel ever existed.
 *  2. Even after moving the block below `<pre>`'s creation, `<pre>`
 *     EXISTING is not the same as `<pre>` being STYLED --
 *     `WB.scan(pre, {eager:true})` is itself async (applies the real
 *     `.x-pre` class/font/padding/highlighting on a later tick), so the
 *     first poll(s) could still read the bare, unstyled element's smaller
 *     width and lock in on that.
 * On a page this size (267 stacked <div x-demo> blocks, 5 built synchronously
 * and concurrently right at page load per EAGER_BUILD_COUNT), main-thread
 * contention made both races easy to lose, intermittently.
 *
 * Fix: the measurement block now AWAITS `scanWhenReady()` (the same promise
 * that resolves once `<pre>` is fully styled/highlighted) before its first
 * poll ever runs. See src/wb-viewmodels/demo.js.
 *
 * This test distinguishes a REAL regression (content that would have fit
 * within the page's own available width, but the box stayed narrower than
 * it needed to be -- a bug) from unavoidable horizontal scroll (a single
 * unwrapped line wider than the entire page can ever show -- accepted by
 * Standard §27's own "scrolling available for unavoidable long lines"
 * carve-out for x-demo code panels, not a bug to eliminate).
 */
test.describe('demos/site/cards.html: single-item x-demo code panels are never clipped', () => {
  test('cardexpandable and cardvideo code panels show all their code, no horizontal overflow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).__WB_DEMO_INITIALIZED__ === true, { timeout: 20000 });

    // The bug lives in the FIRST section on the page ("Card Gallery") --
    // its x-cardexpandable/x-cardvideo demos are among the eagerly-built
    // ones (EAGER_BUILD_COUNT=5) and reproduced on nearly every load without
    // any scrolling. Scroll each relevant section into view anyway (cheap,
    // and also exercises the lazy-build path for the same behaviors
    // further down the page) and give the width-measurement poll (up to 5s
    // per demo.js's own MAX_MS) time to fully settle.
    const sectionIds = [
      'card-gallery',
      'cardexpandable-expandable-card',
      'cardexpandable-variants',
      'cardexpandable-toggles',
      'cardvideo-video-card',
    ];
    for (const id of sectionIds) {
      const section = page.locator(`#${id}`);
      if (await section.count()) {
        await section.scrollIntoViewIfNeeded();
      }
    }
    // Let demo.js's poll-until-stable width measurement fully settle
    // (POLL_MS=200, up to MAX_MS=5000 per demo) for every demo just
    // scrolled into view.
    await page.waitForTimeout(6000);

    expect(pageErrors, 'no uncaught page errors while building the demos above').toEqual([]);

    // Upper bound on how wide ANY x-demo code panel could ever grow on this
    // page -- the `.demo-page` body wrapper's own available width. A code
    // panel whose content needs MORE than this can never avoid a horizontal
    // scrollbar no matter how the shrink-to-fit measurement behaves (the
    // page itself isn't wide enough) -- that's expected per Standard §27,
    // not the bug this test targets.
    const pageMaxWidth = await page.locator('body.demo-page').evaluate((el) => el.clientWidth);

    const codePanels = page.locator(
      sectionIds.map((id) => `#${id} .x-demo__code`).join(', ')
    );
    const count = await codePanels.count();
    expect(count, 'the targeted sections must actually have code panels to check').toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const panel = codePanels.nth(i);
      const { scrollWidth, clientWidth, snippet } = await panel.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        snippet: el.textContent?.slice(0, 40) ?? '',
      }));
      if (scrollWidth > pageMaxWidth) {
        // Content is unavoidably wider than the entire page -- horizontal
        // scroll is the documented, accepted behavior here, not a bug.
        continue;
      }
      expect(
        scrollWidth,
        `code panel "${snippet}..." could have fit within the page's own available width ` +
        `(${pageMaxWidth}px) but its box stayed narrower than its content ` +
        `(scrollWidth ${scrollWidth} vs clientWidth ${clientWidth}) -- the shrink-to-fit ` +
        `width measurement locked in too early`
      ).toBeLessThanOrEqual(clientWidth + 2);
    }
  });
});
