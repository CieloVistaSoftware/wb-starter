import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

test.describe('viewport-lazy injection prepares elements before visibility (#491)', () => {
  test('uses a 1200px preparation window while preserving lazy and eager scan modes', async ({ page }) => {
    await page.addInitScript(() => {
      const NativeIntersectionObserver = window.IntersectionObserver;
      (window as any).__wbIntersectionObservers = [];
      window.IntersectionObserver = class extends NativeIntersectionObserver {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          super(callback, options);
          (window as any).__wbIntersectionObservers.push(options ?? {});
        }
      } as typeof IntersectionObserver;
    });

    await page.goto('/demos/test-harness.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, { timeout: 20000 });

    await page.evaluate(async () => {
      const target = document.createElement('button');
      target.setAttribute('x-ripple', '');
      target.style.cssText = 'position:absolute;top:5000px;left:0;width:10px;height:10px';
      document.body.appendChild(target);
      (window as any).__rippleTarget = target;

      await (window as any).WB.scan(target.parentElement);
    });
    // settled() includes the observer's first report on the element (#962):
    // after it, an off-screen element has been told it is off-screen, so an
    // injection that was going to happen has happened (#1516: not 100ms).
    await settlePage(page, { timeout: 10000 });
    // ripple.js adds the class `x-ripple`. This read `'[x-ripple]'` -- an
    // attribute SELECTOR used as a class name, which no element ever has --
    // so the lazy half passed vacuously and the eager half could not pass.
    const lazyClassBeforeEagerScan = await page.evaluate(async () => {
      const target = (window as any).__rippleTarget as HTMLElement;
      const lazy = target.classList.contains('x-ripple');
      await (window as any).WB.scan(target.parentElement, { eager: true });
      return lazy;
    });
    // Built once its work has called back (#1516: not 100ms).
    await settlePage(page, { timeout: 10000 });

    const result = await page.evaluate((lazyClassBeforeEagerScan) => {
      const target = (window as any).__rippleTarget as HTMLElement;
      return {
        lazyClassBeforeEagerScan,
        eagerClassAfterScan: target.classList.contains('x-ripple'),
        rootMargins: ((window as any).__wbIntersectionObservers as IntersectionObserverInit[])
          .map(observer => observer.rootMargin)
          .filter(Boolean),
      };
    }, lazyClassBeforeEagerScan);

    expect(result.rootMargins).toContain('1200px');
    expect(result.lazyClassBeforeEagerScan, 'default scans must remain viewport-lazy').toBe(false);
    expect(result.eagerClassAfterScan, 'eager scans must still inject immediately').toBe(true);
  });
});