/**
 * A wrong x-clock variant says which values work (#1229).
 *
 * clock-variant-normalized.spec.ts covers the fix itself: whitespace, case,
 * "analogue", the digital fallback and the teardown. This covers what John
 * asked for on top of it: "if the parameter is wrong then the error should
 * recommend correct info". A value that is not a clock face warns, names the
 * valid values and the closest one; a value that only needed trimming, or the
 * accepted "analogue", does not warn at all.
 */
import { test, expect } from '../fixtures/offline';

test('a wrong x-clock variant warns with the valid values and the closest one', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning' && m.text().startsWith('[x-clock]')) warnings.push(m.text()); });

  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML =
      '<div id="close" x-clock variant="leds"></div>' +
      '<div id="far" x-clock variant="sundial"></div>' +
      '<div id="typed" x-clock variant="analogue\n    "></div>' +
      '<div id="padded" x-clock variant=" LED "></div>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  });

  await expect(page.locator('#close')).toHaveClass(/(^| )x-clock--digital( |$)/);
  await expect(page.locator('#far')).toHaveClass(/(^| )x-clock--digital( |$)/);
  expect(warnings, 'one warning per wrong value, none for values that only needed trimming').toHaveLength(2);

  const close = warnings.find((w) => w.includes('variant="leds"'));
  expect(close).toContain('use one of: digital, led, analog');
  expect(close).toContain('did you mean "led"');

  const far = warnings.find((w) => w.includes('variant="sundial"'));
  expect(far).toContain('use one of: digital, led, analog');
  expect(far).not.toContain('did you mean');
});
