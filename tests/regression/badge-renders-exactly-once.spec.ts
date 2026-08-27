import { test, expect } from '@playwright/test';

/**
 * A badge= value renders in exactly one place (#884).
 *
 * `<article x-cardproduct badge="SALE">` painted SALE twice: cardproduct built
 * its own overlay span on the figure, then composeCard().buildStructure() ran
 * afterwards and unconditionally appended the shared header badge. Two renders
 * of one attribute -- the same defect shape as a duplicate declaration.
 *
 * Asserted over EVERY card behavior, not just cardproduct: the collision came
 * from two independent builders neither of which knew about the other, and any
 * card that grows its own badge rendering would reintroduce it.
 */

const CARDS = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 'cardprofile',
  'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct', 'cardnotification',
  'cardfile', 'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardoverlay', 'cardportfolio',
];

const BADGE = 'ONCEONLY';

type Row = { name: string; count: number; where: string[] };

test.describe('badge= renders exactly once', () => {
  let rows: Row[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    rows = await page.evaluate(async ({ list, badge }) => {
      const out: any[] = [];
      for (const name of list) {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:0;left:0;width:640px;z-index:99999';
        host.innerHTML =
          `<article id="b-${name}" x-${name} badge="${badge}" title="Headphones" ` +
          `price="$199" value="42" label="Sales" message="Fine." ` +
          `image="https://placehold.co/600x400" content="Body."></article>`;
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const el = document.getElementById(`b-${name}`) as HTMLElement;
        // Count TEXT-BEARING nodes, so a badge wrapped in a span inside a span
        // is one render, not two.
        const hits: string[] = [];
        el.querySelectorAll('*').forEach((n) => {
          const node = n as HTMLElement;
          if (node.children.length > 0) return;
          if ((node.textContent || '').trim() !== badge) return;
          const parent = node.parentElement;
          hits.push(`${parent ? parent.tagName.toLowerCase() : '?'} > ${node.tagName.toLowerCase()}`);
        });
        out.push({ name, count: hits.length, where: hits });
        host.remove();
      }
      return out;
    }, { list: CARDS, badge: BADGE });

    await page.close();
  });

  test('the sweep actually ran', () => {
    expect(rows.length, 'no cards were measured').toBe(CARDS.length);
  });

  test('no card renders the same badge twice', () => {
    const doubled = rows
      .filter((r) => r.count > 1)
      .map((r) => `x-${r.name} rendered badge ${r.count}x (${r.where.join(', ')})`);
    expect(doubled, 'one badge= value, one place it appears').toEqual([]);
  });

  test('cardproduct still shows its badge at all', () => {
    // The fix suppresses the header badge. Suppressing BOTH would also make
    // the assertion above pass, so prove the overlay survived.
    const prod = rows.find((r) => r.name === 'cardproduct')!;
    expect(prod.count, 'cardproduct lost its badge entirely').toBe(1);
    expect(prod.where.join(''), 'the surviving badge should be the figure overlay')
      .toContain('span');
  });
});
