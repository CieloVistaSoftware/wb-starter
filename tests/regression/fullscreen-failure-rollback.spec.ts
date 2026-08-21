/**
 * #733 — x-fullscreen must not commit anything until the request succeeds.
 *
 * John: "fullscreen is not working". Measured on a real click: the target had
 * already been stretched to `height: 100vh` and the button already read
 * "✕ Exit Fullscreen", while `document.fullscreenElement` was null. A panel
 * blown up to viewport height, a control lying about the state, and no error
 * anywhere to explain either — because `requestFullscreen()`'s promise was
 * thrown away and the restore path only runs on `fullscreenchange`, which never
 * fires for a request that was rejected.
 *
 * The real API is stubbed here on purpose. Whether a given browser or embedder
 * grants fullscreen is not what is being tested — the contract is: nothing
 * changes unless it is granted, and a refusal says why.
 */
import { test, expect, Page } from '@playwright/test';

async function openExample(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'article');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 20000 },
  );
  await page.locator('.behaviors-search-results__row').first().click();
  await page.waitForTimeout(600);
}

test.describe('#733 — a refused fullscreen changes nothing', () => {
  test('a rejected request leaves styles and label untouched, and says why', async ({ page }) => {
    await openExample(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const target = document.getElementById('behaviors-live-stage')
        || document.getElementById('behaviors-live-example');
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;

      const before = {
        height: target!.style.height,
        overflow: target!.style.overflow,
        label: btn.textContent!.trim(),
        rect: Math.round(target!.getBoundingClientRect().height),
      };

      const errors: string[] = [];
      const origError = console.error;
      console.error = (...a: any[]) => { errors.push(a.join(' ')); origError(...a); };

      const origRequest = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function () {
        return Promise.reject(new DOMException('Permissions check failed', 'TypeError'));
      };

      btn.onclick!(new MouseEvent('click'));
      await sleep(400);

      Element.prototype.requestFullscreen = origRequest;
      console.error = origError;

      return {
        before,
        after: {
          height: target!.style.height,
          overflow: target!.style.overflow,
          label: btn.textContent!.trim(),
          rect: Math.round(target!.getBoundingClientRect().height),
        },
        reported: errors.some((e) => e.includes('[WB:fullscreen]') && e.includes('Permissions check failed')),
      };
    });

    expect(result.after.height, 'a refused request must not stretch the target').toBe(result.before.height);
    expect(result.after.overflow, 'nor change its overflow').toBe(result.before.overflow);
    expect(result.after.rect, 'the target must be exactly the size it was').toBe(result.before.rect);
    expect(result.after.label, 'the button must not claim you are in fullscreen').toBe(result.before.label);
    expect(result.reported, 'and the reason must be logged, not swallowed').toBe(true);
  });

  test('a granted request applies the fullscreen styles and label', async ({ page }) => {
    await openExample(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const target = document.getElementById('behaviors-live-stage')
        || document.getElementById('behaviors-live-example');
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      const labelBefore = btn.textContent!.trim();

      const origRequest = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function () { return Promise.resolve(); };

      btn.onclick!(new MouseEvent('click'));
      await sleep(400);
      Element.prototype.requestFullscreen = origRequest;

      const applied = {
        height: target!.style.height,
        overflow: target!.style.overflow,
        label: btn.textContent!.trim(),
      };

      // Coming back out restores what was saved (#720's guarantee).
      document.dispatchEvent(new Event('fullscreenchange'));
      await sleep(300);

      return {
        labelBefore,
        applied,
        afterExit: {
          height: target!.style.height,
          overflow: target!.style.overflow,
        },
      };
    });

    expect(result.applied.height, 'granted: the target fills the viewport').toBe('100vh');
    expect(result.applied.label, 'granted: the button offers the way out').toContain('Exit');
    expect(result.afterExit.height, 'and leaving restores the original height').toBe('');
    expect(result.afterExit.overflow, 'and the original overflow').toBe('');
  });
});
