import { test, expect } from '../fixtures/offline';
import { showBehavior } from '../helpers/behaviors-page';

/**
 * `.page__hero` (src/styles/pages/components.css) sets `text-align: center` —
 * intentional for the hero banner itself, but if the hero's own `<div>` is
 * never closed, every section AFTER it in the page (cards, docs, whatever)
 * stays nested INSIDE it and inherits that centering. That's exactly what
 * happened in pages/behaviors.html: `#components-hero` opened at the top of
 * the file and its closing `</div>` was missing, so the entire "Cards"
 * section — including every `.x-card__header`/`.x-card__main`, which have
 * no text-align of their own — rendered centered, while `.x-card__footer`
 * (which DOES set `text-align: left` directly on itself) stayed left,
 * producing a visibly inconsistent card (header/body centered, footer not).
 *
 * This asserts the structural invariant directly: a `.page__hero` must never
 * contain a `<section>` — sections are page content, always siblings of the
 * hero banner, never descendants of it.
 */
const PAGES_WITH_HERO = [
  'about', 'ai-docs', 'behaviors', 'components', 'contact', 'demos',
  'docs', 'features', 'links', 'newbehaviors', 'offshoring', 'services', 'themes',
];

test.describe('.page__hero never swallows page sections (unclosed-div structural check)', () => {
  for (const pageId of PAGES_WITH_HERO) {
    test(`?page=${pageId}: .page__hero contains no <section>`, async ({ page }) => {
      await page.goto(`/?page=${pageId}`, { waitUntil: 'networkidle' });
      const hero = page.locator('.page__hero').first();
      if ((await hero.count()) === 0) {
        test.skip(true, `no .page__hero on ${pageId} (page content may not have rendered / hero removed)`);
        return;
      }
      const nestedSections = await hero.locator('section').count();
      expect(nestedSections, `.page__hero on ?page=${pageId} contains ${nestedSections} nested <section> — its opening <div> is likely unclosed`).toBe(0);
    });
  }

  test('components: card header/main/footer share the same text-align (no inherited-centering leak)', async ({ page }) => {
    // The behaviors page is a searchable browser now (#910): no card is on
    // the stage until one is picked. x-cardexpandable's example is a card with
    // all three parts, and none of them sets a centred alignment of its own --
    // so any centring it shows was inherited from the page around it.
    await showBehavior(page, 'x-cardexpandable');
    const aligns = await page.evaluate(() => {
      // Cards carry no .x-card/.x-card__header/.x-card__main (a8a7362e); the
      // parts are the article's own <header>, <main> and <footer>.
      const card = [...document.querySelectorAll('#behaviors-live-example article')]
        .find((c) => c.querySelector(':scope > header') && c.querySelector(':scope > main') && c.querySelector(':scope > footer'));
      if (!card) return null;
      const ta = (sel: string) => {
        const el = card.querySelector(sel);
        return el ? getComputedStyle(el).textAlign : null;
      };
      return { header: ta(':scope > header'), main: ta(':scope > main'), footer: ta(':scope > footer') };
    });
    expect(aligns).not.toBeNull();
    // 'start' (the browser default, no rule matched) and 'left' (an explicit
    // `text-align: left` rule, e.g. .x-card__footer's) render identically in
    // LTR — normalize both to the same token so this asserts real visual
    // consistency, not incidental computed-value spelling.
    const normalize = (v: string | null) => (v === 'start' ? 'left' : v);
    expect(normalize(aligns!.header)).toBe(normalize(aligns!.footer));
    expect(normalize(aligns!.main)).toBe(normalize(aligns!.footer));
  });
});
