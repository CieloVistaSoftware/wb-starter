import { test, expect } from '../fixtures/offline';

/**
 * #962: WB.settled() -- "everything under this root has called back".
 *
 * John: "There's no such thing as a good waitForTimeout", "I never see you use
 * callbacks ... requires no timing", and "we could use callbacks for more than
 * just wb.init". The runtime had no single finished signal: whenIdle() guessed
 * (nothing in flight for 50ms), and content added by innerHTML was built by a
 * MutationObserver on a later task, so a caller could not await it at all.
 *
 * Each check below runs in the SAME task the signal fires in: any wait between
 * the signal and the check would let the test pass on a guess.
 */
const HERO = '<section x-cardhero id="settled-hero" title="Settled" subtitle="by callback"></section>';

test.describe('WB.settled()', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?page=about');
    await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'about');
    await expect(page.locator('#main .page--about')).toBeAttached();
  });

  test('content added with innerHTML is built when settled() resolves', async ({ page }) => {
    const state = await page.evaluate(async (html) => {
      const WB = (window as any).WB;
      const main = document.getElementById('main')!;
      main.insertAdjacentHTML('afterbegin', html);
      await WB.settled();
      const el = document.getElementById('settled-hero')!;
      return { built: WB.isReady(el), pending: WB.pendingCount };
    }, HERO);
    expect(state.built, 'settled() resolved before content added by innerHTML was built').toBe(true);
    expect(state.pending).toBe(0);
  });

  test('the same signal as a callback and as an event', async ({ page }) => {
    const state = await page.evaluate(async (html) => {
      const WB = (window as any).WB;
      const main = document.getElementById('main')!;
      const byEvent = new Promise<boolean>((resolve) => {
        document.addEventListener('wb:settled', () => resolve(WB.isReady(document.getElementById('settled-hero'))), { once: true });
      });
      main.insertAdjacentHTML('afterbegin', html);
      const byCallback = new Promise<boolean>((resolve) => {
        WB.settled(() => resolve(WB.isReady(document.getElementById('settled-hero'))));
      });
      return { callback: await byCallback, event: await byEvent };
    }, HERO);
    expect(state.callback, 'the settled callback ran before the content was built').toBe(true);
    expect(state.event, 'wb:settled fired before the content was built').toBe(true);
  });

  test('whenIdle() is the same callback: no quiet window when nothing is pending', async ({ page }) => {
    // whenIdle() used to resolve only after nothing had been in flight for
    // 50ms -- a waitForTimeout inside the runtime. Proven without a clock:
    // when the page is settled, a callback-based signal resolves within a few
    // microtasks, before ANY timer can fire; a quiet window cannot.
    const resolvedInMicrotasks = await page.evaluate(async () => {
      const WB = (window as any).WB;
      await WB.settled();
      let done = false;
      WB.whenIdle().then(() => { done = true; });
      for (let i = 0; i < 10 && !done; i++) await new Promise<void>((r) => queueMicrotask(r));
      return done;
    });
    expect(resolvedInMicrotasks, 'whenIdle() waited on a timer while nothing was pending').toBe(true);
  });
});
