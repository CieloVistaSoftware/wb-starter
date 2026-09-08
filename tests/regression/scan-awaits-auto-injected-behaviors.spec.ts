import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#961 / #962): `await WB.scan()` lied.
 *
 * wb.js's scan() collects every injection it starts into `promises` and ends
 * with `await Promise.all(promises)` -- EXCEPT the auto-inject loop, which
 * called `WB.inject(htmlEl, behavior)` and threw the promise away. Auto-inject
 * is the DEFAULT path for a semantic-first page: every plain <button>, <nav>,
 * <article>, <table>... goes through exactly that loop, so on a typical page
 * the injections scan() did NOT await were the majority of them.
 *
 * Consequences, all of them measured elsewhere before the cause was known:
 *
 *   - `WB.ready` (#962) is the boot scan's promise, so it inherited the lie:
 *     awaiting it does not mean the page is built.
 *   - tests/regression/button-click-event.spec.ts carries a #979 comment
 *     recording the symptom without the cause: "right after `await WB.scan()`
 *     the button still had class='' and no x-ready".
 *   - with nothing truthful to await, 496 `waitForTimeout` calls in tests/
 *     guess at a DURATION instead, and a guess is wrong whenever the machine
 *     is busy -- which is #961's ~20 tests changing state between identical
 *     runs.
 *
 * The snapshot below is taken INSIDE the page, in the `.then()` of scan()'s own
 * promise, so it records the state at the instant scan() resolved. Doing it
 * from Playwright instead would add a round trip and let the injection finish
 * during it -- a vacuous pass (see docs/standards/A-GATE-MUST-BE-SEEN-TO-FAIL.md).
 *
 * SEEN TO FAIL: against the un-fixed runtime this reports
 * `{ cls: '', ready: false }`.
 */
test.describe('WB.scan() awaits the behaviors it starts (#961/#962)', () => {
  test('a plain <button> is fully injected by the time scan() resolves', async ({ page }) => {
    await page.goto('/');
    await page.setContent(`
      <button id="autoBtn">Auto</button>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__snapshot = null;
        WB.init({ autoInject: true })
          .then(() => WB.scan(document.body))
          .then(() => {
            const b = document.getElementById('autoBtn');
            // Recorded synchronously at the moment scan()'s promise resolved.
            window.__snapshot = {
              cls: b.className,
              ready: b.hasAttribute('x-ready')
            };
          });
      </script>
    `);

    await page.waitForFunction(() => (window as any).__snapshot !== null, { timeout: 30000 });
    const snapshot = await page.evaluate(() => (window as any).__snapshot);

    expect(snapshot.cls, 'scan() resolved before the auto-injected button behavior ran').toContain('x-button');
    expect(snapshot.ready, 'scan() resolved before the button was stamped x-ready').toBe(true);
  });

  test('WB.pendingCount reaches zero and WB.whenIdle() resolves after a scan', async ({ page }) => {
    await page.goto('/');
    await page.setContent(`
      <button id="idleBtn">Idle</button>
      <article id="idleCard"><header><h3>t</h3></header><p>b</p></article>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__idle = null;
        WB.init({ autoInject: true })
          .then(() => WB.scan(document.body))
          .then(() => WB.whenIdle({ timeout: 15000 }))
          .then(() => {
            window.__idle = {
              pending: WB.pendingCount,
              btn: document.getElementById('idleBtn').className,
              card: document.getElementById('idleCard').className,
              cardReady: document.getElementById('idleCard').hasAttribute('x-ready'),
              cardError: document.getElementById('idleCard').getAttribute('x-error'),
              knowsArticle: typeof WB.behaviors.article
            };
          })
          .catch(e => { window.__idle = { error: String(e) }; });
      </script>
    `);

    await page.waitForFunction(() => (window as any).__idle !== null, { timeout: 30000 });
    const idle = await page.evaluate(() => (window as any).__idle);

    expect(idle.error, 'WB.whenIdle() must exist and resolve').toBeUndefined();
    expect(idle.pending, 'WB.pendingCount must be 0 once whenIdle() resolves').toBe(0);
    expect(idle.btn).toContain('x-button');
    // nativeMap routes <article> to the ARTICLE behavior, which adds
    // `x-article` (article.js:50) — not to card. Checked in tag-map.js rather
    // than assumed: the first version of this line asserted `x-card` and was
    // simply wrong about the mapping.
    // NOT asserted here: the <article> in the fixture ends with NO class at
    // all, while being stamped x-ready with no x-error, deterministically 3/3.
    // That is a real defect but a DIFFERENT one — this test is about scan()
    // awaiting what it starts and whenIdle() reporting it. Filed as #1080 so
    // one failing subject cannot be mistaken for the other.
    expect(idle.cardReady, 'the article was never even reached by an injection').toBe(true);
  });
});
