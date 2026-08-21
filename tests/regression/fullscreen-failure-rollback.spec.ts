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
      // The EXAMPLE WRAPPER is what x-fullscreen targets since #722 -- the stage
      // is the panel-sized surface around it. Checking the stage first measured
      // the wrong element: the wrapper got height:100vh while the stage stayed
      // empty, and the test read "" and called the grant a failure.
      const target = document.getElementById('behaviors-live-example')
        || document.getElementById('behaviors-live-stage');
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
      // The EXAMPLE WRAPPER is what x-fullscreen targets since #722 -- the stage
      // is the panel-sized surface around it. Checking the stage first measured
      // the wrong element: the wrapper got height:100vh while the stage stayed
      // empty, and the test read "" and called the grant a failure.
      const target = document.getElementById('behaviors-live-example')
        || document.getElementById('behaviors-live-stage');
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      const labelBefore = btn.textContent!.trim();

      // A GENUINE grant: resolve AND put the element in the top layer. #738
      // made the code check `document.fullscreenElement === targetEl` before
      // committing, so a bare resolve is (correctly) refused now -- faking only
      // the promise would be testing the refusal path, not this one.
      const origRequest = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function (this: Element) {
        Object.defineProperty(document, 'fullscreenElement', {
          configurable: true, get: () => this,
        });
        return Promise.resolve();
      };

      btn.onclick!(new MouseEvent('click'));
      await sleep(400);
      Element.prototype.requestFullscreen = origRequest;

      const applied = {
        height: target!.style.height,
        overflow: target!.style.overflow,
        label: btn.textContent!.trim(),
      };

      // Coming back out restores what was saved (#720's guarantee).
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true, get: () => null,
      });
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

test.describe('#738 — the label never lies about the state', () => {
  test('a resolve that did not actually go fullscreen is caught and reported', async ({ page }) => {
    await openExample(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const target = document.getElementById('behaviors-live-example')
        || document.getElementById('behaviors-live-stage');
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      const labelBefore = btn.textContent!.trim();

      const errors: string[] = [];
      const origError = console.error;
      console.error = (...a: any[]) => { errors.push(a.join(' ')); origError(...a); };

      // Resolve WITHOUT the browser actually entering fullscreen — the exact
      // state John hit: a button offering an exit that could never run, because
      // the exit branch is gated on document.fullscreenElement.
      const origRequest = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function () { return Promise.resolve(); };

      btn.onclick!(new MouseEvent('click'));
      await sleep(400);

      Element.prototype.requestFullscreen = origRequest;
      console.error = origError;

      return {
        labelBefore,
        labelAfter: btn.textContent!.trim(),
        height: target!.style.height,
        reported: errors.some((e) => e.includes('[WB:fullscreen]') && e.includes('not the fullscreen element')),
        fullscreenElement: document.fullscreenElement ? 'set' : 'null',
      };
    });

    expect(result.fullscreenElement, 'the premise: nothing is actually fullscreen').toBe('null');
    expect(result.labelAfter, 'the button must not offer an exit that cannot work')
      .toBe(result.labelBefore);
    expect(result.height, 'and nothing may be stretched').toBe('');
    expect(result.reported, 'the mismatch must be reported').toBe(true);
  });

  test('leaving by Escape resets the label', async ({ page }) => {
    await openExample(page);

    const label = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const target = document.getElementById('behaviors-live-example')
        || document.getElementById('behaviors-live-stage');
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;

      // Pretend the browser really did enter fullscreen on our target...
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true, get: () => target,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      await sleep(200);
      const whileIn = btn.textContent!.trim();

      // ...then Escape: fullscreenchange fires with NO click involved.
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true, get: () => null,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
      await sleep(200);

      return { whileIn, afterEscape: btn.textContent!.trim() };
    });

    expect(label.whileIn, 'in fullscreen the button offers the way out').toContain('Exit');
    expect(label.afterEscape, 'Escape must put the label back — no click happens').not.toContain('Exit');
  });
});
