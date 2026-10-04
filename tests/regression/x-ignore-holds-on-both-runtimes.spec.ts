import { test, expect } from '../fixtures/offline';

/**
 * #1168 -- x-ignore opts an element out of every behavior, on both runtimes.
 *
 * wb.js's inject() refused an x-ignore'd element; wb-lazy.js honoured x-ignore
 * only for native auto-inject, so an explicit x-* beside it still applied:
 * <span x-chip x-ignore> became a chip on every lazy page (the demos, the
 * behaviors page) and stayed a plain span on wb.js.
 */
const CASES = [
  { runtime: 'wb-lazy.js', url: '/demos/test-harness.html' },
  { runtime: 'wb.js', url: '/index.html' },
];

for (const { runtime, url } of CASES) {
  test(`${runtime}: <span x-chip x-ignore> stays a plain span; <span x-chip> becomes a chip`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(url);
    await page.waitForFunction(() => typeof (window as any).WB?.scan === 'function', null, { timeout: 30_000 });
    const result = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const host = document.createElement('div');
      host.id = 'probe-1168';
      host.innerHTML = '<span id="ignored" x-chip x-ignore>Ignored</span><span id="control" x-chip>Control</span>';
      document.body.appendChild(host);
      await WB.scan(host, { eager: true });
      await WB.whenIdle?.({ timeout: 10_000 });
      const ignored = document.getElementById('ignored')!;
      const control = document.getElementById('control')!;
      const out = {
        ignoredClasses: ignored.className,
        ignoredReady: ignored.hasAttribute('x-ready'),
        controlIsChip: control.classList.contains('x-chip'),
      };
      host.remove();
      return out;
    });
    expect(result.controlIsChip, 'control: the chip behavior must apply at all, or this test proves nothing').toBe(true);
    expect(result.ignoredClasses, 'x-ignore must keep the chip behavior off').not.toContain('x-chip');
  });
}
