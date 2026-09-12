import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * REGRESSION (#1078, under #961): a behavior stylesheet cancelled mid-load must
 * settle, or every later injection of that behavior hangs forever.
 *
 * THE DEFECT. `src/core/style-loader.js` cached one promise per CSS file,
 * resolved only by the `<link>`'s `load` or `error` event. A `<link>` removed
 * from the document before either fires gets neither — the browser cancels it —
 * so the cached promise stayed pending forever. `WB.inject()` awaits
 * `ensureBehaviorCss()` before running the behavior, so every later injection of
 * that behavior awaited the same corpse and the element was never built.
 * `page.setContent()` (document.open/write/close) removes every `<link>` at
 * once, which is exactly this, if it lands while the SPA's boot still has a
 * behavior stylesheet in flight.
 *
 * WHY THE EXISTING GUARD DOES NOT PROVE THE FIX.
 * `tests/regression/injection-survives-setcontent-mid-boot.spec.ts` runs the
 * triggering shape ONCE. Before the fix that shape hung in 1 run of 6
 * (`--repeat-each=6 --workers=6`, 2026-09-08, recorded on the issue). A single
 * run against the unfixed runtime therefore passed about 5 times in 6. The issue
 * body admits the same: "a single run against the un-fixed runtime is not
 * guaranteed to go red". A guard that is green on the broken code 83% of the
 * time does not verify the fix.
 *
 * THIS SPEC HAS TWO TESTS.
 *
 * 1. `repeated` — the unmodified triggering shape (goto '/', then setContent
 *    with no settle between), repeated N times inside ONE test. Every repetition
 *    starts from a fresh `page.goto('/')`, which is a real cross-document
 *    navigation: new realm, new module map, so style-loader's module-level
 *    `loaded` Map starts empty every time and repetitions cannot contaminate
 *    each other. The test fails on the first repetition that does not settle
 *    and names it.
 *
 *    N. With p = 1/6 per trial (the measured pre-fix rate), N independent
 *    trials all pass on the broken code with probability (5/6)^N. For that to
 *    be at most 0.1% (i.e. the old code goes red with >= 99.9% probability):
 *        N >= ln(0.001) / ln(5/6) = 6.9078 / 0.18232 = 37.89  ->  N = 38
 *        (5/6)^38 = 0.00098  ->  P(red on the old code) = 99.90%
 *
 *    CAVEAT, stated rather than hidden: p = 1/6 was measured at 6 workers. The
 *    race is load-dependent, so an idle single-worker run may have a lower p and
 *    therefore a lower detection rate. That is what test 2 is for.
 *
 * 2. `forced` — the same shape with the race REMOVED instead of sampled. The
 *    boot's first `button.css` request is held at the network layer, so when
 *    `setContent` lands the boot's button injection is guaranteed to be awaiting
 *    a `<link>` that is still loading. setContent detaches that `<link>`.
 *    `#autoBtn` in the new content then needs `button.css`:
 *      - OLD code: `loaded.get('button.css')` returns the cached, never-settling
 *        promise; `#autoBtn`'s injection awaits it forever; `#autoBtn` is
 *        connected, so the injection tracker counts it; `WB.whenIdle()` rejects
 *        naming `button`. Red on EVERY run, not 1 in 6.
 *      - FIXED code: the cached entry is neither settled nor attached to a
 *        connected `<link>`, so `loadCssFile()` discards it and loads again (or
 *        the `readystatechange` sweep has already settled it). Either way the
 *        injection completes.
 *    Only the FIRST `button.css` request is held. Every later one (the fixed
 *    code's re-load) is passed straight through, so the fixed runtime is not
 *    starved by the test itself.
 *
 * HOW EACH TEST FAILS AGAINST THE OLD CODE: `WB.whenIdle({ timeout })` rejects
 * with "N injection(s) still in flight … button …", the in-page script records
 * `ok: false`, and the assertion reports the repetition number and that message.
 *
 * No sleeps: every wait is `WB.whenIdle()` (resolves when the runtime has
 * stopped working, rejects if it has not) or `waitForFunction` on the in-page
 * completion flag.
 */

/** The content setContent drops in: one plain <button> the runtime must build. */
const CONTENT = `
  <button id="autoBtn">Auto</button>
  <script type="module">
    import WB from '/src/core/wb.js';
    window.__done = null;
    WB.init({ autoInject: true })
      .then(() => WB.scan(document.body))
      .then(() => WB.whenIdle({ timeout: 10000 }))
      .then(() => { window.__done = { ok: true, pending: WB.pendingCount, stuck: WB.pendingBehaviors }; })
      .catch((e) => { window.__done = { ok: false, error: String(e), pending: WB.pendingCount, stuck: WB.pendingBehaviors }; });
  </script>
`;

type Done = { ok: boolean; error?: string; pending: number; stuck: string };

/** Reject with `message` if `p` has not settled within `ms`. A deadline, not a readiness sleep. */
function within<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([p, deadline]).finally(() => clearTimeout(timer));
}

/**
 * One trial: wait for the in-page completion flag, then check that the runtime
 * went idle AND that idle means built. `label` names the trial in every
 * failure message.
 */
async function assertSettled(page: Page, label: string) {
  // 10s in-page whenIdle budget + headroom for the module import. Passed as the
  // THIRD argument: waitForFunction's second argument is the page-function arg,
  // so `{ timeout }` there would be silently ignored.
  await page.waitForFunction(() => (window as any).__done !== null, undefined, { timeout: 15000 });
  const done: Done = await page.evaluate(() => (window as any).__done);

  expect(done.ok, `${label}: the runtime never went idle after a mid-boot setContent — ${done.error}`).toBe(true);
  expect(done.pending, `${label}: injections still in flight once WB reported idle (${done.stuck})`).toBe(0);
  // Idle has to mean BUILT, not merely quiet.
  await expect(page.locator('#autoBtn'), `${label}: #autoBtn was never built`).toHaveClass(/x-button/);
  await expect(page.locator('#autoBtn'), `${label}: #autoBtn never settled`).toHaveAttribute('x-ready', '');
}

test.describe('a stylesheet cancelled mid-load settles (#1078)', () => {
  test('repeated: 38 independent mid-boot setContents all settle', async ({ page }) => {
    const N = 38;
    // A healthy repetition is one SPA boot to 'load' plus one small setContent
    // and a 50ms idle window: a few seconds even under 8-worker contention. 8s
    // per repetition is the ceiling that still fits a genuinely slow machine.
    // A hung repetition costs at most its 10s whenIdle budget and ends the test
    // immediately, so the red path is never slower than the green one.
    test.setTimeout(N * 8000); // 304s

    for (let i = 1; i <= N; i++) {
      // No settle between these two, on purpose: setContent must land while the
      // SPA's own boot injections are still in flight. That is the failing case.
      await page.goto('/');
      await page.setContent(CONTENT);
      await assertSettled(page, `repetition ${i} of ${N}`);
    }
  });

  test('forced: setContent lands while a boot stylesheet is provably still loading', async ({ page }) => {
    let held: Route | null = null;
    let signalHeld!: () => void;
    const bootRequestHeld = new Promise<void>((resolve) => { signalHeld = resolve; });

    await page.route(
      (url) => url.pathname.endsWith('/src/styles/behaviors/button.css'),
      async (route) => {
        if (!held) {
          // The boot's own button.css <link>: hold it so it is still loading
          // when setContent detaches it. Released in `finally`.
          held = route;
          signalHeld();
          return;
        }
        // Any later request is the fixed code's re-load: let it through.
        await route.continue();
      },
    );

    try {
      // 'commit', not 'load': a stylesheet inserted before the load event
      // delays it, so waiting for 'load' with button.css held would deadlock
      // the test rather than the runtime.
      await page.goto('/', { waitUntil: 'commit' });

      // A real condition, not a sleep: the boot has inserted its button.css
      // <link> and the request is sitting in our handler, unanswered.
      await within(bootRequestHeld, 20000,
        'precondition: the SPA boot on / never requested button.css within 20s — this test cannot reproduce #1078 without it');

      // 'domcontentloaded', for the SAME reason the goto above uses 'commit':
      // button.css is deliberately held, and setContent's default waitUntil
      // ('load') waits on subresources -- so the held request deadlocked the
      // TEST instead of the runtime, timing out at 30s. Measured 2026-09-12.
      await page.setContent(CONTENT, { waitUntil: 'domcontentloaded' });
      await assertSettled(page, 'forced run');
    } finally {
      // The held request belonged to a <link> setContent destroyed; the browser
      // has usually cancelled it already, so continuing it may throw.
      const route = held as Route | null;
      if (route) await route.continue().catch(() => {});
      await page.unrouteAll({ behavior: 'ignoreErrors' }).catch(() => {});
    }
  });
});
