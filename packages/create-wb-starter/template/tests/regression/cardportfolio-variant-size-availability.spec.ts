import { test, expect } from '@playwright/test';

/**
 * x-cardportfolio (card.js → cardportfolio(), CSS in card.css) had three
 * related bugs, all found live on demos/multi-component-demo-generated.html
 * (the auto-generated page that renders one <div x-demo> per enum value):
 *
 * 1. variant="compact"/"horizontal"/"full" added a `x-portfolio--{variant}`
 *    class (card.js) but card.css had ZERO `.x-portfolio--*` rules -- the
 *    same "JS adds a modifier class, no matching CSS exists" pattern already
 *    fixed this session for x-switch/x-button/x-progress/x-chip/x-rating.
 *    compact/horizontal rendered pixel-identical to default.
 *
 * 2. size="sm"/"md"/"lg"/"xl"/"full" go through cardBase()'s shared
 *    `.x-card--{size}` classes (real max-width/min-width rules), but inside
 *    a multi-column <div x-demo> grid the item stretches to fill its column
 *    (grid default `justify-items: stretch`) -- confirmed live: size=md/lg/
 *    xl/full all rendered at the same 328-335px column width, only sm's
 *    280px max-width was narrower than the column. Fixed by scaling the
 *    portfolio's own avatar size / name font-size / header padding with the
 *    size class too, so diversity is visible independent of container width.
 *
 * 3. The availability dot (`.x-portfolio__availability`) was built ONLY
 *    inside `if (config.avatar) {...}` -- since the demo generator never
 *    sets `avatar` (not a required schema property) and `availability`
 *    defaults to 'available' (cardportfolio.schema.json), the dot never
 *    rendered at all on the demo page. Fixed by always building the avatar
 *    wrap (with an initials placeholder when there's no real image) whenever
 *    there's an avatar OR an availability status to show.
 */

const FIXTURE = '/tests/fixtures/cards-permutation-matrix.html';

test.describe('x-cardportfolio variant/size/availability (regression)', () => {
  test('availability dot renders and is color-distinct with no avatar attribute set', async ({ page }) => {
    await page.goto(FIXTURE);
    const section = page.locator('#cardportfolio-availability-variants');
    await section.locator('x-cardportfolio').first().waitFor();

    const results = await section.evaluate((sectionEl) => {
      const cards = Array.from(sectionEl.querySelectorAll('x-cardportfolio'));
      return cards.map((c) => {
        const dot = c.querySelector('.x-portfolio__availability');
        const placeholder = c.querySelector('.x-portfolio__avatar-placeholder');
        return {
          availability: c.getAttribute('availability'),
          hasAvatarAttr: c.hasAttribute('avatar'),
          hasDot: !!dot,
          dotColor: dot ? getComputedStyle(dot).backgroundColor : null,
          hasPlaceholder: !!placeholder,
        };
      });
    });

    expect(results).toHaveLength(4);
    for (const r of results) {
      expect(r.hasAvatarAttr).toBe(false); // none of these cards set `avatar`
      expect(r.hasDot).toBe(true); // the dot must render anyway
      expect(r.hasPlaceholder).toBe(true); // fallback initials avatar built
    }

    // Each availability value maps to a visually distinct color.
    const colors = new Set(results.map((r) => r.dotColor));
    expect(colors.size).toBe(4);
  });

  test('variant=compact/horizontal/full render visually distinct from default', async ({ page }) => {
    await page.goto(FIXTURE);
    const section = page.locator('#cardportfolio-variant-variants');
    await section.locator('x-cardportfolio').first().waitFor();

    const byVariant = await section.evaluate((sectionEl) => {
      const read = (variant: string) => {
        const el = Array.from(sectionEl.querySelectorAll('x-cardportfolio')).find(
          (c) => c.getAttribute('variant') === variant,
        ) as HTMLElement | undefined;
        if (!el) return null;
        const cs = getComputedStyle(el);
        const avatar = el.querySelector('.x-portfolio__avatar');
        return {
          width: el.getBoundingClientRect().width,
          flexDirection: cs.flexDirection,
          avatarWidth: avatar ? avatar.getBoundingClientRect().width : null,
          hasVariantClass: el.classList.contains(`x-portfolio--${variant}`),
        };
      };
      return {
        default: read('default'),
        compact: read('compact'),
        horizontal: read('horizontal'),
        full: read('full'),
      };
    });

    expect(byVariant.default).not.toBeNull();
    expect(byVariant.compact).not.toBeNull();
    expect(byVariant.horizontal).not.toBeNull();
    expect(byVariant.full).not.toBeNull();

    // compact/horizontal/full each add the modifier class...
    expect(byVariant.compact!.hasVariantClass).toBe(true);
    expect(byVariant.horizontal!.hasVariantClass).toBe(true);
    expect(byVariant.full!.hasVariantClass).toBe(true);

    // ...and each must actually look different from default (the bug: the
    // class was added but no CSS matched it, so they were pixel-identical).
    expect(byVariant.compact!.width).toBeLessThan(byVariant.default!.width);
    expect(byVariant.compact!.avatarWidth).toBeLessThan(byVariant.default!.avatarWidth!);

    expect(byVariant.horizontal!.flexDirection).toBe('row');
    expect(byVariant.horizontal!.flexDirection).not.toBe(byVariant.default!.flexDirection);

    expect(byVariant.full!.avatarWidth).toBeGreaterThan(byVariant.default!.avatarWidth!);
    expect(byVariant.full!.width).toBeGreaterThan(byVariant.default!.width);
  });

  test('size=sm/md/lg/xl/full show increasing visual weight even inside a multi-column grid', async ({ page }) => {
    await page.goto(FIXTURE);
    const section = page.locator('#cardportfolio-size-variants');
    await section.locator('x-cardportfolio').first().waitFor();

    const bySize = await section.evaluate((sectionEl) => {
      const read = (size: string) => {
        const el = Array.from(sectionEl.querySelectorAll('x-cardportfolio')).find(
          (c) => c.getAttribute('size') === size,
        ) as HTMLElement | undefined;
        if (!el) return null;
        const avatar = el.querySelector('.x-portfolio__avatar');
        const name = el.querySelector('.x-portfolio__name');
        return {
          avatarWidth: avatar ? avatar.getBoundingClientRect().width : null,
          nameFontSize: name ? parseFloat(getComputedStyle(name).fontSize) : null,
        };
      };
      return {
        sm: read('sm'),
        md: read('md'),
        lg: read('lg'),
        xl: read('xl'),
        full: read('full'),
      };
    });

    for (const key of ['sm', 'md', 'lg', 'xl', 'full'] as const) {
      expect(bySize[key], `size=${key} card not found`).not.toBeNull();
    }

    // Strictly increasing avatar size sm < md < lg < xl < full -- this is
    // the signal that survives even when the demo grid's column width
    // clamps every size >= its column to the same rendered card width.
    expect(bySize.sm!.avatarWidth).toBeLessThan(bySize.md!.avatarWidth!);
    expect(bySize.md!.avatarWidth).toBeLessThan(bySize.lg!.avatarWidth!);
    expect(bySize.lg!.avatarWidth).toBeLessThan(bySize.xl!.avatarWidth!);
    expect(bySize.xl!.avatarWidth).toBeLessThan(bySize.full!.avatarWidth!);

    // Same for name font-size.
    expect(bySize.sm!.nameFontSize).toBeLessThan(bySize.md!.nameFontSize!);
    expect(bySize.md!.nameFontSize).toBeLessThan(bySize.lg!.nameFontSize!);
    expect(bySize.lg!.nameFontSize).toBeLessThan(bySize.xl!.nameFontSize!);
    expect(bySize.xl!.nameFontSize).toBeLessThan(bySize.full!.nameFontSize!);
  });
});
