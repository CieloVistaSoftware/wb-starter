import { test, expect } from '../fixtures/offline';
import { buildEveryDemo, auditDemos } from '../helpers/x-demo-audit';

/**
 * #1817: under heavy parallel load, live-examples-render.spec.ts reported
 * "demos/frameworks.html: [x-demo][0]: no .x-demo__grid was built at all".
 *
 * Reproduced with CDP CPU throttling at 6x. The spec's 1.5s-capped scroll timed
 * out before the busy page answered, so the page never scrolled. Its 5s grid
 * wait then ran out with the demo still queued (WB.pendingBehaviors: "demo"),
 * 4 of 4 runs. The demo itself always built once it was kept in view, 8 of 8.
 * So demo() does not skip its grid; the audit checked before a slow build.
 *
 * This runs the audit's own wait (tests/helpers/x-demo-audit.ts) on the same
 * page at the same throttle. It must report every block built and nothing
 * missing.
 */
test('the x-demo audit waits for a slow build instead of reporting it missing (#1817)', async ({ page }) => {
  test.setTimeout(150_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  try {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('[x-demo]').count(), 'frameworks.html should still carry its x-demo').toBeGreaterThan(0);

    const built = await buildEveryDemo(page, 120_000);
    const problems = await auditDemos(page, 120_000);

    expect(problems, problems.join('\n')).toEqual([]);
    expect(built, 'every x-demo on the page finished building').toBe(true);
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
  }
});
