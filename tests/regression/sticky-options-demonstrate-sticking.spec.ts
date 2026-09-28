/**
 * A STICKY OPTION SHOWS ITSELF STICKING
 * =====================================
 * #750 -- John, on header · sticky: "I can't find any sticky behavior, how do
 * i see that?" The class was applied (x-header--sticky, position: sticky) but
 * the stage never scrolls, so nothing could ever be seen to stick. Options the
 * schema marks "demo": "scroll" render in a scroll box; this scrolls it and
 * measures that the element really stays put while the content moves.
 */
import { test, expect, Page } from '../fixtures/offline';

async function showRow(page: Page, label: string, prop: string) {
  const row = page.locator(`.behaviors-search-results__row[data-label="${label}"][data-prop="${prop}"]`).first();
  await expect(row).toBeAttached({ timeout: 30_000 });
  const group = page.locator('#behaviors-search-results details', { has: row });
  if (await group.count() && !(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
    await group.first().locator(':scope > summary').click();
  }
  await row.click();
  const box = page.locator('#behaviors-live-example');
  await expect(box.locator(':scope > [x-ready]').first()).toBeAttached();
  return box;
}

/** The element's offset from the box's top (or bottom) edge after scrolling to `at`. */
function offsetAfterScroll(box: import('@playwright/test').Locator, at: number, edge: 'top' | 'bottom') {
  return box.evaluate(async (el, [y, which]) => {
    el.scrollTop = y as number;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const target = el.firstElementChild!.getBoundingClientRect();
    const frame = el.getBoundingClientRect();
    const border = parseFloat(getComputedStyle(el).borderTopWidth) || 0;
    return which === 'top'
      ? Math.round(target.top - frame.top - border)
      : Math.round(frame.bottom - border - target.bottom);
  }, [at, edge] as const);
}

test.beforeEach(async ({ page }) => { await page.goto('/?page=behaviors'); });

test('header · sticky: the header stays pinned to the top while the box scrolls', async ({ page }) => {
  const box = await showRow(page, 'header', 'sticky');
  await expect(box).toHaveClass(/behaviors-live__example--scroll/);
  const room = await box.evaluate((el) => el.scrollHeight - el.clientHeight);
  expect(room, 'the box can actually scroll').toBeGreaterThan(100);
  // Scrolled past its starting position, it sits at the top edge -- twice, at
  // two different scroll positions, which is what "stays put" means.
  expect(await offsetAfterScroll(box, 200, 'top')).toBe(0);
  expect(await offsetAfterScroll(box, 260, 'top')).toBe(0);
});

test('footer · sticky: the footer stays pinned to the bottom while the box scrolls', async ({ page }) => {
  const box = await showRow(page, 'footer', 'sticky');
  await expect(box).toHaveClass(/behaviors-live__example--scroll/);
  expect(await offsetAfterScroll(box, 0, 'bottom')).toBe(0);
  expect(await offsetAfterScroll(box, 40, 'bottom')).toBe(0);
});

test('an option that shows at rest keeps the ordinary stage', async ({ page }) => {
  const box = await showRow(page, 'dialog', 'size');
  await expect(box).not.toHaveClass(/behaviors-live__example--scroll/);
});
