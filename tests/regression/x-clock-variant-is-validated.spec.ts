/**
 * x-clock's variant is checked, not used raw as a class token (#1229).
 *
 * John, 2026-09-30, typing in the playground: the page re-renders on every
 * keystroke, so a half-typed `variant="analogue` reached clock() as
 * "analogue\n    ", and classList.add('x-clock--analogue\n    ') threw
 * InvalidCharacterError. "analogue" is not a variant either: the faces are
 * digital, led and analog, and nothing listed them.
 *
 * John: "if the parameter is wrong then the error should recommend correct
 * info" -- so a wrong value warns, names the valid values and the closest
 * one, and the clock still runs (as digital).
 */
import { test, expect } from '../fixtures/offline';

test('a wrong x-clock variant warns with the valid values and renders digital', async ({ page }) => {
  const warnings: string[] = [];
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/demos/playground.html');
  await page.waitForFunction(() => (window as any).WB?.scan);
  await page.evaluate(async () => {
    const h = document.createElement('div');
    h.innerHTML =
      '<div x-clock id="typed" variant="analogue\n    "></div>' +
      '<div x-clock id="padded" variant=" LED "></div>' +
      '<div x-clock id="good" variant="analog"></div>';
    document.body.prepend(h);
    await (window as any).WB.scan(h, { eager: true });
  });

  expect(errors, 'clock() threw').toEqual([]);
  await expect(page.locator('#typed')).toHaveClass(/(^| )x-clock--digital( |$)/);
  await expect(page.locator('#typed')).toHaveText(/^\d\d:\d\d/);
  // Whitespace and case are not mistakes worth a warning.
  await expect(page.locator('#padded')).toHaveClass(/(^| )x-clock--led( |$)/);
  await expect(page.locator('#good')).toHaveClass(/(^| )x-clock--analog( |$)/);

  const advice = warnings.filter((w) => w.startsWith('[x-clock]'));
  expect(advice, 'one warning, for the one wrong value').toHaveLength(1);
  expect(advice[0]).toContain('variant="analogue"');
  expect(advice[0]).toContain('digital, led, analog');
  expect(advice[0]).toContain('did you mean "analog"');
});

test('removing x-clock stops its timer instead of throwing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/demos/playground.html');
  await page.waitForFunction(() => (window as any).WB?.scan);
  const cleanupError = await page.evaluate(async () => {
    const { clock } = await import('/src/wb-viewmodels/helpers.js');
    const el = document.createElement('div');
    document.body.append(el);
    const cleanup = clock(el);
    try { cleanup(); return ''; } catch (e) { return String(e); }
  });
  expect(cleanupError).toBe('');
  expect(errors).toEqual([]);
});
