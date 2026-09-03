/**
 * THE BEHAVIORS LIST GROUPS REPEATED NAMES
 * ========================================
 * #995 — John: "put same named links into dropdown, the use must expand it
 * first to view the items in the list."
 *
 * The list emitted one flat row per option, so a behavior with several options
 * repeated its own name down the left column — x-avatar alone filled twelve of
 * 603 rows, and scrolling was dominated by repetition rather than by distinct
 * behaviors. Grouped, the whole framework fits in a few screens.
 *
 * Each assertion below is tied to a requirement that can actually regress:
 * collapsed by default, expandable, single-option behaviors left alone, search
 * still showing its hits, and keyboard navigation never landing on a row
 * hidden inside a closed group.
 */

import { test, expect } from '@playwright/test';

const LIST = '#behaviors-search-results';
const ROW = '.behaviors-search-results__row';

async function listReady(page) {
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await expect
    .poll(() => page.locator(`${LIST} details`).count(), { timeout: 25_000 })
    .toBeGreaterThan(0);
}

test.describe('behaviors list is grouped (#995)', () => {
  test('groups are collapsed until the reader expands one', async ({ page }) => {
    await listReady(page);

    const stats = await page.evaluate(({ LIST, ROW }) => {
      const l = document.querySelector(LIST)!;
      const rows = Array.from(l.querySelectorAll(ROW)) as HTMLElement[];
      const groups = Array.from(l.querySelectorAll('details')) as HTMLDetailsElement[];
      return {
        groups: groups.length,
        open: groups.filter((d) => d.open).length,
        total: rows.length,
        visible: rows.filter((r) => r.offsetParent !== null).length,
      };
    }, { LIST, ROW });

    expect(stats.groups, 'the list should contain grouped behaviors').toBeGreaterThan(10);
    expect(stats.open, 'every group must start collapsed — John: "expand it first"').toBe(0);
    // The point of the change: far fewer rows on screen than exist.
    expect(
      stats.visible,
      `collapsed, only ${stats.visible} of ${stats.total} rows should be on screen`
    ).toBeLessThan(stats.total / 2);
  });

  test('expanding a group reveals exactly its own options', async ({ page }) => {
    await listReady(page);

    const result = await page.evaluate(async ({ LIST, ROW }) => {
      const l = document.querySelector(LIST)!;
      const visible = () =>
        (Array.from(l.querySelectorAll(ROW)) as HTMLElement[]).filter((r) => r.offsetParent !== null)
          .length;
      const before = visible();
      const d = l.querySelector('details') as HTMLDetailsElement;
      const own = d.querySelectorAll(ROW).length;
      (d.querySelector('summary') as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 400));
      return { before, after: visible(), own, opened: d.open };
    }, { LIST, ROW });

    expect(result.opened).toBe(true);
    expect(
      result.after - result.before,
      'expanding must reveal that group\'s options and nothing else'
    ).toBe(result.own);
  });

  test('a behavior with one option stays a plain row, not a dropdown', async ({ page }) => {
    await listReady(page);

    // Nothing to collapse when a name appears once — wrapping it would add a
    // click for no benefit.
    const singles = await page.evaluate(({ LIST, ROW }) => {
      const l = document.querySelector(LIST)!;
      return Array.from(l.children).filter(
        (li) => !li.querySelector('details') && li.querySelector(ROW)
      ).length;
    }, { LIST, ROW });

    expect(singles, 'single-option behaviors should render as plain rows').toBeGreaterThan(0);
  });

  test('searching opens the groups holding the matches', async ({ page }) => {
    await listReady(page);

    const result = await page.evaluate(async ({ LIST, ROW }) => {
      const input = document.getElementById('behaviors-search') as HTMLInputElement;
      input.value = 'tooltip';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 700));
      const l = document.querySelector(LIST)!;
      const groups = Array.from(l.querySelectorAll('details')) as HTMLDetailsElement[];
      const rows = Array.from(l.querySelectorAll(ROW)) as HTMLElement[];
      return {
        groups: groups.length,
        closed: groups.filter((d) => !d.open).length,
        visible: rows.filter((r) => r.offsetParent !== null).length,
      };
    }, { LIST, ROW });

    // A search that reports hits and then hides them behind a collapsed parent
    // is worse than no search.
    expect(result.closed, 'a group containing a match must not stay collapsed').toBe(0);
    expect(result.visible, 'matches must be on screen').toBeGreaterThan(0);
  });

  test('keyboard navigation never lands on a row inside a collapsed group', async ({ page }) => {
    await listReady(page);

    const offScreen = await page.evaluate(async ({ LIST, ROW }) => {
      const input = document.getElementById('behaviors-search') as HTMLInputElement;
      input.focus();
      const hidden: string[] = [];
      for (let i = 0; i < 8; i++) {
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
        );
        await new Promise((r) => setTimeout(r, 150));
        const cur = document.querySelector(`${LIST} ${ROW}[aria-current="true"]`) as HTMLElement | null;
        if (cur && cur.offsetParent === null) hidden.push(cur.textContent?.trim() ?? '(row)');
      }
      return hidden;
    }, { LIST, ROW });

    expect(
      offScreen,
      offScreen.length
        ? `arrowing selected ${offScreen.length} row(s) hidden inside a collapsed group: ${offScreen.join(', ')}`
        : ''
    ).toEqual([]);
  });
});
