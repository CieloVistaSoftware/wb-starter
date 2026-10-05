/**
 * AUTOSCROLL TESTS EVERY BEHAVIOR IN THE NAV
 * ==========================================
 * #1536 - John: "Change autoscroll so it tests every behavior in the nav."
 *
 * AutoScroll used to show each entry and report nothing, and from #1004 it
 * toured only the groups already open. Now it opens every group, visits every
 * entry from the top, and reports each one as passed or failed: an entry fails
 * when something is logged through logError() while it is on screen, or when
 * it never sends wb:layout-settled.
 *
 * This replaces autoscroll-honours-expanded-groups.spec.ts, which pinned the
 * #1004 rule that John's new instruction retires.
 *
 * See it by hand: Open Behaviors (?page=behaviors) and click AutoScroll in the
 * header. Before: it toured only the groups you had opened and ended without a
 * word. Now: it opens every group, walks all 1,333 entries and ends with
 * "Tested all 1333 entries: N passed, M failed", naming each failure.
 */

import { test, expect } from '../fixtures/offline';

async function openBehaviors(page: any) {
  // Delay 0: the tour advances as soon as each example settles.
  await page.addInitScript(() => { try { localStorage.setItem('wb:autoscroll-delay', '0'); } catch { /* not fatal */ } });
  await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 100,
    undefined,
    { timeout: 30_000 }
  );
  await page.locator('#behaviors-autoscroll').waitFor({ state: 'attached', timeout: 20_000 });
}

test.describe('AutoScroll tests every behavior in the nav (#1536)', () => {
  test('opens every group even when one was already open', async ({ page }) => {
    await openBehaviors(page);

    const result = await page.evaluate(async () => {
      const groups = [...document.querySelectorAll('#behaviors-search-results details')] as HTMLDetailsElement[];
      for (const g of groups) g.open = false;
      groups[0].open = true;
      await new Promise((r) => setTimeout(r, 300));

      const btn = document.getElementById('behaviors-autoscroll') as HTMLElement;
      btn.click();
      await new Promise((r) => setTimeout(r, 1500));
      const openAfter = groups.filter((d) => d.open).length;
      btn.click(); // stop the tour
      return { total: groups.length, openAfter };
    });

    expect(result.total, 'the nav has no groups to test').toBeGreaterThan(1);
    expect(result.openAfter, 'AutoScroll must open every group, not only the one that was open').toBe(result.total);
  });

  test('reports every entry, and fails the one that logged an error', async ({ page }) => {
    await openBehaviors(page);

    // A handful of entries keeps the tour short: the nav is whatever the
    // search leaves, and AutoScroll tests all of it.
    await page.locator('#behaviors-search').fill('avatar');
    await page.waitForFunction(() => {
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')];
      return rows.length > 1 && rows.every((r) => /avatar/i.test(r.textContent || '') || /avatar/i.test((r as HTMLElement).dataset.browseToken || ''));
    }, undefined, { timeout: 10_000 });

    const plan = await page.evaluate(() => {
      for (const d of document.querySelectorAll('#behaviors-search-results details')) (d as HTMLDetailsElement).open = true;
      const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
      // Fail exactly the second entry: when it settles, announce an error the
      // same way error-logger.js does.
      let settles = 0;
      document.addEventListener('wb:layout-settled', () => {
        settles += 1;
        if (settles === 2) window.dispatchEvent(new CustomEvent('wb:error-logged', { detail: { message: 'injected failure' } }));
      });
      (document.getElementById('behaviors-autoscroll') as HTMLElement).click();
      return { total: rows.length };
    });

    const report = page.locator('.behaviors-live__autoscroll-report');
    await expect(report).toBeVisible({ timeout: 60_000 });
    await expect(report).toHaveAttribute('data-total', String(plan.total));
    await expect(report).toHaveAttribute('data-tested', String(plan.total));
    await expect(report).toHaveAttribute('data-failed', '1');
    await expect(report).toContainText(`Tested all ${plan.total} entries: ${plan.total - 1} passed, 1 failed`);
    await expect(report.locator('.behaviors-live__autoscroll-report-why')).toHaveText('injected failure');
  });

  test('logError() announces every error, repeats included', async ({ page }) => {
    await openBehaviors(page);

    const heard = await page.evaluate(async () => {
      const messages: string[] = [];
      window.addEventListener('wb:error-logged', (e: any) => messages.push(e.detail.message));
      document.documentElement.setAttribute('data-x-expected-errors', '');
      const { logError } = await import('/src/core/error-logger.js');
      await logError('autoscroll spec: same fault');
      await logError('autoscroll spec: same fault');
      return messages;
    });

    expect(heard, 'a repeat merges into one row but must still be announced').toEqual([
      'autoscroll spec: same fault',
      'autoscroll spec: same fault',
    ]);
  });
});
