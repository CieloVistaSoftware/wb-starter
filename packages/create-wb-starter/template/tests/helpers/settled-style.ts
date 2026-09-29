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

/**
 * The element's rendered width as a percentage of its parent's content box,
 * read once its own transitions and animations have settled (#779).
 *
 * A progress fill used to carry `style="width: 40%"`, and specs read that
 * attribute. No behavior writes a style attribute any more -- the fill's
 * width is a generated stylesheet rule -- so the attribute is empty and the
 * only honest question is the one the attribute stood in for: how much of
 * the track does the fill cover? The grow-in animation and width transition
 * are awaited first (the same signal settledStyle uses), or a read taken
 * mid-flight would report a fraction of the value.
 */
export async function settledWidthPercent(el: Locator): Promise<number> {
  return el.evaluate(async (node) => {
    const running = (node as Element).getAnimations().filter((a) => {
      const iterations = a.effect?.getTiming().iterations;
      return iterations !== Infinity;
    });
    await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    const parent = (node as Element).parentElement as HTMLElement;
    const cs = getComputedStyle(parent);
    const inner = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return ((node as Element).getBoundingClientRect().width / inner) * 100;
  });
}
