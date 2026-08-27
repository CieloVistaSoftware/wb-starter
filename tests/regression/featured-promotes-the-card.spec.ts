import { test, expect } from '@playwright/test';

/**
 * `featured` visibly promotes a card (#886).
 *
 * John: "what does featured do?" — on
 * `<article featured title="Ridge loop, 8km" …>`. Measured answer at the
 * time: nothing at all. Side by side against the same article WITHOUT the
 * attribute, every rendered property matched — border, padding, background,
 * radius, height 144px, title 20px. The only difference was the attribute
 * sitting in the DOM.
 *
 * Three reasons stacked:
 *   - card.js read `featured` only inside cardpricing()
 *   - article.schema.json's `appliesClass: x-article--featured` was not
 *     applied (measured class="(none)")
 *   - .x-article--featured set padding/border/radius/background the card
 *     already had, and its one real difference targeted .x-article__title,
 *     a class the card never emits
 *
 * Asserted as a DIFFERENCE from the unfeatured card rather than as specific
 * values: what "featured" means visually can change, but a promotion that
 * renders identically to no promotion is the bug.
 *
 * A heavier border alone was not enough. John: "featured is something to
 * print on a price tag when items are featured this week. Something has to
 * identify this is the thing." A border says this card is different; it does
 * not say WHY, and a reader cannot name it. So the card also prints a
 * marker, and `featured="Deal of the week"` prints that wording instead of
 * the default -- the same attribute carrying the reason.
 */

const BODY =
  'title="Ridge loop, 8km" subtitle="Moderate · 3h" author="Ada Lovelace" ' +
  'date="2026-08-20" category="Trails"';

type Read = {
  cls: string;
  borderWidth: string; borderColor: string;
  padding: string; background: string; boxShadow: string;
  titleSize: number;
  markerText: string; markerVisible: boolean; markerFirst: boolean;
};

test.describe('featured', () => {
  let featured: Read;
  let plain: Read;
  let custom: Read;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

    const both = await page.evaluate(async (body) => {
      const host = document.createElement('div');
      host.style.cssText = 'width:900px';
      host.innerHTML =
        `<article id="feat" featured ${body}>The north gate is open.</article>` +
        `<article id="plain" ${body}>The north gate is open.</article>` +
        `<article id="custom" featured="Deal of the week" ${body}>The north gate is open.</article>`;
      document.body.appendChild(host);
      await (window as any).WB.scan(host, { eager: true });
      await new Promise((r) => setTimeout(r, 500));

      const read = (id: string) => {
        const el = document.getElementById(id)!;
        const cs = getComputedStyle(el);
        const h = el.querySelector('h1,h2,h3,h4') as HTMLElement | null;
        const mark = el.querySelector(':scope > header > mark') as HTMLElement | null;
        const markBox = mark ? mark.getBoundingClientRect() : null;
        return {
          cls: el.className || '(none)',
          borderWidth: cs.borderTopWidth,
          borderColor: cs.borderTopColor,
          padding: cs.padding,
          background: cs.backgroundColor,
          boxShadow: cs.boxShadow,
          titleSize: h ? parseFloat(getComputedStyle(h).fontSize) : 0,
          markerText: mark ? (mark.textContent || '').trim() : '',
          // Present in the DOM is not the same as visible on screen.
          markerVisible: !!(markBox && markBox.width > 0 && markBox.height > 0),
          markerFirst: !!(mark && el.querySelector(':scope > header')?.firstElementChild === mark),
        };
      };
      return { feat: read('feat'), plain: read('plain'), custom: read('custom') };
    }, BODY);

    featured = both.feat;
    plain = both.plain;
    custom = both.custom;
    await page.close();
  });

  test('both cards rendered', () => {
    // A card that built nothing has nothing to promote, and would pass a
    // difference check by being equally empty.
    expect(featured.titleSize, 'the featured card rendered no title').toBeGreaterThan(0);
    expect(plain.titleSize, 'the plain card rendered no title').toBeGreaterThan(0);
  });

  test('it changes how the card looks', () => {
    const differs =
      featured.borderWidth !== plain.borderWidth ||
      featured.borderColor !== plain.borderColor ||
      featured.boxShadow !== plain.boxShadow ||
      featured.titleSize !== plain.titleSize;
    expect(
      differs,
      'featured rendered identically to not-featured — ' +
      `border ${featured.borderWidth} ${featured.borderColor}, ` +
      `shadow ${featured.boxShadow}, title ${featured.titleSize}px`,
    ).toBe(true);
  });

  test('the promotion is the border and the title, not a layout shift', () => {
    // A featured card sits in the same grid as its siblings. Growing its
    // padding (what .x-article--featured used to do) would push it out of
    // alignment with them.
    expect(featured.padding, 'featured changed the card\'s padding').toBe(plain.padding);
    expect(featured.titleSize, 'the featured title should read larger')
      .toBeGreaterThan(plain.titleSize);
  });

  test('it says so in words a reader can see', () => {
    // The whole point. A heavier border marks the card as different without
    // ever saying what it is.
    expect(featured.markerText, 'featured printed no label').toBe('Featured');
    expect(featured.markerVisible, 'the label is in the DOM but not on screen').toBe(true);
    expect(plain.markerText, 'a plain card printed a featured label').toBe('');
  });

  test('the label leads the header', () => {
    expect(featured.markerFirst, 'the marker must be read before the title').toBe(true);
  });

  test('featured="…" prints that wording instead', () => {
    // The attribute carries the REASON, which is what makes it a price tag
    // rather than a generic flag.
    expect(custom.markerText).toBe('Deal of the week');
    expect(custom.markerVisible).toBe(true);
  });

  test('it needs no class to do it', () => {
    // Standing rule: specificity over class injection. `article[featured]`
    // names this exactly.
    expect(featured.cls, 'featured injected a class instead of using the attribute')
      .toBe('(none)');
  });
});
