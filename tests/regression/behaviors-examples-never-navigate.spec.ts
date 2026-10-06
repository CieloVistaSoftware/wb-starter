import { test, expect, type Page } from '../fixtures/offline';
import { openBehaviorsPage } from '../helpers/behaviors-page';

/**
 * NO EXAMPLE ON THE BEHAVIORS PAGE CAN NAVIGATE THE PAGE AWAY (#742)
 * =================================================================
 * Clicking the `x-button variant="link"` example navigated the whole page to
 * docs.html (its VALUE_COMPANIONS href): the gallery, the search and the
 * selection were gone. Nothing stopped any example with an href, or a form
 * that submits, from doing the same.
 *
 * The stage now blocks it and logs "navigation blocked" with the destination,
 * so the reader still learns that the control navigates. Examples that do not
 * navigate are untouched.
 */

async function showRow(page: Page, label: string, variant: string) {
  await openBehaviorsPage(page);
  const row = page.locator(
    `.behaviors-search-results__row[data-label="${label}"][data-variant="${variant}"]`,
  ).first();
  await expect(row).toBeAttached({ timeout: 30_000 });
  await row.evaluate((r) => { const d = r.closest('details'); if (d) (d as HTMLDetailsElement).open = true; });
  await row.click();
  await expect(page.locator('#behaviors-live-example').locator('[x-ready]').first()).toBeAttached({ timeout: 15_000 });
}

const logged = (page: Page) => page.$$eval('#behaviors-live-events-log li', (lis) => lis.map((li) => li.textContent || ''));

test.describe('Behaviors page examples never navigate the page (#742)', () => {
  test('clicking the variant="link" example stays on the page and logs where it would go', async ({ page, context }) => {
    await showRow(page, 'button', 'link');
    const before = page.url();
    const popups: string[] = [];
    context.on('page', (p) => popups.push(p.url()));

    await page.locator('#behaviors-live-example [href]').first().click();
    // The click is handled once the block is logged: wait for that signal
    // (#1516), then check nothing navigated, instead of sleeping 800ms first.
    await expect.poll(() => logged(page)).toContainEqual(expect.stringMatching(/navigation blocked.*would open .*docs\.html/));

    expect(page.url(), 'the page navigated').toBe(before);
    expect(popups, 'the example opened another page').toEqual([]);
  });

  test('a normal button example still fires click and wb:button:click', async ({ page }) => {
    await showRow(page, 'button', 'primary');
    await page.locator('#behaviors-live-example button, #behaviors-live-example [x-button]').first().click();
    await expect.poll(() => logged(page)).toContainEqual(expect.stringMatching(/^wb:button:click/));
    const lines = await logged(page);
    expect(lines.some((l) => /^click/.test(l)), 'the native click must still be logged').toBe(true);
    expect(lines.some((l) => /navigation blocked/.test(l)), 'nothing was blocked').toBe(false);
  });

  test('a form that would submit stays on the page and logs where it would go', async ({ page }) => {
    await showRow(page, 'button', 'primary');
    const before = page.url();
    await page.evaluate(() => {
      const stage = document.getElementById('behaviors-live-example')!;
      stage.insertAdjacentHTML('beforeend',
        '<form id="form742" action="/somewhere-else"><button id="submit742" type="submit">Go</button></form>');
    });
    await page.locator('#submit742').click();
    // Handled once logged (#1516); then the URL must not have changed.
    await expect.poll(() => logged(page)).toContainEqual(expect.stringMatching(/navigation blocked.*would submit to .*somewhere-else/));
    expect(page.url(), 'the form submission navigated the page').toBe(before);
  });
});
