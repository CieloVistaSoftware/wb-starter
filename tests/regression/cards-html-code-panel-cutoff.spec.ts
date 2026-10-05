import { test, expect } from '../fixtures/offline';
import { demoWidthsSettled } from '../base';

/**
 * #586: demos/site/cards.html's <div x-demo> code panels didn't show all the
 * code -- confirmed live in the "Card Gallery" section's x-card,
 * x-cardexpandable, and x-cardvideo single-item demos (columns="1", one
 * child each), which should be governed by demo.js's #486/#563 single-item
 * shrink-to-fit width measurement (measure(), in demo()).
 *
 * Root cause (two layered races, both in demo()):
 *  1. The measurement block used to run IMMEDIATELY after the grid was
 *     built -- BEFORE `<pre class="[x-demo]__code">` existed (pre creation
 *     was gated behind `await loadDocsManifest()`, further down). With no
 *     `<pre>` in the DOM, codeWidth read a stable `0` and could lock in
 *     alongside controlWidth before the real code panel ever existed.
 *  2. Even after moving the block below `<pre>`'s creation, `<pre>`
 *     EXISTING is not the same as `<pre>` being STYLED --
 *     `await WB.scan(pre, {eager:true})` is itself async (applies the real
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
test.describe('demos/site/cards.html: single-item [x-demo] code panels are never clipped', () => {
  test('cardexpandable and cardvideo code panels show all their code, no horizontal overflow', async ({ page }) => {
    // The budget is the sum of this test's own named waits on the heaviest
    // page in the repo (34 demos / 265 articles): 20s for
    // __WB_DEMO_INITIALIZED__, 20s to build the five sections, and
    // demoWidthsSettled's idle + settle (15s each), plus headroom. #984: it
    // was 90s, to cover a flat 6s sleep sized to outlast demo.js's
    // measurement; the wait is now on the class demo.js swaps when it settles.
    test.setTimeout(20_000 + 20_000 + 2 * 15_000 + 10_000);

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).__WB_DEMO_INITIALIZED__ === true, { timeout: 20000 });

    // The bug lives in the FIRST section on the page ("Card Gallery") --
    // its x-cardexpandable/x-cardvideo demos are among the eagerly-built
    // ones (EAGER_BUILD_COUNT=5) and reproduced on nearly every load without
    // any scrolling. The other sections are built explicitly (#984): scrolling
    // them into view relied on the lazy IntersectionObserver firing in time.
    const sectionIds = [
      'card-gallery',
      'cardexpandable-expandable-card',
      'cardexpandable-variants',
      'cardexpandable-toggles',
      'cardvideo-video-card',
    ];
    await page.evaluate(async (ids) => {
      const WB = (window as any).WB;
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section) await WB.scan(section, { eager: true });
      }
    }, sectionIds);
    // Until every demo has committed its width: the class demo.js swaps when
    // its measurement settles, not a sleep sized to its 5s worst case.
    await demoWidthsSettled(page);

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
      const { scrollWidth, clientWidth, snippet, atCap } = await panel.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        snippet: el.textContent?.slice(0, 40) ?? '',
        atCap: el.getBoundingClientRect().width >= window.innerWidth * 0.5 - 2,
      }));
      if (scrollWidth > pageMaxWidth) {
        // Content is unavoidably wider than the entire page -- horizontal
        // scroll is the documented, accepted behavior here, not a bug.
        continue;
      }
      if (atCap) {
        // The page width is no longer the ceiling: "all x-demo code must show
        // all the code up to 50% vw" (owner, 2026-08-07; demo-code-panel-
        // 50vw.spec.ts). Code wider than that sits at the cap and scrolls --
        // the card-gallery Pro pricing demo's features="..." line is 755px of
        // code that used to stretch the whole demo to 757px, and now stops at
        // 640px by design. Below the cap, a scroll is still the #586
        // locked-in-too-early bug and fails.
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
