import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#962): on the lazy runtime, WB.whenIdle() resolved before an
 * on-screen element was built.
 *
 * wb-lazy.js does not inject an element when it is scanned. lazyInject() hands
 * it to an IntersectionObserver and returns; the observer's callback, one frame
 * or more later, is what calls WB.inject(). Only WB.inject() recorded work with
 * the injection tracker, so between the hand-off and that callback the element
 * was pending and the tracker said "nothing". WB.whenIdle() resolved into that
 * gap, and a test that waited properly still read an unbuilt element.
 *
 * Measured 2026-09-14 with a probe of tests/behaviors/badge.spec.ts' own steps:
 * right after `await WB.scan()` the <span x-badge> had class "", font-size 16px
 * and WB.pendingBehaviors === "nothing"; three seconds later it had
 * "x-badge x-badge--default" and 14px. Under load the callback slips further,
 * which is why the suite's badge/tooltip/avatar/grid specs fail only at the
 * gate (#961).
 *
 * The checks run INSIDE the page in one evaluate, so no Playwright round trip
 * can let the observer fire in between and pass vacuously
 * (docs/standards/A-GATE-MUST-BE-SEEN-TO-FAIL.md). `quiet: 0` removes the quiet
 * window's slack, so the result depends only on what the tracker counts.
 */

const HARNESS = '/demos/test-harness.html';

async function ready(page) {
  await page.goto(HARNESS);
  await page.waitForFunction(() => typeof (window as any).WB?.whenIdle === 'function', undefined, { timeout: 15000 });
  await page.evaluate(() => (window as any).WB.whenIdle({ timeout: 15000 }));
}

test.describe('the lazy runtime counts an element it has deferred (#962)', () => {
  test('an on-screen element is pending until the observer decides, and built when whenIdle resolves', async ({ page }) => {
    await ready(page);
    const seen = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const host = document.createElement('div');
      host.innerHTML = '<span x-badge id="lazy-idle-badge">Font</span>';
      document.body.appendChild(host);
      await WB.scan();
      const pendingAfterScan = WB.pendingBehaviors;
      await WB.whenIdle({ timeout: 10000, quiet: 0 });
      const el = document.getElementById('lazy-idle-badge')!;
      return { pendingAfterScan, className: el.className, fontSize: getComputedStyle(el).fontSize };
    });
    expect(seen.pendingAfterScan, 'right after scan() the deferred badge must be counted, not "nothing"').toContain('badge');
    expect(seen.className, 'whenIdle() resolved before the badge was built').toContain('x-badge');
    expect(seen.fontSize, 'badge.css had not applied when whenIdle() resolved').toBe('14px');
  });

  test('an element far below the fold does not hold idle forever, and is built once scrolled to', async ({ page }) => {
    await ready(page);
    const below = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const host = document.createElement('div');
      host.style.marginTop = '6000px';
      host.innerHTML = '<span x-badge id="lazy-idle-far">Far</span>';
      document.body.appendChild(host);
      await WB.scan();
      await WB.whenIdle({ timeout: 5000, quiet: 0 });
      const el = document.getElementById('lazy-idle-far')!;
      return { className: el.className, pending: WB.pendingBehaviors };
    });
    expect(below.pending, 'a deferred element must stop counting once the observer says it is off screen').toBe('nothing');
    expect(below.className, 'below the fold is deferred by design, not injected').not.toContain('x-badge');

    const after = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const el = document.getElementById('lazy-idle-far')!;
      // A scroll is a user action the runtime cannot predict, so the wait is on
      // this element's own notification: both runtimes stamp x-ready when a
      // behavior finishes. A MutationObserver hears it; nothing is timed.
      const built = new Promise<void>((resolve, reject) => {
        if (el.hasAttribute('x-ready')) return resolve();
        const mo = new MutationObserver(() => { if (el.hasAttribute('x-ready')) { mo.disconnect(); resolve(); } });
        mo.observe(el, { attributes: true, attributeFilter: ['x-ready'] });
        setTimeout(() => { mo.disconnect(); reject(new Error('x-ready never arrived after scrolling into view')); }, 10000);
      });
      el.scrollIntoView();
      await built;
      await WB.whenIdle({ timeout: 10000, quiet: 0 });
      return el.className;
    });
    expect(after, 'scrolled into view and awaited, the element must be built').toContain('x-badge');
  });

  test('WB.disconnect() before the observer answers releases the count instead of holding idle', async ({ page }) => {
    await ready(page);
    const seen = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const host = document.createElement('div');
      host.innerHTML = '<span x-badge id="lazy-idle-disconnect">Gone</span>';
      document.body.appendChild(host);
      await WB.scan();
      const pendingAfterScan = WB.pendingBehaviors;
      // Same task as scan(), so the observer has had no chance to answer.
      WB.disconnect();
      const pendingAfterDisconnect = WB.pendingBehaviors;
      const started = performance.now();
      await WB.whenIdle({ timeout: 5000, quiet: 0 });
      return { pendingAfterScan, pendingAfterDisconnect, waitedMs: performance.now() - started };
    });
    expect(seen.pendingAfterScan, 'the setup must reach the gap this test is about').toContain('badge');
    expect(seen.pendingAfterDisconnect, 'no observer is left to end the record, so disconnect() must').toBe('nothing');
    expect(seen.waitedMs, 'whenIdle() waited out its timeout on a record nothing could end').toBeLessThan(5000);
  });
});
