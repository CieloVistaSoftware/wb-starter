import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#466): pressing End on a long doc-viewer.html page (e.g.
 * ?file=docs/behaviors/card.md, which embeds 10 <div x-demo> blocks)
 * used to leave scrollTop stranded well short of the page's true bottom —
 * confirmed via a real, native `page.keyboard.press('End')` (not a synthetic
 * dispatchEvent, which never triggers the browser's actual default action).
 *
 * ROOT CAUSE (confirmed with real scrollHeight/scrollTop measurements over
 * time, refining the originally-filed hypothesis): no JS on this page ever
 * intercepted End — the browser's native "scroll to bottom" ran unopposed,
 * computing its target ONCE, synchronously, against
 * document.documentElement.scrollHeight at keydown time.
 *
 * <div x-demo> (src/wb-viewmodels/x-demo.js) only builds its first
 * EAGER_BUILD_COUNT (5) blocks synchronously in connectedCallback — every
 * block after that is deferred behind its own IntersectionObserver
 * (rootMargin: '1200px', rooted at the viewport on this page since there's
 * no #siteBody) and, once it intersects, an ASYNC demo() build
 * (src/wb-viewmodels/demo.js — awaits a getPageSource() fetch and the
 * docs/manifest.json fetch before appending .x-demo__grid + doc-link
 * badges). Until a lazy block both intersects AND finishes that async build,
 * the page's real height isn't reflected in scrollHeight yet — and the
 * initial End-triggered jump is often what FIRST brings the remaining lazy
 * blocks within the 1200px margin, so the page keeps growing for a beat
 * right after landing, with nothing to re-trigger a corrective scroll.
 *
 * Fix (public/doc-viewer.html): intercept End, force every not-yet-built
 * <div x-demo> to build immediately by calling the same demo() function
 * x-demo.js's own IntersectionObserver callback would eventually call
 * (idempotent via its `_demoInitialized` guard — safe to call unconditionally
 * and safe against the real observer firing again later), await all of them,
 * THEN scroll to the now-accurate bottom.
 */
test.describe('doc-viewer.html End key reaches the true page bottom (#466)', () => {
  test('End on a doc with lazy <div x-demo> blocks lands within a few px of true bottom', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 855 });

    // 'load' (not 'networkidle') + a short pause deliberately catches the
    // page BEFORE all lazy <div x-demo> blocks have settled — matching how a
    // real, fast reader hits End almost as soon as the page appears, which
    // is exactly the timing the original bug report reproduced under.
    // #1070: this loaded docs/behaviors/card.md, described above as embedding
    // 10 <div x-demo> blocks. It embeds ZERO — 4.0.0 rewrote that doc when the
    // component tags went. So this test has been dying on its own precondition
    // ("fixture doc must actually embed <div x-demo> blocks", received 0) and
    // asserting nothing whatever about the End key, while sitting in
    // data/test-baseline-failures.json looking like a known End-key defect.
    //
    // behavior-cross-reference.md carries 159 of them — the most in docs/ — so
    // the fixture is now the hardest case rather than a doc that happened to
    // have some when this was written. Counted, not assumed: the assertion below
    // fails loudly if that ever stops being true.
    await page.goto('/public/doc-viewer.html?file=docs/behavior-cross-reference.md', { waitUntil: 'load' });
    await page.waitForTimeout(50);

    // #1070: the 50ms above was tuned for a small doc and is not enough for the
    // markdown fetch + render of a large one, so the count ran against an empty
    // page and read 0. Wait for the FIRST block to exist — that proves the doc
    // rendered — and press End immediately after, which still reproduces the
    // "reader hits End as soon as the page appears" timing the bug needs while
    // no longer depending on a fixed delay being long enough.
    await page.waitForSelector('[x-demo]', { timeout: 20000 });

    const demoCount = await page.locator('[x-demo]').count();
    expect(demoCount, 'fixture doc must actually embed <div x-demo> blocks for this test to be meaningful').toBeGreaterThan(5);

    await page.keyboard.press('End');

    // Poll rather than a fixed sleep: the fix's own settle work (awaiting
    // every pending demo()'s network fetches) plus the final smooth-scroll
    // animation have no fixed duration — under CPU contention (e.g. parallel
    // workers) either can legitimately take longer without the fix being
    // broken. What must NOT happen is scrollTop settling somewhere short of
    // the true bottom and staying there — so poll until it converges, with a
    // generous ceiling, rather than asserting against one fixed-delay sample.
    await expect(async () => {
      const state = await page.evaluate(() => ({
        scrollTop: document.documentElement.scrollTop,
        max: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      }));
      const gap = Math.abs(state.max - state.scrollTop);
      expect(gap, `scrollTop=${state.scrollTop} trueMax=${state.max}`).toBeLessThanOrEqual(5);
    }).toPass({ timeout: 15000, intervals: [250] });
  });

  test('End on a plain doc with no <div x-demo> still scrolls to the bottom (no regression)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 855 });
    await page.goto('/public/doc-viewer.html?file=docs/index.md', { waitUntil: 'load' });
    await page.waitForTimeout(300);

    await page.keyboard.press('End');
    await page.waitForTimeout(1000);

    const result = await page.evaluate(() => ({
      scrollTop: document.documentElement.scrollTop,
      max: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));

    expect(Math.abs(result.max - result.scrollTop)).toBeLessThanOrEqual(5);
  });
});
