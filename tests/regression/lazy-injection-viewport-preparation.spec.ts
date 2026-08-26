import { test, expect } from '@playwright/test';

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

    const result = await page.evaluate(async () => {
      const target = document.createElement('button');
      target.setAttribute('x-behavior', 'ripple');
      target.style.cssText = 'position:absolute;top:5000px;left:0;width:10px;height:10px';
      document.body.appendChild(target);

      await (window as any).WB.scan(target.parentElement);
      await new Promise(resolve => setTimeout(resolve, 100));
      const lazyClassBeforeEagerScan = target.classList.contains('[x-ripple]');

      await (window as any).WB.scan(target.parentElement, { eager: true });
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        lazyClassBeforeEagerScan,
        eagerClassAfterScan: target.classList.contains('[x-ripple]'),
        rootMargins: ((window as any).__wbIntersectionObservers as IntersectionObserverInit[])
          .map(observer => observer.rootMargin)
          .filter(Boolean),
      };
    });

    expect(result.rootMargins).toContain('1200px');
    expect(result.lazyClassBeforeEagerScan, 'default scans must remain viewport-lazy').toBe(false);
    expect(result.eagerClassAfterScan, 'eager scans must still inject immediately').toBe(true);
  });
});