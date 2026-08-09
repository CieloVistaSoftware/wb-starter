import { test, expect } from '@playwright/test';

/**
 * `.page__hero` (src/styles/pages/components.css) sets `text-align: center` —
 * intentional for the hero banner itself, but if the hero's own `<div>` is
 * never closed, every section AFTER it in the page (cards, docs, whatever)
 * stays nested INSIDE it and inherits that centering. That's exactly what
 * happened in pages/components.html: `#components-hero` opened at the top of
 * the file and its closing `</div>` was missing, so the entire "Cards"
 * section — including every `.wb-card__header`/`.wb-card__main`, which have
 * no text-align of their own — rendered centered, while `.wb-card__footer`
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
    await page.goto('/?page=components', { waitUntil: 'networkidle' });
    await page.waitForSelector('.wb-card__header', { timeout: 15000 });
    const aligns = await page.evaluate(() => {
      const card = [...document.querySelectorAll('wb-card')].find((c) => c.querySelector('.wb-card__footer'));
      if (!card) return null;
      const ta = (sel: string) => {
        const el = card.querySelector(sel);
        return el ? getComputedStyle(el).textAlign : null;
      };
      return { header: ta('.wb-card__header'), main: ta('.wb-card__main'), footer: ta('.wb-card__footer') };
    });
    expect(aligns).not.toBeNull();
    // 'start' (the browser default, no rule matched) and 'left' (an explicit
    // `text-align: left` rule, e.g. .wb-card__footer's) render identically in
    // LTR — normalize both to the same token so this asserts real visual
    // consistency, not incidental computed-value spelling.
    const normalize = (v: string | null) => (v === 'start' ? 'left' : v);
    expect(normalize(aligns!.header)).toBe(normalize(aligns!.footer));
    expect(normalize(aligns!.main)).toBe(normalize(aligns!.footer));
  });
});
