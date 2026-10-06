import { test, expect } from '../fixtures/offline';

/**
 * "20 signature heroes" playground example set (built from a user-submitted
 * template). The template also referenced x-parallax, a <div> tag,
 * and Vue-style x-on:change directives — none of which exist in this codebase
 * (verified against tag-map.js/wb-lazy.js: no [x-parallax] selector wired to
 * any behavior, no codepreview behavior/tag anywhere, no x-on: directive
 * system at all). This example set keeps only the real, working pieces:
 * x-cardhero's own attributes, x-fadein (real, wired in wb-lazy.js),
 * x-tooltip on a CTA (tooltip.js reads it directly; added as an opt-in
 * cta-tooltip/cta-secondary-tooltip attribute on cardhero.js), and a real
 * x-modal trigger (self-contained modal-title/modal-content API, not a
 * button-plus-separate-modal-by-id pattern).
 */
test.describe('Playground: 20 signature heroes example set', () => {
  // The "20 signature heroes" option was folded into "120 card heroes"
  // (oneTwentyHeroes(): every other hero -- i odd -- is the signature style,
  // wrapped in .pg-signature-hero with its x-fadein and companion x-modal), so
  // selecting 'signature-heroes' waited out the timeout on an option that no
  // longer exists. Same claims, against the set that carries them now.
  test('loads 20 real, enhanced [x-cardhero] + [x-modal] pairs, tooltip attribute wired', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'heroes-120');

    // Enhancement runs through WB's viewport-lazy IntersectionObserver path —
    // wait on the hero's own settled signal rather than a fixed sleep.
    const first = page.locator('#pg-preview .pg-signature-hero [x-cardhero]').first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute('x-ready', '', { timeout: 20000 });
    await expect(first).toHaveClass(/\bx-hero\b/);

    // 120 heroes, half of them signature pairs -- at least the 20 this set
    // was named for, each hero with its own companion trigger.
    await expect(page.locator('#pg-preview [x-cardhero]')).toHaveCount(120);
    const pairs = page.locator('#pg-preview .pg-signature-hero');
    await expect(pairs).toHaveCount(60);
    await expect(page.locator('#pg-preview .pg-signature-hero > [x-modal]')).toHaveCount(60);

    await expect(first.locator('.x-card__hero-title')).toHaveText('Compose, don\'t configure');
    await expect(first.locator('.x-card__hero-pretitle')).toHaveText('New #2');

    // The cta-tooltip attribute should have produced a real tooltip.js-driven
    // x-tooltip on the primary CTA — not just a dead attribute.
    const primaryCta = first.locator('.x-hero-cta--primary');
    await expect(primaryCta).toHaveAttribute('x-tooltip', /Stack x-\* behaviors/);
  });

  test('the primary CTA tooltip actually shows on hover (not just an inert attribute)', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'heroes-120');
    const cta = page.locator('#pg-preview .pg-signature-hero .x-hero-cta--primary').first();
    await cta.scrollIntoViewIfNeeded();
    await expect(cta).toHaveAttribute('x-tooltip', /.+/, { timeout: 20000 });
    // tooltip.js is lazy-loaded once the CTA itself has been scanned -- wait for
    // it to be settled, then hover and expect a real tooltip surface to appear.
    await expect(cta).toHaveAttribute('x-ready', '', { timeout: 20000 });
    await cta.hover();
    // The tooltip carrying THIS CTA's text, visible -- a hidden tooltip left
    // over from some other element must not satisfy it.
    await expect(page.locator('.x-tooltip, [role="tooltip"]', { hasText: 'Stack x-* behaviors' }).first())
      .toBeVisible({ timeout: 5000 });
  });

  test('a signature hero companion [x-modal] trigger actually opens a dialog', async ({ page }) => {
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    // The "20 signature heroes" set was folded into "120 card heroes"
    // (oneTwentyHeroes(): every other hero is the signature style with its
    // companion modal), so the 'signature-heroes' option no longer exists and
    // selectOption waited out the timeout.
    await page.selectOption('#pg-examples', 'heroes-120');
    const first = page.locator('#pg-preview [x-modal]').first();
    // Lazy runtime (#491): the trigger is only enhanced near the viewport.
    await first.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const trigger = document.querySelector('#pg-preview [x-modal]');
      return !!trigger && typeof (trigger as any).showModal === 'function';
    }, { timeout: 20000 });
    const trigger = page.locator('#pg-preview [x-modal]').first();
    await trigger.click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
  });

  // John: "make all the links on hero demos go to the .io site". A hero demos
  // a real landing page, so its buttons go to the live site, not to a relative
  // path that only resolves inside this repo. "Star on GitHub" is the one
  // button whose destination is GitHub itself.
  test('every hero CTA goes to the live .io site (or GitHub, for Star on GitHub)', async ({ page }) => {
    const SITE = 'https://cielovistasoftware.github.io/wb-starter/';
    await page.goto('/demos/playground.html', { waitUntil: 'networkidle' });
    await page.selectOption('#pg-examples', 'heroes-120');
    await expect(page.locator('#pg-preview [x-cardhero]')).toHaveCount(120);

    const ctas = await page.locator('#pg-preview [x-cardhero]').evaluateAll((heroes) => heroes.flatMap((h) => [
      [h.getAttribute('cta'), h.getAttribute('cta-href')],
      [h.getAttribute('cta-secondary'), h.getAttribute('cta-secondary-href')],
    ]).filter(([label]) => label));
    expect(ctas.length).toBeGreaterThan(0);

    const wrong = ctas.filter(([label, href]) => label === 'Star on GitHub'
      ? href !== 'https://github.com/CieloVistaSoftware/wb-starter'
      : !String(href).startsWith(SITE));
    expect(wrong, 'hero CTAs that do not go to the live site').toEqual([]);

    const playground = ctas.filter(([label]) => label === 'Try the Playground').map(([, href]) => href);
    expect(new Set(playground)).toEqual(new Set([SITE + 'demos/playground.html']));
    const guide = ctas.filter(([label]) => /^Read the guide$/i.test(String(label))).map(([, href]) => href);
    expect(new Set(guide)).toEqual(new Set([SITE + 'public/doc-viewer.html?file=docs%2FV3-GUIDE.md']));
  });
});
