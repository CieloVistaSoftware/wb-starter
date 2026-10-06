import { test, expect, type Page } from '../fixtures/offline';

/**
 * #1110 -- John: "When clicked on, put a green glow."
 *
 * The API and Docs toggles in the Behaviors header used ONE rule for :hover and
 * for details[open], so the button that opened a panel looked exactly like a
 * button the pointer was merely resting on. Open now carries a green glow taken
 * from the theme's --success-color; hover does not.
 *
 * Driven by real clicks, as the reader does it, and measured on the computed
 * style of the button -- not by reading the stylesheet.
 */

const LIST = '#behaviors-search-results';
const ROW = '.behaviors-search-results__row';

async function showCard(page: Page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.locator(`${LIST} ${ROW}`).count(), { timeout: 25_000 }).toBeGreaterThan(0);
  await page.waitForSelector('#behaviors-workspace[x-ready]', { timeout: 20_000 });
  await page.locator(`${LIST} ${ROW}[data-browse-token="x-card"]`).first().click();
  await expect(page.locator('#behaviors-live-api .behaviors-live__api-summary')).toBeVisible({ timeout: 15_000 });
}

/** The success colour as the page resolves it, in the same format getComputedStyle uses. */
const successColor = (page: Page) => page.evaluate(() => {
  const probe = document.createElement('span');
  probe.style.color = 'var(--success-color)';
  document.body.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
});

const look = (page: Page, sel: string) => page.locator(sel).evaluate((el) => {
  const cs = getComputedStyle(el);
  return { color: cs.color, shadow: cs.boxShadow };
});

/**
 * look(), once the toggle's own transitions have finished (#1516): the state
 * the CSS is moving to, not a frame of the 140ms transition a 250ms sleep
 * guessed past. getAnimations() flushes style first, so a transition the last
 * action started is included.
 */
const settledLook = async (page: Page, sel: string) => {
  await page.locator(sel).evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
  });
  return look(page, sel);
};

for (const which of ['api', 'doc'] as const) {
  const SUMMARY = which === 'api'
    ? '#behaviors-live-api .behaviors-live__api-summary'
    : '.behaviors-live__doc-summary';

  test(`${which.toUpperCase()} toggle: open glows green, hover does not, closing removes it`, async ({ page }) => {
    await showCard(page);
    const green = await successColor(page);
    const summary = page.locator(SUMMARY).first();

    await summary.hover();
    const hovered = await settledLook(page, SUMMARY);
    expect(hovered.shadow, 'hover alone must not glow -- that was the whole problem').toBe('none');

    await summary.click();
    await page.mouse.move(0, 0); // judge OPEN, not open-and-hovered
    const open = await settledLook(page, SUMMARY);
    expect(open.shadow, 'an open panel\'s toggle glows').not.toBe('none');
    expect(open.color, 'and its text is the theme\'s success green').toBe(green);
    expect(open.color, 'open must not look like hover').not.toBe(hovered.color);

    await summary.click();
    await page.mouse.move(0, 0);
    expect((await settledLook(page, SUMMARY)).shadow, 'closing removes the glow').toBe('none');
  });
}
