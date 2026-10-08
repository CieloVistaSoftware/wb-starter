import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * #1229 -- John, in the playground: "WB: clock Failed to execute 'add' on
 * 'DOMTokenList': The token provided ('x-clock--analogue    ') contains HTML
 * space characters". The playground re-renders on every keystroke, so a
 * half-typed variant carried a newline and indentation into classList.add().
 *
 * Also: "analogue" (the docs' word) matched no CSS face, and the teardown
 * cleared an out-of-scope `interval`, throwing a ReferenceError and leaving
 * the 1-second timer running.
 */
test('x-clock normalizes its variant, never throws, and its teardown stops the timer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The x-clock interval runs on the page's clock, driven from here (#1516).
  await page.clock.install();
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div id="ws" x-clock variant="analogue\n    "></div>' +
      '<div id="led" x-clock variant=" LED "></div>' +
      '<div id="junk" x-clock variant="sundial"></div>' +
      '<div id="fmt" x-clock format=" 12 " show-seconds="false"></div>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  });
  await settlePage(page, { timeout: 10000 });
  const r = await page.evaluate(async () => {
    const cls = (id: string) => [...document.getElementById(id)!.classList].filter((c) => c.startsWith('x-clock--'));
    const text = document.getElementById('fmt')!.textContent || '';
    // Teardown: the cleanup returned by clock() must clear its own timer.
    const { clock } = await import('/src/wb-viewmodels/helpers.js');
    const el = document.createElement('div');
    document.body.appendChild(el);
    let teardownError = '';
    const cleanup = clock(el, { variant: 'digital' });
    try { cleanup(); } catch (e: any) { teardownError = e.message; }
    el.textContent = 'frozen';
    (window as any).__torndown = el;
    return { ws: cls('ws'), led: cls('led'), junk: cls('junk'), text, teardownError };
  });
  // Past the 1-second tick: a timer that survived teardown would fire here.
  await page.clock.runFor(1300);
  const after = await page.evaluate(() => {
    const el = (window as any).__torndown as HTMLElement;
    return { afterTeardown: el.textContent, removed: el.classList.contains('x-clock') };
  });
  expect(errors.filter((e) => /DOMTokenList|InvalidCharacterError|interval is not defined/.test(e))).toEqual([]);
  expect(r.ws).toEqual(['x-clock--analog']);
  expect(r.led).toEqual(['x-clock--led']);
  expect(r.junk).toEqual(['x-clock--digital']);
  expect(r.text, '12-hour format with AM/PM and no seconds').toMatch(/^\d{2}:\d{2} (AM|PM)$/);
  expect(r.teardownError).toBe('');
  expect(after.afterTeardown, 'the timer kept rewriting the element after teardown').toBe('frozen');
  expect(after.removed).toBe(false);
});
