/**
 * ═══════════════════════════════════════════════════════════════════════════
 * x-accordion must work with semantic <details> children (#772)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "Doesn't work write a unit test to prove that make fix add to
 * regression."
 *
 * The showcase example is:
 *
 *   <div x-accordion>
 *     <details summary="How do behaviors attach?">…</details>
 *     <details summary="Is there a shadow root?">…</details>
 *   </div>
 *
 * accordion() collects its sections by looking for children carrying
 * `accordion-title` (or the legacy `data-title`). A <details> carries neither,
 * so the section list comes back EMPTY and the behavior builds nothing — the
 * example renders as three unrelated <details> and nothing accordions.
 *
 * That is the semantic-first form, so the behavior has to understand it: an
 * accordion of <details> is exactly what the element is for.
 *
 * ACCORDION means exclusive: opening one closes the others. Testing only
 * "does it open" would pass on three independent <details>, which is the
 * broken state being fixed.
 */

import { test, expect, Page } from '@playwright/test';

const EXAMPLE = `
  <div id="acc" x-accordion>
    <details summary="First question"><p>First answer.</p></details>
    <details summary="Second question"><p>Second answer.</p></details>
    <details summary="Third question"><p>Third answer.</p></details>
  </div>`;

async function render(page: Page) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  await page.evaluate((html) => {
    const host = document.createElement('div');
    host.id = 'acc-area';
    host.innerHTML = html;
    document.body.appendChild(host);
  }, EXAMPLE);
  await page.evaluate(async () => {
    const el = document.getElementById('acc-area');
    if ((window as any).WB?.scan) await (window as any).WB.scan(el, { eager: true });
  });
  await page.waitForTimeout(250);
}

/** Which panels are open, by index. */
async function openStates(page: Page): Promise<boolean[]> {
  return page.evaluate(() => {
    const acc = document.getElementById('acc');
    if (!acc) return [];
    // Whatever the behavior built, an open panel is either an open <details>
    // or an element carrying the behavior's open/active class. Both count:
    // the test is about EXCLUSIVITY, not about which mechanism expresses it.
    const items = [...acc.querySelectorAll('details, .x-accordion__item')];
    return items.map((el) =>
      (el as HTMLDetailsElement).open === true ||
      /(?:^|\s)(?:is-open|x-accordion__item--open|open)(?:\s|$)/.test(el.className));
  });
}

/** Click the i-th header, however the behavior rendered it. */
async function clickHeader(page: Page, i: number) {
  const clicked = await page.evaluate((idx) => {
    const acc = document.getElementById('acc');
    if (!acc) return false;
    const heads = [...acc.querySelectorAll('summary, .x-accordion__header, button')];
    const h = heads[idx] as HTMLElement | undefined;
    if (!h) return false;
    h.click();
    return true;
  }, i);
  expect(clicked, `no clickable header at index ${i}`).toBe(true);
  await page.waitForTimeout(250);
}

test.describe('x-accordion with <details> children', () => {
  test('builds panels from semantic <details> children', async ({ page }) => {
    await render(page);
    const states = await openStates(page);
    expect(
      states.length,
      'x-accordion produced no panels from <details> children — it collects ' +
      'sections by looking for accordion-title, which a <details> does not carry',
    ).toBe(3);
  });

  test('clicking a header opens that panel', async ({ page }) => {
    await render(page);
    await clickHeader(page, 0);
    const states = await openStates(page);
    expect(states[0], 'clicking the first header did not open it').toBe(true);
  });

  test('opening one panel closes the others — it is an accordion', async ({ page }) => {
    await render(page);
    await clickHeader(page, 0);
    await clickHeader(page, 1);
    const states = await openStates(page);
    expect(
      states.filter(Boolean).length,
      `after opening the second panel, ${states.filter(Boolean).length} are open ` +
      `(${JSON.stringify(states)}). An accordion opens one at a time; three ` +
      `independent <details> would leave both open, which is the broken state.`,
    ).toBe(1);
    expect(states[1], 'the second panel should be the open one').toBe(true);
  });
});
