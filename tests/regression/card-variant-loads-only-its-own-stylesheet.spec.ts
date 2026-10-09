import { test, expect } from '../fixtures/offline';

/**
 * A page with one card variant loads card.css plus THAT variant's stylesheet,
 * and no other variant's (#966).
 *
 * card.css used to hold every variant's rules -- 147KB serving 19 behaviors --
 * so a page with one x-cardlink downloaded the portfolio, pricing, stats ...
 * styling too. Each variant's own rules now live in <variant>.css, mapped in
 * behavior-css-manifest.js as ['card.css', '<variant>.css'].
 *
 * Two things are proved per variant:
 *   1. its styling applies, and it comes from its own file: the computed value
 *      changes when that one stylesheet is switched off;
 *   2. no other variant's stylesheet was requested.
 */

/** A variant, the markup for one card of it, and a property only its own file sets. */
const CASES = [
  {
    variant: 'cardlink',
    html: '<article x-cardlink title="Docs" description="Read the guide" href="#guide"></article>',
    // `[x-cardlink][x-cardlink][x-cardlink] { padding: 1.25rem }` in cardlink.css
    property: 'padding-left',
    expected: '20px',
  },
  {
    variant: 'cardportfolio',
    html: '<article x-cardportfolio name="Ada Lovelace" title="Engineer"></article>',
    // `[x-cardportfolio] { max-width: 25rem }` in cardportfolio.css
    property: 'max-width',
    expected: '400px',
  },
];

for (const c of CASES) {
  test(`x-${c.variant}: its own stylesheet styles it, and no other variant's loads`, async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });

    const result = await page.evaluate(async ({ html, variant, property }) => {
      const w = window as any;
      const host = document.createElement('div');
      host.id = 'one-card-variant';
      host.style.width = '600px';
      host.innerHTML = html;
      document.body.appendChild(host);
      await w.WB.scan(host, { eager: true });
      await w.WB.settled({ timeout: 15_000 });

      const card = host.firstElementChild as HTMLElement;
      // The card base declares `transition: all 0.2s`, so a value read while a
      // stylesheet is arriving or being switched off is mid-animation. Read
      // end states only.
      card.style.transition = 'none';
      const own = document.querySelector(`link[data-x-behavior-css="${variant}.css"]`) as HTMLLinkElement | null;
      const styled = getComputedStyle(card).getPropertyValue(property);
      // Switch the variant's own sheet off: the value must change, so it was that file's.
      let unstyled: string | null = null;
      if (own?.sheet) {
        own.sheet.disabled = true;
        unstyled = getComputedStyle(card).getPropertyValue(property);
        own.sheet.disabled = false;
      }

      const behaviorCss = [...document.querySelectorAll('link[data-x-behavior-css]')]
        .map((l) => (l as HTMLLinkElement).dataset.xBehaviorCss as string);
      const requested = performance.getEntriesByType('resource')
        .map((e) => e.name.match(/\/styles\/behaviors\/(card[a-z]*\.css)/)?.[1])
        .filter(Boolean) as string[];
      return { styled, unstyled, hasOwnSheet: !!own?.sheet, behaviorCss, requested };
    }, c);

    expect(result.hasOwnSheet, `${c.variant}.css must be loaded for an x-${c.variant}`).toBe(true);
    expect(result.styled, `${c.property} on x-${c.variant}`).toBe(c.expected);
    expect(result.unstyled, `${c.property} must come from ${c.variant}.css -- switching it off changes it`)
      .not.toBe(c.expected);

    const isOtherVariant = (f: string) => /^card[a-z]+\.css$/.test(f) && f !== `${c.variant}.css`;
    expect(result.behaviorCss, 'the shared base loads').toContain('card.css');
    expect(result.behaviorCss.filter(isOtherVariant), 'no other card variant\'s stylesheet is linked').toEqual([]);
    expect([...new Set(result.requested.filter(isOtherVariant))], 'no other card variant\'s stylesheet is requested')
      .toEqual([]);
  });
}
