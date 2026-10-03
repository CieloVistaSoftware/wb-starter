import { test, expect } from '../fixtures/offline';

/**
 * #1246: WB.settled() timed out on "progress (awaiting viewport)" in Windows
 * CI, and the diagnostics showed no progress element left in the stage: the
 * pending unit belonged to an element the showcase had already replaced, and
 * Chromium there never delivered the IntersectionObserver's first report on it.
 *
 * A removed element can never be shown, so it is not work in flight. This
 * reproduces the Windows behaviour on any platform by silencing the observer
 * for one element, then removing that element: settled() must resolve on the
 * removal itself, not at its deadline.
 */
test('a lazy element removed before its first viewport report does not hold settled() open', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.IntersectionObserver;
    (window as any).IntersectionObserver = class extends Native {
      constructor(cb: IntersectionObserverCallback, opts?: IntersectionObserverInit) {
        // Entries for [data-io-silent] never arrive, as on Windows CI.
        super((entries, obs) => {
          const kept = entries.filter((e) => !(e.target as HTMLElement).hasAttribute?.('data-io-silent'));
          if (kept.length) cb(kept, obs);
        }, opts);
      }
    };
  });
  await page.goto('/?page=about');
  await page.waitForFunction(() => (window as any).WBSite?.currentPage === 'about');

  const result = await page.evaluate(async () => {
    // The lazy runtime is the one that counts "<behavior> (awaiting viewport)".
    const WB = (await import('/src/core/wb-lazy.js')).default;
    await WB.settled();
    const el = document.createElement('progress');
    el.id = 'silent-progress';
    el.setAttribute('data-io-silent', '');
    document.getElementById('main')!.append(el);
    WB.lazyInject(el, 'progress');
    const pendingBefore = String(WB.pendingBehaviors);
    el.remove();
    try {
      await WB.settled({ timeout: 3000 });
      return { pendingBefore, settled: true, error: '' };
    } catch (e) {
      return { pendingBefore, settled: false, error: String(e) };
    }
  });
  expect(result.pendingBefore, 'the silenced element was never awaiting its viewport report, so this proves nothing').toContain('awaiting viewport');
  expect(result.settled, result.error).toBe(true);
});
