import { test, expect } from '@playwright/test';

/**
 * wb:ready fires once per element (#1126).
 *
 * markReady() is called from two runtimes (wb.js and wb-lazy.js). Its WeakSet
 * was idempotent, so WB.isReady() was always right, but the wb:ready dispatch
 * ran on every call. John, on the progressbar permutation view: "WHY TWO
 * EVENTS?" -- the panel logged wb:ready twice for one element, and because the
 * event bubbles every listening ancestor heard it twice as well.
 *
 * Two layers, and they are NOT equal:
 *   1. The contract, at the function: markReady called N times on one element
 *      dispatches exactly one event. THIS IS THE GUARD. Seen to fail with the
 *      #1126 check removed: 3 events for 3 calls.
 *   2. The runtime: real behaviors scanned, then scanned again, each element
 *      hears wb:ready exactly once -- and at least once, so a fix that stopped
 *      the event entirely cannot pass. This layer did NOT go red with the
 *      check removed: the test harness boots one runtime, so it never takes
 *      the wb.js + wb-lazy.js double path John saw. It protects against the
 *      event disappearing; it does not reproduce the duplicate.
 */

test.describe('wb:ready is a moment, and a moment happens once (#1126)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  });

  test('markReady called repeatedly on one element dispatches one event', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { markReady, isReady } = await import('/src/core/ready-signal.js');
      const el = document.createElement('div');
      document.body.appendChild(el);

      let onElement = 0;
      let onAncestor = 0;
      el.addEventListener('wb:ready', () => { onElement++; });
      const bubbled = (e: Event) => { if (e.target === el) onAncestor++; };
      document.addEventListener('wb:ready', bubbled);

      for (let i = 0; i < 3; i++) markReady(el);

      document.removeEventListener('wb:ready', bubbled);
      const ready = isReady(el);
      el.remove();
      return { onElement, onAncestor, ready };
    });

    expect(result.ready, 'markReady must still mark the element ready').toBe(true);
    expect(result.onElement, 'wb:ready events on the element for 3 markReady calls').toBe(1);
    expect(result.onAncestor, 'wb:ready events bubbled to document for 3 markReady calls').toBe(1);
  });

  test('scanned behaviors each hear wb:ready exactly once, even when scanned twice', async ({ page }) => {
    const rows = await page.evaluate(async () => {
      const counts = new Map<Element, number>();
      const listener = (e: Event) => {
        const t = e.target as Element;
        counts.set(t, (counts.get(t) || 0) + 1);
      };
      document.addEventListener('wb:ready', listener, true);

      const host = document.createElement('div');
      host.innerHTML =
        '<div id="r-progress" x-progress value="40"></div>' +
        '<div id="r-hero" x-cardhero title="Hero"></div>' +
        '<article id="r-article" title="Plain article">Body.</article>';
      document.body.appendChild(host);

      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await (window as any).WB.scan(host, { eager: true });
      await frames();
      await (window as any).WB.scan(host, { eager: true });
      await frames();

      document.removeEventListener('wb:ready', listener, true);
      const out = ['r-progress', 'r-hero', 'r-article'].map((id) => {
        const el = document.getElementById(id)!;
        return { id, count: counts.get(el) || 0 };
      });
      host.remove();
      return out;
    });

    const never = rows.filter((r) => r.count === 0).map((r) => r.id);
    expect(never, 'these elements never announced wb:ready, so the sweep proves nothing about them').toEqual([]);

    const twice = rows.filter((r) => r.count > 1).map((r) => `${r.id} heard wb:ready ${r.count}x`);
    expect(twice, 'one element, one wb:ready').toEqual([]);
  });
});
