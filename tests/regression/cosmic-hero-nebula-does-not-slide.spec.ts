import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/offline';

/**
 * The cosmic hero's nebula layer stays put (#1595).
 *
 * Every card hero slides its ::before sideways (x-cardhero-sheen,
 * translateX(-30%) to 30%). That sheen layer is inset -60%, so its edges never
 * enter the hero. card.js adds `x-hero` to every card hero, and when the
 * runtime also adds the declared modifier `x-hero--cosmic`, the rule
 * `.x-hero.x-hero--cosmic::before` (#1222) takes over the same layer: inset 0,
 * nebula glows, and the slide still running. A hero-sized layer moving ±30% of
 * its width shows its edge, so a hard band swept across the home page hero.
 *
 * Measured on main 2818224 before the fix: the home page hero's ::before had
 * transform matrix(1, 0, 0, 1, 164.252, 0) on a 1200px hero.
 *
 * Oracle:
 *   - a card hero carrying x-hero--cosmic: ::before animation-name is none and
 *     its transform is none, whether the runtime added the class or not
 *     (the class is added here when the runtime has not, because whether it
 *     does depends on stylesheet load order -- #1595 notes the playground)
 *   - a default card hero still runs the sheen: the fix must not switch off
 *     the sheen everywhere
 *   - the home page hero, the reported case, does not move
 */

type Layer = { classes: string; animation: string; transform: string };

async function readLayer(page: Page, selector: string): Promise<Layer> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    const before = getComputedStyle(el, '::before');
    return { classes: el.className, animation: before.animationName, transform: before.transform };
  }, selector);
}

test.describe('cosmic hero nebula does not slide (#1595)', () => {
  test('a cosmic card hero with x-hero--cosmic keeps its ::before still; a default one keeps the sheen', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    await page.evaluate(async () => {
      const host = document.createElement('div');
      host.id = 'cosmic-slide';
      host.innerHTML =
        '<section id="hero-cosmic" x-cardhero variant="cosmic" title="Cosmic"></section>' +
        '<section id="hero-default" x-cardhero title="Default"></section>';
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      // Model the home page state whichever way the runtime decided (#1595).
      document.getElementById('hero-cosmic')!.classList.add('x-hero--cosmic');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });

    const cosmic = await readLayer(page, '#hero-cosmic');
    expect(cosmic.classes, 'the cosmic hero carries both classes the rule needs').toMatch(/\bx-hero\b.*\bx-hero--cosmic\b|\bx-hero--cosmic\b.*\bx-hero\b/);
    expect(cosmic.animation, 'the hero-sized nebula layer runs no slide animation').toBe('none');
    expect(cosmic.transform, 'the nebula layer is not shifted sideways').toBe('none');

    const plain = await readLayer(page, '#hero-default');
    expect(plain.animation, 'a default card hero still runs its sheen').toBe('x-cardhero-sheen');
  });

  test('the home page hero does not move', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[x-cardhero]').first();
    await expect(hero).toHaveClass(/\bx-hero\b/, { timeout: 20000 }); // #969: no x-card--hero

    const first = await readLayer(page, '[x-cardhero]');
    // Without x-hero--cosmic the layer is the oversized sheen, which is meant
    // to move; the band needs both classes (#1595).
    test.skip(!/\bx-hero--cosmic\b/.test(first.classes), `home hero has no x-hero--cosmic: ${first.classes}`);
    expect(first.animation, 'the home hero nebula runs no slide animation').toBe('none');
    // Only an animation or a transition can move a ::before that no script
    // touches, so "it does not move" is checked as "nothing is animating it"
    // rather than by watching it for 1.5s (#1516).
    const moving = await page.evaluate(() => {
      const hero = document.querySelector('[x-cardhero]');
      return document.getAnimations()
        .filter((a) => {
          const effect = a.effect as KeyframeEffect | null;
          return effect?.target === hero && effect?.pseudoElement === '::before' && a.playState !== 'finished';
        })
        .map((a) => (a as CSSAnimation).animationName || (a as CSSTransition).transitionProperty || a.constructor.name);
    });
    expect(moving, 'the home hero ::before is being animated').toEqual([]);
  });
});
