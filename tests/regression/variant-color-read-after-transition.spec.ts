import { test, expect } from '@playwright/test';
import { settledStyle } from '../helpers/settled-style';

/**
 * A variant's color is read after its transition, not during it (#1165).
 *
 * behaviors-page-full.spec.ts read a button's background once, as the variant
 * class landed, while `transition: all 0.2s` was still moving it away from the
 * neutral color. Primary, secondary and ghost all read rgb(41, 48, 61), and the
 * 4.0.5 release gate aborted. It passed alone and failed under load, because
 * 0.2s is only sometimes long enough to lose the race.
 *
 * This makes the race certain instead of occasional: the transition is
 * stretched to 3s, so a read taken at class-landing time is ALWAYS mid-flight.
 * Then:
 *   - the fixture must really be mid-transition when the class lands, or the
 *     test would pass while proving nothing (the #1091 shape);
 *   - settledStyle() must return three distinct variant colors;
 *   - and the settled colors must differ from the neutral start color.
 */
const VARIANTS = ['primary', 'secondary', 'ghost'];

test.describe('variant colors are read after the transition settles (#1165)', () => {
  test('settledStyle() sees distinct button variants even with a 3s transition', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    // A stylesheet, not an inline style or !important: only duration changes,
    // and a higher-specificity selector wins in the cascade.
    await page.addStyleTag({ content: 'html body #variant-race button.x-button { transition-duration: 3s; }' });

    const colors: string[] = [];
    let neutral = '';
    let midFlight = 0;
    for (const v of VARIANTS) {
      await page.evaluate(() => { document.getElementById('variant-race')?.remove(); });
      await page.evaluate(() => {
        const host = document.createElement('div');
        host.id = 'variant-race';
        host.innerHTML = `<button x-button>Neutral</button>`;
        document.body.appendChild(host);
        return (window as any).WB.scan(host, { eager: true });
      });
      const btn = page.locator('#variant-race button.x-button');
      await expect(btn).toHaveCount(1);
      // Start from a known neutral: the behavior may apply a default variant
      // class on scan, which would leave "primary" nothing to transition from.
      await btn.evaluate((node) => {
        node.removeAttribute('variant');
        node.className = node.className.replace(/\bx-button--\S+/g, '').trim();
      });
      const start = await settledStyle(btn, 'background-color');
      if (!neutral) neutral = start;

      // Land the variant the way the runtime does, then look immediately.
      const running = await btn.evaluate((node, variant) => {
        node.setAttribute('variant', variant);
        node.className = node.className.replace(/\bx-button--\S+/g, '').trim();
        node.classList.add(`x-button--${variant}`);
        return (node as Element).getAnimations().length;
      }, v);
      if (running > 0) midFlight++;

      colors.push(await settledStyle(btn, 'background-color'));
    }

    expect(midFlight, 'the fixture never started a transition, so this proves nothing').toBe(VARIANTS.length);
    expect(new Set(colors).size, `settled variant colors not distinct: ${colors.join(' | ')}`).toBe(VARIANTS.length);
    const stuck = colors.filter((c) => c === neutral);
    expect(stuck, `a variant still reads the neutral start color ${neutral}`).toEqual([]);
  });
});
