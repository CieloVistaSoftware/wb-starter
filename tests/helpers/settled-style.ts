import type { Locator } from '@playwright/test';

/**
 * Read a computed style only after the element's own CSS transitions and
 * animations have finished (#1165).
 *
 * Buttons carry `transition: all 0.2s ease` (src/styles/behaviors/button.css).
 * A variant class lands, the background starts moving from the neutral color
 * toward the variant's, and a single getComputedStyle() taken in that window
 * returns the STARTING color. behaviors-page-full.spec.ts read it once and
 * reported "button variants not distinct: rgb(41, 48, 61) x3". It passed alone,
 * failed under gate load, and aborted the 4.0.5 release.
 *
 * getAnimations() includes CSS transitions, and each one's `finished` promise
 * resolves when it ends: a signal, not a sleep (Law 18), and true at any worker
 * count. Infinite animations never finish, so only finite ones are awaited.
 */
export async function settledStyle(el: Locator, property: string): Promise<string> {
  return el.evaluate(async (node, prop) => {
    const running = (node as Element).getAnimations().filter((a) => {
      const iterations = a.effect?.getTiming().iterations;
      return iterations !== Infinity;
    });
    await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    return getComputedStyle(node as Element).getPropertyValue(prop);
  }, property);
}
