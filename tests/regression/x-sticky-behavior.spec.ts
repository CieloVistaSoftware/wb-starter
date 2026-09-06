import { test, expect } from '@playwright/test';
import { elementReady, safeScrollIntoView } from '../base';

/**
 * src/wb-viewmodels/sticky.js (<div x-sticky>, distinct from the `sticky`
 * boolean attribute on x-header/x-footer/x-navbar) uses position:fixed
 * driven by a scroll listener, not CSS position:sticky.
 *
 * #948: these tests measure the stuck element relative to its CONTAINING
 * BLOCK, not the viewport. demo.css gives `.x-demo__grid` `contain: layout`
 * deliberately (#647), which makes each demo box the containing block for any
 * `position: fixed` example content -- that is what keeps a full-viewport demo
 * (x-stagelight's spotlight, a modal, a toast) painting inside its own box
 * instead of over the whole page. So on demos/site/layout.html a stuck
 * [x-sticky] correctly resolves against its grid, and its viewport-absolute
 * rect.top is offset by however far the page happens to be scrolled.
 *
 * Verified live before rewriting: with `contain: layout` in force the three
 * demos measure rect.top - grid.top of exactly 0, 60 and 0 (matching no-offset,
 * offset="60" and animated); setting `contain: none` on the grid moves the
 * first from -400.03 to exactly 0. No ancestor has a transform, filter,
 * perspective, will-change or container-type -- the grid is the only
 * containing-block creator.
 *
 * (An earlier version of this docstring blamed a `fadeIn` transform left
 * mid-animation on `.page` by a shared multi-agent browser session. That was a
 * misdiagnosis: `contain: layout` is present on every load, in any tab.)
 */

/**
 * #1031/#962: this used to sleep 800ms and call the page "settled".
 *
 * A sleep is a guess about DURATION, and it fails whenever the machine is
 * slower than the guess. Under the 4-worker gate this one lost: the page was
 * still laying out when scrollPastAndSettle() read the element's absolute top,
 * so it scrolled to a STALE coordinate, landed short of the element, and
 * `is-stuck` never arrived. All four failures reported
 * `Expected /is-stuck/ / Received "x-sticky"` — the behaviour was fine, the
 * page had simply never been scrolled past it.
 *
 * Waits for the thing being measured instead: `x-ready` is stamped on an
 * element once it has no injections left in flight (#970).
 */
async function ready(page) {
  await page.goto('/demos/site/layout.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[x-sticky]');
  // Deliberately NOT elementReady() here: #sticky-sticky sits below the fold,
  // and on the lazy runtime an element is not injected until it intersects — so
  // x-ready never arrives for an element nobody has scrolled to, and waiting for
  // it here fails every test in this file with a 15s timeout. Readiness is
  // established per element in scrollPastAndSettle(), at the point of use.
}

/**
 * Arm a one-shot listener for `event` on the located element BEFORE the action
 * that triggers it, and hand back an awaitable that settles when it fires.
 *
 * Law 18 — NO POLLING. `sticky.js` already announces itself:
 *
 *     element.dispatchEvent(new CustomEvent('wb:sticky:stuck', ...))
 *     element.dispatchEvent(new CustomEvent('wb:sticky:unstuck', ...))
 *
 * so the test awaits the announcement. An earlier version of this file replaced
 * its sleeps with `waitForFunction` on `window.scrollY`, which is not a fix: a
 * poll asks the same question on a timer until the answer changes, and it can
 * lag or miss the transition entirely. The sleep and the poll are the same
 * mistake at different resolutions.
 *
 * The listener is installed in its own awaited step, so it is provably in place
 * before the scroll happens — arming and triggering in one round trip races.
 *
 * The deadline is a DEADLINE, not a poll: nothing is re-checked, it just refuses
 * to hang silently if the announcement never comes.
 */
async function armEvent(page, locator, event, key, timeoutMs = 10000) {
  await locator.evaluate(
    (el, [name, slot, ms]) => {
      window[slot] = new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`${name} never fired within ${ms}ms`)),
          ms,
        );
        el.addEventListener(name, () => { clearTimeout(timer); resolve(true); }, { once: true });
      });
    },
    [event, key, timeoutMs],
  );
  return () => page.evaluate((slot) => window[slot], key);
}

/**
 * Scroll past `locator` and wait for the behaviour to SAY it stuck.
 *
 * The element is settled first (`x-ready`, #970 — a MutationObserver, also a
 * notification), so the coordinate read here is the real one and not one taken
 * mid-layout. That stale read is what made all four of these tests fail under
 * load: the page scrolled to a coordinate the element no longer occupied,
 * never went past it, and `is-stuck` never arrived.
 */
async function scrollPastAndSettle(page, locator, extra = 400) {
  // Bring it into view FIRST — the lazy runtime injects on intersection, so
  // x-ready cannot arrive for an element that has never been scrolled to.
  await safeScrollIntoView(locator);
  await elementReady(locator);
  const stuck = await armEvent(page, locator, 'wb:sticky:stuck', '__wbStuck');
  const absTop = await locator.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), absTop + extra);
  await stuck();
}

/**
 * Top of the element measured from its containing block (#948). `offset`
 * promises "N pixels reserved from the top of the sticky containing block";
 * on a demo page that block is the `.x-demo__grid`, not the viewport.
 */
async function topWithinContainingBlock(locator) {
  return locator.evaluate((el) => {
    const cb = el.closest('.x-demo__grid') || document.documentElement;
    return el.getBoundingClientRect().top - cb.getBoundingClientRect().top;
  });
}

/**
 * Scroll back to the top and wait for the behaviour to SAY it unstuck —
 * `wb:sticky:unstuck`, the counterpart announcement. Not a poll on scrollY:
 * reaching y=0 is not the same event as the behaviour releasing the element,
 * and asserting on the wrong one is how a test passes before the work is done.
 */
async function scrollToTopAndSettle(page, locator) {
  const unstuck = await armEvent(page, locator, 'wb:sticky:unstuck', '__wbUnstuck');
  await page.evaluate(() => window.scrollTo(0, 0));
  await unstuck();
}

test.describe('[x-sticky]', () => {
  test('sticks to the viewport top (position:fixed, top:0) once scrolled past', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(0); // no offset
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'fixed');
    const top = await topWithinContainingBlock(el);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
  });

  test('offset="60" reserves 60px from the top instead of 0', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(1); // offset="60"
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const top = await topWithinContainingBlock(el);
    // Still a real assertion: the no-offset demo measures 0 here, this one 60.
    expect(Math.abs(top - 60)).toBeLessThanOrEqual(1);
  });

  test('animated attribute applies a box-shadow transition once stuck', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(2); // animated
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);
    const transition = await el.evaluate((e) => e.style.transition);
    expect(transition).toContain('box-shadow');
  });

  test('scrolling back up unsticks and cleans up the placeholder', async ({ page }) => {
    await ready(page);
    const el = page.locator('#sticky-sticky [x-sticky]').nth(0);
    await scrollPastAndSettle(page, el);
    await expect(el).toHaveClass(/is-stuck/);

    await scrollToTopAndSettle(page, el);
    await expect(el).not.toHaveClass(/is-stuck/);
    await expect(el).toHaveCSS('position', 'static');
    await expect(page.locator('.sticky-placeholder')).toHaveCount(0);
  });

  // #1031 — the crash the error log caught, twice per suite run:
  //   Uncaught TypeError: Cannot read properties of null (reading 'insertBefore')
  //
  // createPlaceholder() runs from the SCROLL handler and assumed the host still
  // had a parent. Remove the element between the scroll event and the handler —
  // which a re-rendering page does routinely — and the whole handler throws, so
  // everything after it in that pass never runs.
  test('a host removed mid-scroll does not throw, and stops being tracked', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));

    await ready(page);
    const handle = await page.locator('#sticky-sticky [x-sticky]').nth(0).elementHandle();

    // Detach it, then scroll — the order the crash needs: the listener is still
    // installed, the element is gone, the next wheel/scroll re-enters the path.
    await page.evaluate((el) => el.remove(), handle);

    // Twice, because the original crash repeated on EVERY subsequent scroll
    // rather than only the first — one pass would not have caught it.
    //
    // The notification here is the browser's own `scroll` event. sticky.js
    // registered its handler at init, this one is registered now, and listeners
    // fire in registration order — so by the time this resolves, the behaviour's
    // handler has already run and any throw has already reached `pageerror`.
    // Nothing is polled and nothing is guessed.
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => {
        window.__wbScrolled = new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('scroll event never fired')), 10000);
          window.addEventListener('scroll', () => { clearTimeout(timer); resolve(true); }, { once: true });
        });
      });
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.evaluate(() => window.__wbScrolled);
    }

    expect(
      errors.filter((m) => /insertBefore|Cannot read properties of null/.test(m)),
      'removing a sticky host mid-scroll threw — the guard in createPlaceholder() is gone'
    ).toEqual([]);

    // And it must stop tracking: a listener still firing for a detached element
    // is why this repeated on every subsequent scroll rather than once.
    const orphans = await page.locator('.sticky-placeholder').count();
    expect(orphans, 'a placeholder was left behind for an element that no longer exists').toBe(0);
  });
});
