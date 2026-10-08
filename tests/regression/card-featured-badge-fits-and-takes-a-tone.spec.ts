import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * THE FEATURED BADGE FITS, TAKES A TONE, AND THE META BLOCK CLEARS THE EDGE (#1006)
 * ===============================================================================
 * John, on the `article featured` sample: "how do we set featured text and
 * change colors and ensure it fits and wraps", and "This is not following
 * layout specs." At the time the badge had 2.2px of horizontal padding at 11px
 * with letter-spacing, so FEATURED's last letter sat ~1.4px from the edge and
 * read as cut off; every badge was the same yellow; and the card's
 * small/time/address stack sat hard against the header edge.
 *
 * All three are fixed on main; nothing held them. This does.
 *
 * See it by hand: open Behaviors (?page=behaviors), pick card and choose a
 * featuredTone row. Before: a cramped yellow FEATURED, its last letter at the
 * badge edge, whatever the tone. Now: 1rem either side of the word, in the
 * chosen tone.
 */

type Badge = { text: string; inset: number; bg: string } | null;

async function render(page: import('@playwright/test').Page, attrs: string) {
  await page.evaluate(async (a) => {
    const host = document.createElement('div');
    host.style.width = '360px';
    host.innerHTML = `<article ${a} title="Ridge loop" subtitle="Moderate" category="Trails" date="2026-08-20" author="Ada Lovelace">Body text.</article>`;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    (window as any).__wb961Host = host;
  }, attrs);
  await settlePage(page, { timeout: 5000 });
  return page.evaluate(() => {
    const host = (window as any).__wb961Host as HTMLElement;
    const card = host.querySelector('article')!;
    const mark = card.querySelector('mark');
    let badge: Badge = null;
    if (mark) {
      const box = mark.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(mark);
      const ink = range.getBoundingClientRect();
      badge = {
        text: (mark.textContent || '').trim(),
        inset: Math.min(ink.left - box.left, box.right - ink.right),
        bg: getComputedStyle(mark).backgroundColor,
      };
    }
    const c = card.getBoundingClientRect();
    const meta = [...card.querySelectorAll('small, time, address')].map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.left - c.left, c.right - r.right);
    });
    host.remove();
    return { badge, metaInset: meta.length ? Math.min(...meta) : null };
  });
}

test.describe('card featured badge (#1006)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });
  });

  test('the word sits at least 1rem from either side of the badge', async ({ page }) => {
    const { badge } = await render(page, 'featured');
    expect(badge, 'featured rendered no badge').not.toBeNull();
    expect(badge!.text).toMatch(/featured/i);
    expect(badge!.inset, 'the badge text is cramped against its edge (§13)').toBeGreaterThanOrEqual(15.5);
  });

  test('featured="…" prints that wording, and still fits', async ({ page }) => {
    const { badge } = await render(page, 'featured="Deal of the week"');
    expect(badge!.text).toBe('Deal of the week');
    expect(badge!.inset).toBeGreaterThanOrEqual(15.5);
  });

  test('featuredTone picks the badge colour', async ({ page }) => {
    const tones = ['success', 'warning', 'danger', 'info'];
    const colours = new Set<string>();
    for (const t of tones) {
      const { badge } = await render(page, `featured featuredTone="${t}"`);
      colours.add(badge!.bg);
    }
    expect(colours.size, `the ${tones.length} tones rendered ${colours.size} distinct badge colours`).toBe(tones.length);
  });

  test('the category/date/author block clears the card edge by 1rem', async ({ page }) => {
    const { metaInset } = await render(page, 'featured');
    expect(metaInset, 'the card rendered no meta block').not.toBeNull();
    expect(metaInset!, 'the meta block sits against the card edge (§13)').toBeGreaterThanOrEqual(15.5);
  });
});
