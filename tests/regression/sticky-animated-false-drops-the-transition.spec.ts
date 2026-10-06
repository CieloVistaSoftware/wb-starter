import { test, expect } from '../fixtures/offline';

/**
 * x-sticky animated="false" TURNS THE STICK/UNSTICK TRANSITION OFF (#669)
 * ======================================================================
 * sticky.schema.json, docs/behaviors/sticky.md and demos/site/layout.html all
 * say `animated`. sticky.js read `animate` -- and then nothing used even that:
 * the shadow transition is .x-sticky's own rule in effects.css, on every host.
 * So animated="false" did nothing under either spelling. The schema-reads
 * audit (#669) found it once it could resolve sticky's schema at all.
 *
 * See it by hand: open /demos/test-harness.html, add
 * <div x-sticky animated="false">Bar</div>, and read its computed
 * transition-duration. Before: 0.2s. Now: 0s. Without the attribute it is
 * still 0.2s.
 */

test.describe('x-sticky animated (#669)', () => {
  test('animated="false" drops the transition; the default and the old animate spelling behave', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });

    const durations = await page.evaluate(async () => {
      const box = document.createElement('div');
      box.innerHTML = [
        '<div id="default" x-sticky>Default</div>',
        '<div id="off" x-sticky animated="false">Off</div>',
        '<div id="legacy" x-sticky animate="false">Legacy</div>',
      ].join('');
      document.body.appendChild(box);
      await (window as any).WB.scan(box, { eager: true });
      const read = (id: string) => getComputedStyle(document.getElementById(id)!).transitionDuration;
      return { default: read('default'), off: read('off'), legacy: read('legacy') };
    });

    expect(durations.default, 'the default sticky lost its shadow transition').toBe('0.2s');
    expect(durations.off, 'animated="false" still animates').toBe('0s');
    expect(durations.legacy, 'the old animate="false" spelling stopped working').toBe('0s');
  });
});
