import { test, expect } from '../fixtures/offline';

/**
 * A Behaviors-page group's description is inside its group's box (#1933).
 *
 * John, 2026-10-16: "Why is the layout like this?" The border was on the
 * <details>, and the one-line description (a sibling of it in the <li>) drew
 * below the border, against the next group's box: details y 64..118,
 * description y 118..142. The <li> now draws the border.
 */
test('every collapsed group description lies inside a bordered box with its name', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pages/behaviors.html');
  await page.waitForSelector('.behaviors-search-results__desc--group', { state: 'attached', timeout: 20000 });
  // An open group hides its line (behaviors.css), and the first group may be open.

  const bad = await page.evaluate(() => [...document.querySelectorAll('.behaviors-search-results__group')]
    .filter((li) => li.querySelector('.behaviors-search-results__desc--group') && !li.querySelector('details')!.open)
    .map((li) => {
      const desc = li.querySelector('.behaviors-search-results__desc--group')!.getBoundingClientRect();
      // The nearest element that draws a border around the description.
      let box: Element | null = li.querySelector('.behaviors-search-results__desc--group');
      while (box && parseFloat(getComputedStyle(box).borderBottomWidth) === 0) box = box.parentElement;
      const b = box!.getBoundingClientRect();
      const name = li.querySelector('summary')!.getBoundingClientRect();
      const inside = (r: DOMRect) => r.top >= b.top - 1 && r.bottom <= b.bottom + 1;
      return inside(desc) && inside(name) && li.contains(box) ? null : li.textContent!.slice(0, 40);
    })
    .filter(Boolean));
  expect(bad, 'groups whose description is outside their box').toEqual([]);
});
