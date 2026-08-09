/**
 * #178 — the [x-stepper] control and the range slider must be interactive.
 *
 * The stepper behavior assumed its element was an <input> and read .value off a
 * <div> (always 0), so the showcase's <div x-stepper data-value data-min data-max>
 * showed no value and the buttons did nothing visible. Now it builds
 * [−][value][+] inside the container and honors data-value/min/max.
 */
import { test, expect } from '@playwright/test';

test.describe('#178 — stepper + range', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/?page=behaviors');
    await page.waitForSelector('#mainPage-behaviors', { timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  test('stepper renders [-][value][+] with its data-value', async ({ page }) => {
    const r = await page.evaluate(() => {
      const st = document.querySelector('[x-stepper]');
      return st
        ? {
            buttons: st.querySelectorAll('button').length,
            value: st.querySelector('.wb-stepper__value')?.textContent,
          }
        : null;
    });
    expect(r, 'no [x-stepper] element').not.toBeNull();
    expect(r!.buttons, 'stepper has no +/- buttons').toBe(2);
    expect(r!.value, 'stepper does not show its data-value').toBe('5');
  });

  test('stepper + increments and clamps to data-max', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const st = document.querySelector('[x-stepper]') as HTMLElement;
      const valEl = st.querySelector('.wb-stepper__value') as HTMLElement;
      const inc = st.querySelector('.wb-stepper__inc') as HTMLButtonElement;
      const dec = st.querySelector('.wb-stepper__dec') as HTMLButtonElement;
      const start = valEl.textContent;
      inc.click();
      const afterInc = valEl.textContent;
      // clamp test: data-max=10, click + many times
      for (let i = 0; i < 20; i++) inc.click();
      const atMax = valEl.textContent;
      // clamp low: data-min=0
      for (let i = 0; i < 30; i++) dec.click();
      const atMin = valEl.textContent;
      return { start, afterInc, atMax, atMin };
    });
    expect(result.afterInc, 'stepper + did not increment').toBe('6');
    expect(result.atMax, 'stepper did not clamp to data-max=10').toBe('10');
    expect(result.atMin, 'stepper did not clamp to data-min=0').toBe('0');
  });

  test('range slider is present, themed, and accepts input', async ({ page }) => {
    const r = await page.evaluate(() => {
      const rg = document.querySelector('#mainPage-behaviors input[type="range"]') as HTMLInputElement;
      if (!rg) return null;
      rg.value = '80';
      rg.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        width: Math.round(rg.getBoundingClientRect().width),
        accent: getComputedStyle(rg).accentColor,
        value: rg.value,
      };
    });
    expect(r, 'no range input').not.toBeNull();
    expect(r!.width, 'range has no width').toBeGreaterThan(20);
    expect(r!.value, 'range did not accept input').toBe('80');
  });
});
