import { test, expect } from '@playwright/test';

/**
 * A card header always emits its parts in the same order.
 *
 * John, on the glass-card markup: "note there is a specific order here which
 * should be used for all styling."
 *
 *     <header>
 *       <h3>Glass Card</h3>       title
 *       <p>With Badge</p>         subtitle
 *       <span>NEW</span>          badge
 *     </header>
 *
 * Order matters more here than in ordinary markup because nothing carries a
 * class any more -- card.css reaches these by tag and position
 * (`article > header > p`, `> span`, `> time`). A builder that appended the
 * badge before the subtitle would still "have a subtitle" by any content
 * assertion while rendering it in the badge's grid slot.
 *
 * The order is asserted as a RELATIVE sequence, not as an exact list: a card
 * that has no subtitle is fine, a card that puts the subtitle after the
 * byline is not.
 */

const CARDS = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 'cardprofile',
  'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct', 'cardnotification',
  'cardfile', 'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardoverlay', 'cardportfolio',
];

/** The canonical sequence: featured marker, heading, subtitle, category,
 *  date, reading time, byline, badge. The marker leads because it is read
 *  before you read what the card is about. Every slot is a DISTINCT tag on purpose -- CSS selects
 *  these by tag and position now, so two parts sharing a tag would make the
 *  order unreadable to the stylesheet. */
const ORDER = ['mark', 'h', 'p', 'small', 'time', 'data', 'address', 'span'];

/** Every heading rank collapses to one slot -- h2 vs h3 is the
 *  heading-level attribute's business, not this test's. */
function rank(tag: string, isLast: boolean): number {
  if (/^h[1-6]$/.test(tag)) return ORDER.indexOf('h');
  // A span that is NOT the last child is an icon (carddraggable's grab
  // handle), not the badge. Only the badge is ordered.
  if (tag === 'span' && !isLast) return -1;
  return ORDER.indexOf(tag);
}

type Row = { name: string; tags: string[] };

test.describe('card header order', () => {
  let rows: Row[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    rows = await page.evaluate(async (list) => {
      const out: any[] = [];
      for (const name of list) {
        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:0;left:0;width:640px;z-index:99999';
        host.innerHTML =
          `<article id="h-${name}" x-${name} title="Ada on Engines" subtitle="A note" ` +
          `badge="NEW" author="Ada Lovelace" date="1843-10-01" category="Computing" ` +
          `reading-time="7" price="$19" value="42" label="Sales" message="Fine." ` +
          `content="Body."></article>`;
        document.body.appendChild(host);
        await (window as any).WB.scan(host, { eager: true });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const el = document.getElementById(`h-${name}`) as HTMLElement;
        const header = el.querySelector(':scope > header');
        out.push({
          name,
          tags: header
            ? Array.from(header.children).map((c) => c.tagName.toLowerCase())
            : [],
        });
        host.remove();
      }
      return out;
    }, CARDS);

    await page.close();
  });

  test('the sweep actually ran', () => {
    expect(rows.length).toBe(CARDS.length);
  });

  test('title, subtitle, metadata, badge — in that order, every card', () => {
    const wrong: string[] = [];
    for (const r of rows) {
      const ranked = r.tags.map((t, i) => rank(t, i === r.tags.length - 1)).filter((n) => n >= 0);
      for (let i = 1; i < ranked.length; i++) {
        if (ranked[i] < ranked[i - 1]) {
          wrong.push(`x-${r.name} header is <${r.tags.join('><')}>`);
          break;
        }
      }
    }
    expect(
      wrong,
      'card.css targets header parts by tag and position, so the order IS the ' +
      'contract: heading, subtitle, category, date, reading-time, byline, badge',
    ).toEqual([]);
  });

  test('the badge is last when there is one', () => {
    // Its grid slot is column 2, spanning every row. Emitted anywhere but
    // last it still lands in that slot, so a content assertion would pass
    // while the source order quietly drifted.
    const bad = rows
      // Only cards that actually built a badge -- a lone icon span is not one.
      .filter((r) => r.tags.filter((t) => t === 'span').length > 0 && r.tags.includes('address'))
      .filter((r) => r.tags[r.tags.length - 1] !== 'span')
      .map((r) => `x-${r.name}: <${r.tags.join('><')}>`);
    expect(bad, 'the badge must be the header\'s last child').toEqual([]);
  });
});
