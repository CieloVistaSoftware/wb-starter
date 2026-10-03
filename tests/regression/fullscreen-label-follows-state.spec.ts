/**
 * #738 — the x-fullscreen button's label must follow document.fullscreenElement,
 * never the outcome of the request.
 *
 * John, with a screenshot of the button reading "✕ Exit Fullscreen": "neither
 * fullscreen or exit work". One cause for both halves. The label was written
 * from the request's outcome, so a resolve that did not actually put the target
 * in the top layer left the button saying "Exit" while document.fullscreenElement
 * was null — and the exit branch is gated on document.fullscreenElement, so the
 * next click took the ENTER branch again. Exit became unreachable, which from
 * the outside is "neither works".
 *
 * #733 stopped the label flipping BEFORE the request settled. This file covers
 * the remaining gap: the state the label is derived FROM.
 *
 * How this is tested
 * ------------------
 * Every case goes through the real user action — a Playwright click on the real
 * button, and a real Escape key press for the exit that does not come from it.
 * Setting the behavior's state by hand and reading the DOM back would pass
 * against the buggy code, because the bug IS the state the behavior believes in.
 *
 * The fullscreen API itself is stubbed, in two flavours:
 *
 *   - a RESOLVE WITHOUT A GRANT — the promise resolves and nothing enters the
 *     top layer. This is the #738 case; whether a real browser or embedder ever
 *     does this is not the point, the contract is that the button may not lie.
 *   - a FAKE ENGINE that keeps a fullscreen element, dispatches
 *     `fullscreenchange` on entry and exit, and releases it on Escape — i.e. a
 *     browser that behaves. Headless Chromium will not grant real fullscreen
 *     reliably, and a test that depends on that grant is a test that reports
 *     the harness instead of the code.
 */
import { test, expect, type Page } from '../fixtures/offline';
import { showBehavior } from '../helpers/behaviors-page';

const BUTTON_ID = 'behaviors-live-fullscreen';
const BUTTON = `#${BUTTON_ID}`;

/** Bring an example (and with it the fullscreen button) onto the behaviors page. */
async function openFullscreenButton(page: Page): Promise<void> {
  await showBehavior(page, 'x-accordion');
  // Wait for the handler the tests click, not a guessed delay (#962): on
  // Windows CI the click can land before the behavior has wired the button.
  await page.waitForFunction(
    (id) => typeof (document.getElementById(id) as HTMLElement | null)?.onclick === 'function',
    BUTTON_ID,
    { timeout: 20000 },
  );
  await expect(page.locator(BUTTON), 'the fullscreen button must be on screen to be clicked').toBeVisible();
}

/**
 * Replace requestFullscreen with one that RESOLVES and grants nothing.
 * console.error is captured rather than passed through: the site forwards it to
 * the error log, and a deliberate error in a test is not a defect in the page.
 */
async function stubResolveWithoutGrant(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as any;
    w.__fsErrors = [];
    w.__fsOrigConsoleError = console.error;
    console.error = (...args: any[]) => { w.__fsErrors.push(args.map(String).join(' ')); };
    w.__fsOrigRequest = Element.prototype.requestFullscreen;
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
  });
}

/**
 * A fullscreen implementation that actually holds state: requestFullscreen
 * records the element and fires `fullscreenchange` before resolving (the order
 * the spec requires), exitFullscreen clears it, and Escape clears it with no
 * click at all — the path a label managed inside the click handler never sees.
 */
async function installFakeFullscreenEngine(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as any;
    w.__fsCurrent = null;
    w.__fsOrigRequest = Element.prototype.requestFullscreen;
    w.__fsOrigExit = Object.getOwnPropertyDescriptor(Document.prototype, 'exitFullscreen');

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => w.__fsCurrent,
    });

    const change = () => document.dispatchEvent(new Event('fullscreenchange'));
    w.__fsEnter = (el: Element | null) => { w.__fsCurrent = el; change(); };

    Element.prototype.requestFullscreen = function () {
      w.__fsCurrent = this;
      change();
      return Promise.resolve();
    };
    (document as any).exitFullscreen = () => { w.__fsCurrent = null; change(); return Promise.resolve(); };

    // The browser's own Escape handling, modelled: state drops, event fires,
    // no click anywhere.
    w.__fsEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && w.__fsCurrent) { w.__fsCurrent = null; change(); }
    };
    window.addEventListener('keydown', w.__fsEscape, true);
  });
}

/** What a reader sees, plus the state it is supposed to agree with. */
async function readState(page: Page) {
  return page.evaluate((id) => {
    const btn = document.getElementById(id) as HTMLElement;
    const target = document.querySelector(btn.getAttribute('target') || '') as HTMLElement | null;
    return {
      label: (btn.textContent || '').trim(),
      offersExit: /exit/i.test(btn.textContent || ''),
      sized: !!target && target.classList.contains('x-fullscreen-target'),
      targetIsFullscreen: !!target && document.fullscreenElement === target,
      anythingFullscreen: !!document.fullscreenElement,
      errors: ((window as any).__fsErrors || []) as string[],
    };
  }, BUTTON_ID);
}

test.describe('#738 — the fullscreen label follows the browser, not the request', () => {
  test('a resolve that did not go fullscreen never leaves the button offering Exit', async ({ page }) => {
    await openFullscreenButton(page);
    const idle = await readState(page);
    expect(idle.offersExit, 'precondition: the button starts by offering to ENTER fullscreen').toBe(false);

    await stubResolveWithoutGrant(page);
    await page.locator(BUTTON).click();
    // The verification runs in the request's .then(); give the microtask queue
    // and the behavior's own handler a turn.
    await page.waitForTimeout(400);

    const after = await readState(page);

    expect(after.targetIsFullscreen, 'precondition: this stub grants nothing').toBe(false);
    expect(after.offersExit, 'the button must not offer an exit from a fullscreen nobody is in').toBe(false);
    expect(after.label, 'it must still read exactly what it read before the click').toBe(idle.label);
    expect(after.sized, 'and the target must not be stretched to the viewport').toBe(false);
    expect(
      after.errors.some((e) => e.includes('[WB:fullscreen]') && /not the fullscreen element/i.test(e)),
      'a resolve that did not go fullscreen must be reported, not assumed to be a success',
    ).toBe(true);
  });

  test('Escape exits without a click and the button stops offering Exit', async ({ page }) => {
    await openFullscreenButton(page);
    const idle = await readState(page);

    await installFakeFullscreenEngine(page);
    await page.locator(BUTTON).click();
    await page.waitForTimeout(300);

    const entered = await readState(page);
    expect(entered.targetIsFullscreen, 'a granted request puts the target in fullscreen').toBe(true);
    expect(entered.offersExit, 'and the button offers the way out').toBe(true);
    expect(entered.sized, 'and the target carries the fullscreen sizing').toBe(true);

    // The user presses Escape. No click reaches the button.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const exited = await readState(page);
    expect(exited.anythingFullscreen, 'Escape leaves fullscreen').toBe(false);
    expect(exited.offersExit, 'so the button may not still offer to exit it').toBe(false);
    expect(exited.label, 'the label goes back to what it was before any of this').toBe(idle.label);
    expect(exited.sized, 'and the sizing comes off the target').toBe(false);
  });

  test('clicking while genuinely in fullscreen exits instead of entering again', async ({ page }) => {
    await openFullscreenButton(page);
    const idle = await readState(page);

    await installFakeFullscreenEngine(page);
    await page.locator(BUTTON).click();
    await page.waitForTimeout(300);
    expect((await readState(page)).targetIsFullscreen, 'precondition: in fullscreen').toBe(true);

    // The second click is the one John could not get to work.
    await page.locator(BUTTON).click();
    await page.waitForTimeout(300);

    const after = await readState(page);
    expect(after.anythingFullscreen, 'the second click must EXIT, not request again').toBe(false);
    expect(after.offersExit, 'and the button goes back to offering to enter').toBe(false);
    expect(after.label).toBe(idle.label);
    expect(after.sized).toBe(false);
  });

  test('fullscreen moving to another element stops this button claiming Exit', async ({ page }) => {
    await openFullscreenButton(page);
    const idle = await readState(page);

    await installFakeFullscreenEngine(page);
    await page.locator(BUTTON).click();
    await page.waitForTimeout(300);
    expect((await readState(page)).offersExit, 'precondition: the button offers the exit').toBe(true);

    // Something else takes the top layer. The target is no longer fullscreen,
    // so this button is no longer the way out of anything.
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.id = 'fs-probe-738';
      document.body.appendChild(probe);
      (window as any).__fsEnter(probe);
    });
    await page.waitForTimeout(300);

    const after = await readState(page);
    expect(after.anythingFullscreen, 'precondition: fullscreen is held by the other element').toBe(true);
    expect(after.targetIsFullscreen, 'but not by this button\'s target').toBe(false);
    expect(after.offersExit, 'so the label may not say the target is fullscreen').toBe(false);
    expect(after.label).toBe(idle.label);
    expect(after.sized, 'and the sizing belongs to the element that is actually fullscreen').toBe(false);
  });

  test('a button with its own label gets that label back on exit, not the generic one', async ({ page }) => {
    await openFullscreenButton(page);

    // A second x-fullscreen button, wired by the framework's own scan, whose
    // label is not the behavior's default. The restore path used to write the
    // hardcoded default, silently renaming any button that had its own.
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'fs-custom-738';
      btn.type = 'button';
      btn.setAttribute('x-fullscreen', '');
      btn.setAttribute('target', '#behaviors-workspace');
      btn.setAttribute('label', 'Expand');
      document.body.appendChild(btn);
    });
    await page.waitForFunction(
      () => typeof (document.getElementById('fs-custom-738') as HTMLElement | null)?.onclick === 'function',
      null,
      { timeout: 20000 },
    );

    const read = () => page.evaluate(() => (document.getElementById('fs-custom-738')!.textContent || '').trim());
    expect(await read(), 'the custom label is what the button reads to begin with').toBe('Expand');

    await installFakeFullscreenEngine(page);
    await page.locator('#fs-custom-738').click();
    await page.waitForTimeout(300);
    expect(await read(), 'in fullscreen it offers the exit').toMatch(/exit/i);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await read(), 'and leaving restores ITS label, not the behavior default').toBe('Expand');
  });
});
