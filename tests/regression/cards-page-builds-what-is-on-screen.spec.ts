import { test, expect } from '../fixtures/offline';
import { wbIdle } from '../base';

/**
 * #987: demos/site/cards.html built all 293 demos on load. The main thread
 * was blocked for 13,680ms in total, 9,110ms of it in one unbroken task --
 * the page could not scroll or answer a click. 4278fcf7 made demo building
 * viewport-first: measured 2026-10-05, 45 of 293 build on load, 745-1007ms
 * blocking in total, the longest task 218-310ms.
 *
 * Held by structure, not by a clock (a timing ceiling flaps on a loaded
 * runner): on load only what is near the screen is built, and a demo far down
 * the page is built when the reader gets to it.
 */
test.describe.configure({ timeout: 90_000 });

const counts = () => {
  const demos = [...document.querySelectorAll('[x-demo]')];
  return { total: demos.length, built: demos.filter((d) => d.querySelector(':scope > .x-demo__grid')).length };
};

test('cards.html builds the demos on screen, not all of them, on load (#987)', async ({ page }) => {
  await page.goto('/demos/site/cards.html');
  await wbIdle(page, { timeout: 60_000 });
  const { total, built } = await page.evaluate(counts);
  expect(total, 'the page must still carry its demos for this to mean anything').toBeGreaterThan(200);
  expect(built, `${built} of ${total} demos were built on load -- the page is building everything again`)
    .toBeLessThan(total / 3);

  // ...and the last one is built when scrolled to.
  await page.evaluate(() => [...document.querySelectorAll('[x-demo]')].pop()!.scrollIntoView());
  await expect.poll(() => page.evaluate(() => !![...document.querySelectorAll('[x-demo]')].pop()!.querySelector(':scope > .x-demo__grid')),
    { timeout: 30_000, message: 'the last demo must build once it is on screen' }).toBe(true);
});
