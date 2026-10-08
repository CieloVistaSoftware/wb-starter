/**
 * AN ASYNC BEHAVIOR IS x-ready ONLY ONCE IT HAS FINISHED
 * ======================================================
 * wb-lazy.js applied a behavior with `const cleanup = behaviorFn(element)` and
 * no await. For an async behavior -- x-mdhtml loads marked.js, fetches its
 * src, then renders -- that returned a Promise at the first await, so:
 *
 *   - x-ready was stamped and WB.whenIdle() resolved while the element was
 *     still `x-mdhtml--loading` and empty;
 *   - the "cleanup" recorded for removal was that Promise, not a function,
 *     so removing the behavior never tore anything down.
 *
 * Found under load by variants-render-differently: gfm=false and
 * sanitize=false "rendered identically" because both were read as the same
 * empty loading <div>. wb.js already awaited the result; wb-lazy.js had
 * drifted from it.
 *
 * marked.js is held back here so the render is reliably slower than the
 * stamp, which is what load did by chance.
 */
import { test, expect } from '../fixtures/offline';

// #1349: "marked.js is held back here" only happens if the hold is reachable.
// sw.js answers the page's GETs itself and Playwright cannot route a service
// worker's requests, so the hold below was skipped whenever the worker
// had claimed the page — and then the render was no longer reliably slower than
// the stamp, which is the one thing this spec needs to be true.
test.use({ serviceWorkers: 'block' });

test('x-ready and WB.whenIdle() wait for an async behavior to finish rendering', async ({ page }) => {
  await page.goto('/');
  // marked.js is held until its request has reached the test (#1516). The
  // behavior has started by then, so a stamp that does not wait for the render
  // has already landed -- by construction rather than inside a 1500ms guess.
  let openGate!: () => void;
  const gate = new Promise<void>((r) => { openGate = r; });
  await page.route(/marked(\.esm|\.min)?\.js/, async (route) => {
    await gate;
    await route.fallback();
  });
  const markedRequested = page.waitForRequest(/marked(\.esm|\.min)?\.js/, { timeout: 20_000 });
  await page.setContent('<div id="md" x-mdhtml gfm="false">| a | b |\n|---|---|\n| 1 | 2 |</div>');
  await page.addScriptTag({
    type: 'module',
    content: `
      const md = document.getElementById('md');
      new MutationObserver(() => {
        if (md.hasAttribute('x-ready') && !document.body.dataset.atReady) {
          document.body.dataset.atReady = md.classList.contains('x-mdhtml--loaded') ? 'rendered' : md.className;
        }
      }).observe(md, { attributes: true, attributeFilter: ['x-ready'] });
      const t0 = performance.now();
      const { default: WB } = await import('/src/core/wb-lazy.js');
      window.WB = WB;
      await WB.init({ autoInject: true });
      await WB.scan(document.body, { eager: true });
      await WB.whenIdle({ timeout: 20000 });
      document.body.dataset.markedWait = String(Math.round(performance.now() - t0));
      document.body.dataset.atIdle = md.classList.contains('x-mdhtml--loading') ? 'loading' : 'rendered';
    `,
  });
  await markedRequested;
  // Two frames for anything the behavior does without marked to land too.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  openGate();
  // Read at the instant each signal fired, not by a retrying assertion that
  // would simply wait the render out and pass either way.
  await expect(page.locator('body')).toHaveAttribute('data-at-idle', /./, { timeout: 25_000 });
  const body = page.locator('body');
  expect(await body.getAttribute('data-at-ready'), 'state when x-ready was stamped').toBe('rendered');
  expect(await body.getAttribute('data-at-idle'), 'state when whenIdle() resolved').toBe('rendered');
});
