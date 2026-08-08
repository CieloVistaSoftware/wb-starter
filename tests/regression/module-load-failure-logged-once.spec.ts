/**
 * #513 — loadModule() must not turn ONE module-load failure into N log entries
 * ============================================================================
 *
 * `loadModule()` (src/wb-viewmodels/index.js) cached successes and in-flight
 * promises but NOT failures. Two separate amplifiers followed from that:
 *
 *   1. Every caller that awaited the SAME rejected promise ran its own catch
 *      block in wb-lazy.js's inject() → `Events.error(...)` → one entry in
 *      data/errors.json PER ELEMENT. 66 of the 100 entries in the live log
 *      were one `semantics/button.js` failure echoed once per button.
 *   2. Once the rejected in-flight promise was deleted, the NEXT element to
 *      need that behavior started a brand-new `import()` — a fresh failing
 *      network request, and a fresh error — with no memory that the module
 *      had just failed.
 *
 * The fix memoizes the failure (short cooldown, NOT permanent — see the
 * "recovers" test below) and reports it once per failure, not once per caller.
 *
 * This spec intercepts POST /api/error-log/append so it counts what WOULD be
 * written to data/errors.json without actually polluting it (the
 * error-log-empty compliance test asserts that file stays empty).
 */
import { test, expect, Page } from '@playwright/test';

// Trailing `**` is required: a cache-busted retry appends `?wb-retry=<ts>`
// (src/wb-viewmodels/index.js's loadModule(), #513), and without the
// wildcard that query string makes the URL no longer match this glob -- the
// retry then silently escapes the simulated failure and hits the real
// server, masking the very failure this test exists to simulate.
const MODULE_GLOB = '**/src/wb-viewmodels/semantics/button.js**';
const ELEMENT_COUNT = 8;

/** Cooldown in src/wb-viewmodels/index.js; the recovery test must outwait it. */
const FAILURE_COOLDOWN_MS = 5000;

interface Harness {
  loggedErrors: () => any[];
  moduleRequests: () => number;
  setFailing: (failing: boolean) => void;
}

async function installHarness(page: Page): Promise<Harness> {
  const logged: any[] = [];
  let moduleRequests = 0;
  let failing = true;

  // Count what would be persisted to data/errors.json — and swallow it, so
  // this deliberately-broken page never writes to the real error log.
  await page.route('**/api/error-log/append', async route => {
    try {
      logged.push(JSON.parse(route.request().postData() || '{}').error);
    } catch {
      logged.push(null);
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.route(MODULE_GLOB, async route => {
    moduleRequests++;
    if (failing) await route.abort('failed');
    else await route.continue();
  });

  return {
    loggedErrors: () => logged.filter(e => e && String(e.message || '').includes('semantics/button.js')),
    moduleRequests: () => moduleRequests,
    setFailing: (v: boolean) => { failing = v; },
  };
}

/**
 * blank.html has no scripts of its own, so nothing calls WB.init() before the
 * test's own explicit call does (same isolation rationale as
 * tests/compliance/autoinject-default-false.spec.ts).
 */
async function render(page: Page, body: string, script: string) {
  await page.goto('/tests/fixtures/blank.html');
  await page.setContent(`
    ${body}
    <script type="module">
      import WB from '/src/core/wb-lazy.js';
      window.__wbDone = false;
      (async () => {
        try {
          await WB.init({ scan: false, observe: false });
          ${script}
        } finally {
          window.__wbDone = true;
        }
      })();
    </script>
  `);
  await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 20000 });
  // Let the per-element catch blocks (and their async error-log POSTs) settle.
  await page.waitForTimeout(1500);
}

test.describe('#513 one module-load failure = one logged error', () => {
  test('N elements injected in one scan burst log the failure exactly once', async ({ page }) => {
    const h = await installHarness(page);

    const buttons = Array.from(
      { length: ELEMENT_COUNT },
      (_, i) => `<button id="b${i}" x-behavior="button">Button ${i}</button>`
    ).join('\n');

    await render(page, buttons, `await WB.scan(document.body, { eager: true });`);

    expect(
      h.loggedErrors().length,
      `${ELEMENT_COUNT} elements share one failing module — the failure must be logged once, ` +
      `not once per element. Logged ${h.loggedErrors().length}.`
    ).toBe(1);

    // Every element still gets marked, even though only one error was logged.
    await expect(page.locator(`button[x-error="true"]`)).toHaveCount(ELEMENT_COUNT);
  });

  test('sequential injections reuse the cached failure — no re-import, no re-log', async ({ page }) => {
    const h = await installHarness(page);

    await render(
      page,
      `<button id="a" x-behavior="button">A</button>
       <button id="b" x-behavior="button">B</button>
       <button id="c" x-behavior="button">C</button>`,
      // Awaited one at a time, so the in-flight promise is long gone before
      // the next caller asks — this is the path that had NO memo at all.
      `await WB.inject(document.getElementById('a'), 'button');
       await WB.inject(document.getElementById('b'), 'button');
       await WB.inject(document.getElementById('c'), 'button');`
    );

    // loadModule() (src/wb-viewmodels/index.js) retries a failing import
    // in-place before giving up -- 3 attempts total (moduleImportRetries=2
    // extra tries) -- to absorb a genuinely transient blip within one call
    // (#512). All 3 of those belong to caller 'a' alone; the assertion this
    // test exists for is that 'b' and 'c' add ZERO further requests by
    // reusing the cooldown-memoized failure, not that the total is 1.
    expect(
      h.moduleRequests(),
      `A failed module must not be re-fetched by every later caller. Requests: ${h.moduleRequests()}.`
    ).toBe(3);

    expect(
      h.loggedErrors().length,
      `Sequential callers must not each log the same failure. Logged ${h.loggedErrors().length}.`
    ).toBe(1);
  });

  test('a cached failure is NOT permanent — the module can succeed after the cooldown', async ({ page }) => {
    test.setTimeout(60000);
    const h = await installHarness(page);

    await render(
      page,
      `<button id="a" x-behavior="button">A</button>
       <button id="later" x-behavior="button">Later</button>`,
      `await WB.inject(document.getElementById('a'), 'button');
       window.__retry = async () => {
         await WB.inject(document.getElementById('later'), 'button');
       };`
    );

    expect(h.loggedErrors().length).toBe(1);
    const requestsAfterFailure = h.moduleRequests();

    // Network recovers (server restart, transient blip, offline → online).
    h.setFailing(false);
    await page.waitForTimeout(FAILURE_COOLDOWN_MS + 1000);
    await page.evaluate(() => (window as any).__retry());
    await page.waitForTimeout(1000);

    expect(
      h.moduleRequests(),
      'After the cooldown the module must be retried, not permanently poisoned.'
    ).toBeGreaterThan(requestsAfterFailure);

    await expect(page.locator('#later')).not.toHaveAttribute('x-error', 'true');
  });
});
