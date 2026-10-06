import { test, expect } from '../fixtures/offline';

/**
 * A native <input> is wrapped once, however many times input() reaches it (#1645).
 *
 * On the Behaviors page #behaviors-search sometimes sat inside TWO nested
 * .x-input__wrapper--native divs (3 of 4 loads). The native path of input()
 * had no guard against running again on an input it had already wrapped, so
 * any second pass -- a rescan, the other runtime, a direct WB.inject -- wrapped
 * the wrapper. Every other part of input() is skipped by a guard; this one was not.
 */
test('input() on an already-wrapped native input leaves exactly one wrapper', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  const r = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<input type="search" id="once-1645" placeholder="Search">';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    const mod = await import('/src/wb-viewmodels/semantics/input.js');
    const el = document.getElementById('once-1645')!;
    mod.input(el);            // a second pass, as a rescan or the other runtime makes
    mod.input(el);
    return {
      wrappers: host.querySelectorAll('.x-input__wrapper').length,
      nested: host.querySelectorAll('.x-input__wrapper > .x-input__wrapper').length,
    };
  });
  expect(r.nested, 'no wrapper inside a wrapper').toBe(0);
  expect(r.wrappers).toBe(1);
});
