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
 *
 * #779: the sizing is the .x-fullscreen-target class now, not an inline
 * style, so the target's COMPUTED height/overflow are what is compared.
 */
import { test, expect, Page } from '../fixtures/offline';

async function openExample(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.fill('#behaviors-search', 'article');
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 20000 },
  );
  await page.locator('.behaviors-search-results__row').first().click();
  // Wait for the thing both tests call, the fullscreen button's handler, not
  // a guessed 600ms (#962): on Windows CI the click landed before the
  // behavior had wired it, and `btn.onclick!()` threw "is not a function".
  await page.waitForFunction(
    () => typeof (document.getElementById('behaviors-live-fullscreen') as HTMLElement | null)?.onclick === 'function',
    null,
    { timeout: 20000 },
  );
}

test.describe('#733 — a refused fullscreen changes nothing', () => {
  test('a rejected request leaves styles and label untouched, and says why', async ({ page }) => {
    await openExample(page);

    const result = await page.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      // The element the button actually fullscreens, read from the button
      // itself. This used to name #behaviors-live-stage directly; #720 moved
      // the target to the whole workspace (target="#behaviors-workspace"), so
      // the granted case read styles off an element nothing had touched.
      const target = document.querySelector(btn.getAttribute('target')!) as HTMLElement;

      const before = {
        height: getComputedStyle(target!).height,
        overflow: getComputedStyle(target!).overflow,
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
          height: getComputedStyle(target!).height,
          overflow: getComputedStyle(target!).overflow,
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
      const btn = document.getElementById('behaviors-live-fullscreen') as HTMLElement;
      // The element the button actually fullscreens, read from the button
      // itself. This used to name #behaviors-live-stage directly; #720 moved
      // the target to the whole workspace (target="#behaviors-workspace"), so
      // the granted case read styles off an element nothing had touched.
      const target = document.querySelector(btn.getAttribute('target')!) as HTMLElement;
      const labelBefore = btn.textContent!.trim();
      const original = { height: getComputedStyle(target!).height, overflow: getComputedStyle(target!).overflow };

      const origRequest = Element.prototype.requestFullscreen;
      Element.prototype.requestFullscreen = function () { return Promise.resolve(); };

      btn.onclick!(new MouseEvent('click'));
      await sleep(400);
      Element.prototype.requestFullscreen = origRequest;

      // requestFullscreen is mocked, so the browser's own :fullscreen rules
      // (which force a real fullscreen element to fill the screen) never
      // apply, and a flex parent still squeezes the target -- the rendered
      // height was 639px with the old inline style too. What the behavior
      // owns is the sizing class; measure what that class does on a probe
      // no layout constrains.
      const probe = document.createElement('div');
      probe.className = 'x-fullscreen-target';
      document.body.appendChild(probe);
      const classSize = { height: getComputedStyle(probe).height, overflow: getComputedStyle(probe).overflow };
      probe.remove();
      const applied = {
        hasClass: target!.classList.contains('x-fullscreen-target'),
        classSize,
        overflow: getComputedStyle(target!).overflow,
        viewport: `${window.innerHeight}px`,
        label: btn.textContent!.trim(),
      };

      // Coming back out restores what was saved (#720's guarantee).
      document.dispatchEvent(new Event('fullscreenchange'));
      await sleep(300);

      return {
        labelBefore,
        original,
        applied,
        afterExit: {
          height: getComputedStyle(target!).height,
          overflow: getComputedStyle(target!).overflow,
        },
      };
    });

    expect(result.applied.hasClass, 'granted: the target carries the fullscreen sizing').toBe(true);
    expect(result.applied.classSize.height, 'and that sizing fills the viewport').toBe(result.applied.viewport);
    expect(result.applied.overflow, 'granted: the target scrolls its own content').toBe('auto');
    expect(result.applied.label, 'granted: the button offers the way out').toContain('Exit');
    expect(result.afterExit.height, 'and leaving restores the original height').toBe(result.original.height);
    expect(result.afterExit.overflow, 'and the original overflow').toBe(result.original.overflow);
  });
});
