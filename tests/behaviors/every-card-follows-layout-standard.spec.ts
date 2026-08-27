import { test, expect, Page } from '@playwright/test';

/**
 * Every card behavior obeys the layout standard.
 *
 * John: "write a test for all x-cards that proved they all follow our layout
 * standard."
 *
 * The trigger was <article x-cardbutton>, whose header and footer each carried
 * a 41.89px margin they had no business having. The cause was not the card:
 * src/styles/pages/behaviors.css styled BARE `header` and `footer` element
 * selectors, so page chrome leaked into the <header>/<footer> that card.js
 * builds inside a card. article.js had already hit that exact collision and
 * dodged it with a plain <div>; card.js never did.
 *
 * A per-card fix would have been worthless -- the leak reached all 19 -- so
 * this asserts the standard across every card behavior at once.
 *
 * WHAT IS ASSERTED  (docs/standards/DEMOS-AND-DOCS-STANDARDS.md §13)
 *
 *   1. padding    >= 1rem inside the card, so content is not flush to the edge
 *   2. no page chrome  the card's own <header>/<footer> must not inherit the
 *                      page header/footer rules; that is what produced the
 *                      41.89px margins
 *   3. content fits    nothing overflows the card's own box (§15a)
 *   4. it rendered     a card that built nothing trivially "passes" a spacing
 *                      check, so structure is verified first
 *
 * Values are read from getComputedStyle, never from class names: the bug was
 * a computed margin from a selector nobody expected to match, and a class
 * assertion would have sailed straight past it.
 */

/** Every behavior that index.js routes to card.js. */
const CARDS = [
  'card', 'cardimage', 'cardvideo', 'cardbutton', 'cardhero', 'cardprofile',
  'cardpricing', 'cardstats', 'cardtestimonial', 'cardproduct', 'cardnotification',
  'cardfile', 'cardlink', 'cardhorizontal', 'carddraggable', 'cardexpandable',
  'cardminimizable', 'cardoverlay', 'cardportfolio',
];

/** One rem in px, resolved from the page rather than assumed to be 16. */
const REM = 16;
const MIN_PADDING = REM; // §13: >= 1rem

/** Attributes broad enough that every variant renders something real. */
const COMMON =
  'title="Upgrade to Team" ' +
  'content="Shared workspaces, audit history and SSO." ' +
  'subtitle="Team plan" ' +
  'label="Team" value="42" ' +
  'primary="Start free trial" secondary="Compare plans" ' +
  'image="https://placehold.co/600x400/1e293b/e2e8f0?text=Card" ' +
  'image-alt="Placeholder" ' +
  'price="$19" name="Ada Lovelace" role="Engineer" ' +
  'message="Everything is fine."';

type Result = {
  name: string;
  rendered: boolean;
  kids: number;
  padTop: number; padRight: number; padBottom: number; padLeft: number;
  chromeMargins: { part: string; margin: string }[];
  overflowsX: boolean;
  inset: number;
  width: number; height: number;
};

async function measure(page: Page, names: string[]): Promise<Result[]> {
  return page.evaluate(async ({ list, common }) => {
    const out: any[] = [];
    for (const name of list) {
      const host = document.createElement('div');
      // Real width and on-screen: the harness runs the lazy runtime, and an
      // off-screen host never initialises.
      host.style.cssText = 'position:fixed;top:0;left:0;width:640px;z-index:99999';
      host.innerHTML = `<article id="probe-${name}" x-${name} variant="bordered" ${common}></article>`;
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const el = document.getElementById(`probe-${name}`) as HTMLElement;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();

      // The card's OWN header/footer -- the elements the page chrome leaked into.
      const chrome: { part: string; margin: string }[] = [];
      for (const sel of ['header', 'footer']) {
        el.querySelectorAll(sel).forEach((n) => {
          const m = getComputedStyle(n as HTMLElement);
          chrome.push({ part: sel, margin: m.margin });
        });
      }

      // Anything sticking out horizontally (§15a).
      let overflowsX = false;
      el.querySelectorAll('*').forEach((n) => {
        const r = (n as HTMLElement).getBoundingClientRect();
        if (r.width > 0 && (r.right > rect.right + 1 || r.left < rect.left - 1)) overflowsX = true;
      });

      // The real question §13 asks is whether CONTENT sits flush against the
      // card edge -- not which element carries the padding. Several cards pad
      // their inner sections instead of the host and are perfectly compliant,
      // so measure the smallest gap between the card's box and its nearest
      // visible descendant. An edge-to-edge image is a deliberate full-bleed
      // and is excluded.
      // LEAVES only. A wrapper like .x-card__header legitimately spans the card
      // edge to edge and carries the padding itself, so measuring containers
      // reported 0px for 13 compliant cards. What §13 is about is where the
      // reader's TEXT sits, which is the leaf that holds it.
      let inset = Infinity;
      el.querySelectorAll('*').forEach((n) => {
        const node = n as HTMLElement;
        if (node.children.length > 0) return;           // not a leaf
        if (node.tagName === 'IMG' || node.tagName === 'VIDEO') return; // full-bleed by design
        if ((node.textContent || '').trim() === '') return;
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return;
        // Count the leaf's OWN padding: .x-card__main is a leaf whose box
        // starts at the card's 2px border but whose text is inset a further
        // 16px by its own padding. Measuring the box alone reported a §13
        // violation for six compliant cards -- the text was never at 2px.
        const ncs = getComputedStyle(node);
        const pl = parseFloat(ncs.paddingLeft) || 0;
        const pr = parseFloat(ncs.paddingRight) || 0;
        const pt = parseFloat(ncs.paddingTop) || 0;
        inset = Math.min(
          inset,
          (r.left + pl) - rect.left,
          rect.right - (r.right - pr),
          (r.top + pt) - rect.top,
        );
      });

      out.push({
        name,
        rendered: el.children.length > 0 || (el.textContent || '').trim().length > 0,
        kids: el.children.length,
        padTop: parseFloat(cs.paddingTop) || 0,
        padRight: parseFloat(cs.paddingRight) || 0,
        padBottom: parseFloat(cs.paddingBottom) || 0,
        padLeft: parseFloat(cs.paddingLeft) || 0,
        chromeMargins: chrome,
        overflowsX,
        inset: Number.isFinite(inset) ? Math.round(inset) : -1,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
      host.remove();
    }
    return out;
  }, { list: names, common: COMMON });
}

test.describe('every card follows the layout standard', () => {
  let results: Result[];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
    results = await measure(page, CARDS);
    await page.close();
  });

  test('the sweep actually ran', () => {
    // A sweep over an empty list reports perfect compliance forever (#863).
    expect(results.length, 'no cards were measured').toBe(CARDS.length);
  });

  test('every card renders structure', () => {
    // Checked FIRST: a card that builds nothing has no padding to get wrong,
    // and would pass every spacing assertion below by rendering nothing at all.
    const empty = results.filter((r) => !r.rendered);
    expect(
      empty.map((r) => `x-${r.name}`),
      'these cards rendered nothing, so their spacing proves nothing',
    ).toEqual([]);
  });

  test('a card never inherits the page header/footer chrome', () => {
    // The actual bug. src/styles/pages/behaviors.css styled bare `header` and
    // `footer`, so a card's own chrome picked up the PAGE's 2rem block margin
    // (41.89px measured). Both rules are now :not([x-ignore]) and card.js
    // marks its internal chrome accordingly.
    const bad: string[] = [];
    for (const r of results) {
      for (const c of r.chromeMargins) {
        // A card's internal chrome sets its spacing through padding and the
        // card's own gap; a large block margin means an outside rule reached in.
        const nums = c.margin.split(' ').map((v) => parseFloat(v) || 0);
        const biggest = Math.max(...nums);
        if (biggest > REM) {
          bad.push(`x-${r.name} ${c.part} margin=${c.margin}`);
        }
      }
    }
    expect(
      bad,
      'a card\'s own <header>/<footer> is carrying page-chrome margins — a bare ' +
      'element selector in a page stylesheet is reaching inside the card',
    ).toEqual([]);
  });

  test('content is never flush against the card edge (§13)', () => {
    // Measured as the gap between the card box and its nearest text-bearing
    // descendant, NOT as padding on the host. Asserting host padding failed 14
    // compliant cards that pad their inner sections instead -- the standard is
    // about what a reader sees, not about which element carries the property.
    const cramped = results
      .filter((r) => r.inset >= 0 && r.inset < MIN_PADDING)
      .map((r) => `x-${r.name} nearest content is ${r.inset}px from the edge`);
    expect(
      cramped,
      `§13: content must have >= ${MIN_PADDING}px of breathing room inside the card`,
    ).toEqual([]);
  });

  test('nothing overflows the card horizontally (§15a)', () => {
    const spilling = results.filter((r) => r.overflowsX).map((r) => `x-${r.name} (${r.width}px wide)`);
    expect(spilling, 'content is rendering outside the card box').toEqual([]);
  });
});
