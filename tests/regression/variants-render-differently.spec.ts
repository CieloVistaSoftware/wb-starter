/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Every variant renders differently (#773)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, looking at the showcase's variant list — article: flat, bordered,
 * glass, default, clickable, elevated, size=xs, size=sm…:
 *
 *   "Make sure every variant actually is different at the gui layer."
 *
 * A variant row promises a visibly distinct rendering. When two rows render
 * identically the variant is a no-op, and the list is advertising options that
 * do nothing. That is the same defect class as #754 (input variants and sizes
 * were dead) and #746 (x-button suppressed the button behavior for three
 * releases): registered, documented, inert.
 *
 * WHY COMPUTED STYLE AND NOT THE CLASS LIST
 *
 * Every existing test asserts a variant applies its CLASS. None asserts the
 * class changes anything a reader can see — so a variant whose CSS was never
 * written passes today. `wb-card--glass` being present proves nothing if no
 * rule matches `.wb-card--glass`. The fingerprint below is therefore taken
 * from getComputedStyle, which is the only thing that reflects what actually
 * reached the screen.
 *
 * WHAT COUNTS AS "DIFFERENT"
 *
 * Only properties a reader could notice: colour, background, border,
 * box-shadow, radius, spacing, type size and weight, dimensions, opacity,
 * transform, display. Deliberately NOT the class attribute, and not any
 * property that changes for reasons unrelated to the variant.
 *
 * Two variants are allowed to look alike when the schema says they are aliases
 * (`default` and an unset value routinely resolve to the same thing) — that
 * pair is exempted by name rather than by loosening the comparison for
 * everyone.
 */

import { test, expect, Page } from '@playwright/test';

/** Style properties a person could actually see a difference in. */
const VISUAL_PROPS = [
  'background-color', 'background-image',
  'color',
  'border-top-width', 'border-top-style', 'border-top-color',
  'border-radius',
  'box-shadow',
  'padding-top', 'padding-left',
  'margin-top',
  'font-size', 'font-weight', 'font-style',
  'text-transform', 'letter-spacing',
  'opacity', 'transform', 'filter',
  'display', 'flex-direction', 'gap',
  'width', 'height',
];

/**
 * Variant names that are SUPPOSED to look the same as another row.
 *
 * `default` is the value a behavior falls back to, so it matching the unset
 * rendering is correct rather than a bug. Anything else that lands here needs
 * a reason next to it.
 */
const ALIAS_OK = new Set(['default']);

async function openPanel(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 10,
    { timeout: 30000 },
  );
}

test.describe('Showcase variants are visually distinct', () => {
  test('no two variants of a behavior render identically', async ({ page }) => {
    test.setTimeout(300_000);

    await openPanel(page);

    const findings = await page.evaluate(async ({ props, aliasOk }) => {
      // Rows can contain links; a stray navigation destroys the page context
      // mid-sweep, which is the trap that made an earlier sweep flaky.
      const noNav = (e: Event) => {
        const a = (e.target as HTMLElement)?.closest?.('a');
        if (a) e.preventDefault();
      };
      document.addEventListener('click', noNav, true);

      const byBehavior = new Map<string, Map<string, string[]>>();

      try {
        const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];

        for (const row of rows) {
          const token = row.dataset.browseToken || '';
          const variant = row.dataset.variant || '';
          // A behavior with no declared variant has nothing to compare.
          if (!token || !variant) continue;

          row.click();
          await new Promise((r) => setTimeout(r, 110));

          const stage = document.getElementById('behaviors-live-example');
          const el = stage?.firstElementChild as HTMLElement | null;
          if (!el) continue;

          const cs = getComputedStyle(el);
          const fingerprint = props.map((p) => cs.getPropertyValue(p)).join('|');

          if (!byBehavior.has(token)) byBehavior.set(token, new Map());
          const seen = byBehavior.get(token)!;
          if (!seen.has(fingerprint)) seen.set(fingerprint, []);
          seen.get(fingerprint)!.push(variant);
        }
      } finally {
        document.removeEventListener('click', noNav, true);
      }

      // A fingerprint shared by two or more variants is the defect.
      const clashes: string[] = [];
      let compared = 0;

      for (const [token, seen] of byBehavior) {
        for (const [, variants] of seen) {
          compared += variants.length;
          if (variants.length < 2) continue;
          const real = variants.filter((v) => !aliasOk.includes(v.toLowerCase()));
          // One alias collapsing onto one real variant is expected; two REAL
          // variants sharing a rendering is not.
          if (real.length >= 2) {
            clashes.push(`${token}: ${real.join(' = ')} render identically`);
          }
        }
      }
      return { clashes, compared, behaviors: byBehavior.size };
    }, { props: VISUAL_PROPS, aliasOk: [...ALIAS_OK] });

    expect(findings.compared, 'nothing was compared — the sweep would pass vacuously')
      .toBeGreaterThan(20);

    expect(
      findings.clashes,
      `${findings.clashes.length} variant pair(s) across ${findings.behaviors} behaviors ` +
      `render identically. Each is a row in the showcase promising a distinct ` +
      `look and delivering the previous one — the variant's CSS is missing or ` +
      `never matched:\n  ` + findings.clashes.slice(0, 40).join('\n  '),
    ).toEqual([]);
  });
});
