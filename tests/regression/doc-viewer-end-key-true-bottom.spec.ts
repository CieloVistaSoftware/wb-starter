import { test, expect } from '../fixtures/offline';

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

// How long End may legitimately take to land, from public/doc-viewer.html's
// own bounds: contentReady() waits up to 4s and the settle loop up to
// END_SCROLL_MAX_WAIT_MS (8s), plus 3s for the final scroll. Nightly #21
// (#1950) waited only 10s: its trace shows the page's main thread busy for
// the whole window on a loaded Windows runner (the evaluate sent 120ms after
// End never returned), so the poll's only reading was the pre-scroll 498px.
// The 5px landing tolerance is unchanged.
const LANDS_WITHIN_MS = 4000 + 8000 + 3000;

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

    // #1070: a fixed 50ms sleep here was tuned for a small doc and is not enough for the
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
    // The doc has rendered once the page is taller than the window (#1516: not 300ms).
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight), { timeout: 20000 }).toBe(true);

    await page.keyboard.press('End');
    // Polled, not 1000ms: the gap to the true bottom closes as the scroll lands.
    await expect.poll(() => page.evaluate(() => {
      const el = document.documentElement;
      return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop);
    }), { timeout: LANDS_WITHIN_MS }).toBeLessThanOrEqual(5);
  });

  // CI on #1838 (Windows): End landed on scrollTop 168731, then the page grew
  // another 852px AFTER the handler's last check, and the reader sat 852px short
  // for the rest of the 15s poll. The handler stopped tracking once the height
  // had been still for END_SCROLL_QUIET_MS (200ms); a slow runner can leave a
  // longer gap than that between one bit of growth and the next. Reproduced
  // here by growing the page once the landing is done.
  test('End keeps the reader on the bottom when the page grows after landing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 855 });
    await page.goto('/public/doc-viewer.html?file=docs/index.md', { waitUntil: 'load' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight), { timeout: 20000 }).toBe(true);

    const gap = () => page.evaluate(() => {
      const el = document.documentElement;
      return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop);
    });
    await page.keyboard.press('End');
    await expect.poll(gap, { timeout: LANDS_WITHIN_MS }).toBeLessThanOrEqual(5);
    // The settle loop has finished and the page is following the bottom
    // (html[data-end-scroll="following"]). Grow it the way CI saw it grow:
    // content arriving under the reader, with no input.
    await expect(page.locator('html')).toHaveAttribute('data-end-scroll', 'following', { timeout: LANDS_WITHIN_MS });
    await page.evaluate(() => {
      const late = document.createElement('div');
      late.style.height = '852px';
      document.getElementById('content')!.append(late);
    });
    await expect.poll(gap, { timeout: LANDS_WITHIN_MS, message: 'End still lands on the true bottom after late growth' }).toBeLessThanOrEqual(5);
  });

  test('a reader who scrolls up after End is not pulled back down by later growth', async ({ page }) => {
    // CI on #1840 (Windows): a wheel right after landing was undone -- the
    // settle loop was still running and re-targeted the bottom. Reader input
    // now ends the whole End handling, not just the follow window.
    await page.setViewportSize({ width: 1280, height: 855 });
    await page.goto('/public/doc-viewer.html?file=docs/index.md', { waitUntil: 'load' });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight > document.documentElement.clientHeight), { timeout: 20000 }).toBe(true);

    await page.keyboard.press('End');
    await expect.poll(() => page.evaluate(() => {
      const el = document.documentElement;
      return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop);
    }), { timeout: LANDS_WITHIN_MS }).toBeLessThanOrEqual(5);
    // Once End has landed and is following, the reader scrolls up with a key
    // of their own. (A wheel would scroll whatever box is under the pointer.)
    await expect(page.locator('html')).toHaveAttribute('data-end-scroll', 'following', { timeout: LANDS_WITHIN_MS });
    await page.keyboard.press('PageUp');
    await expect.poll(() => page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollHeight - el.clientHeight - el.scrollTop;
    }), { timeout: 5000 }).toBeGreaterThan(300);
    // PageUp scrolls smoothly; read the position once it has come to rest.
    const settled = () => page.evaluate(() => new Promise<number>((ok) => {
      let last = -1;
      const tick = () => {
        const now = document.documentElement.scrollTop;
        if (now === last) ok(now); else { last = now; requestAnimationFrame(tick); }
      };
      requestAnimationFrame(tick);
    }));
    await expect.poll(async () => (await settled()) === (await settled()), { timeout: 5000 }).toBe(true);
    const before = await settled();
    await page.evaluate(() => {
      const late = document.createElement('div');
      late.style.height = '852px';
      document.getElementById('content')!.append(late);
    });
    // Give a follower every chance to (wrongly) move the reader.
    await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(null)))));
    expect(await settled(), 'the reader stays where they scrolled to').toBe(before);
  });

  test('a key pressed while End is still settling hands control back to the reader', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 855 });
    await page.goto('/public/doc-viewer.html?file=docs/behavior-cross-reference.md', { waitUntil: 'load' });
    await page.waitForSelector('[x-demo]', { timeout: 20000 });
    // End starts building the 159 demos and settling; the reader changes their
    // mind before it lands. Nothing may drag them to the bottom afterwards.
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    const top = await page.evaluate(() => document.documentElement.scrollTop);
    // The settle loop ends on its own within END_SCROLL_MAX_WAIT_MS; wait for
    // the page to stop growing, then check the reader was left where they went.
    await expect.poll(async () => {
      const h1 = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok(null)))));
      const h2 = await page.evaluate(() => document.documentElement.scrollHeight);
      return h1 === h2;
    }, { timeout: 20000 }).toBe(true);
    await expect(page.locator('html')).not.toHaveAttribute('data-end-scroll', 'following');
    const after = await page.evaluate(() => {
      const el = document.documentElement;
      return { scrollTop: el.scrollTop, max: el.scrollHeight - el.clientHeight };
    });
    expect(after.max - after.scrollTop, `End pulled the reader back down after Home (scrollTop ${after.scrollTop} of ${after.max}, was ${top})`).toBeGreaterThan(5000);
  });
});
