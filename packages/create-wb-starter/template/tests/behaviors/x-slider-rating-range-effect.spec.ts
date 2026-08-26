/**
 * Effect-based coverage for the "📦 Slider", "Rating", and "Range" sections of
 * demos/site/forms.html — <div x-slider>, <span x-rating> (src/wb-viewmodels/semantics/rating.js),
 * and the native <input type="range"> enhancement (src/wb-viewmodels/semantics/range.js).
 *
 * Per docs/standards/DEMOS-AND-DOCS-STANDARDS.md #19, every declared attribute must be
 * proven to produce its real effect — not merely that the element renders.
 *
 * Two documented quirks (see demos/site/forms.html, the paragraph right above the
 * <span x-rating> demo block) are locked in here as regression tests rather than assumed
 * away:
 *   - icon= takes a literal string rendered as-is — icon="heart" renders the text
 *     "heart", not a heart glyph. Only passing an actual glyph character (e.g. ❤️)
 *     produces a glyph.
 *   - precision= is not read anywhere in rating.js — it must have zero effect.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #735: NOT WBSite. This page is a standalone harness, not an SPA route, so
  // window.WBSite is never created here -- the wait burned its full timeout and
  // failed before a single assertion ran. WB.behaviors is the readiness signal
  // that applies, and this setup scans the DOM itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'x-slider-rating-range-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) {
      await (window as any).WB.scan(document.getElementById('x-slider-rating-range-test-area'), { eager: true });
    }
  });
  await page.waitForTimeout(500);
}

test.describe('<div x-slider> is currently a minimal stub (src/wb-viewmodels/slider.js)', () => {
  test('adds the x-slider class but does not build a range control or alter content', async ({ page }) => {
    await setup(page, '<div x-slider id="s1">Slider</div>');
    const el = page.locator('#s1');
    // Real effect per slider.js: element.classList.add('x-slider') and nothing else —
    // no innerHTML replacement, no child controls created.
    await expect(el).toHaveClass(/x-slider/);
    await expect(el).toHaveText('Slider');
    expect(await el.locator('input[type="range"]').count()).toBe(0);
  });
});

test.describe('<span x-rating> value= renders the real filled-star count', () => {
  test('value="3" max="5" fills exactly 3 of 5 stars, 2 remain empty', async ({ page }) => {
    await setup(page, '<span x-rating id="r1" value="3" max="5"></span>');
    await expect(page.locator('#r1 .x-rating__star')).toHaveCount(5);
    await expect(page.locator('#r1 .x-rating__star--full')).toHaveCount(3);
    await expect(page.locator('#r1 .x-rating__star:not(.x-rating__star--full)')).toHaveCount(2);
  });
});

test.describe('<span x-rating> fractional value — rating.js parseInt() truncates, it does not round', () => {
  test('value="4.5" max="5" fills 4 stars, not 5 (parseInt("4.5", 10) === 4)', async ({ page }) => {
    await setup(page, '<span x-rating id="r2" value="4.5" max="5"></span>');
    await expect(page.locator('#r2 .x-rating__star--full')).toHaveCount(4);
  });
});

test.describe('<span x-rating> color= overrides the filled-star color', () => {
  test('color="gold" computes to rgb(255, 215, 0), different from the default theme color', async ({ page }) => {
    await setup(page, `
      <span x-rating id="r3default" value="2" max="5"></span>
      <span x-rating id="r3gold" value="2" max="5" color="gold"></span>
    `);
    const defaultColor = await page
      .locator('#r3default .x-rating__star--full')
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    const goldColor = await page
      .locator('#r3gold .x-rating__star--full')
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(goldColor).toBe('rgb(255, 215, 0)');
    expect(goldColor).not.toBe(defaultColor);
  });
});

test.describe('<span x-rating> icon= — documented quirk: a literal glyph renders, a keyword does not', () => {
  test('icon="❤️" renders the emoji glyph itself as the star content', async ({ page }) => {
    await setup(page, '<span x-rating id="r4" value="1" max="3" icon="❤️"></span>');
    const glyph = await page.locator('#r4 .x-rating__star').first().textContent();
    expect(glyph).toBe('❤️');
  });

  test('icon="heart" renders the literal text "heart", NOT a heart icon (rating.js has no keyword-to-glyph mapping)', async ({ page }) => {
    await setup(page, '<span x-rating id="r5" value="1" max="3" icon="heart"></span>');
    const glyph = await page.locator('#r5 .x-rating__star').first().textContent();
    expect(glyph).toBe('heart');
  });
});

test.describe('<span x-rating> precision= is a confirmed no-op (never read by rating.js)', () => {
  test('precision="1" and precision="0.1" render byte-for-byte identical fill state, color, and glyph', async ({ page }) => {
    await setup(page, `
      <span x-rating id="r6a" value="3" max="5" precision="1"></span>
      <span x-rating id="r6b" value="3" max="5" precision="0.1"></span>
    `);
    const snapshot = (id: string) =>
      page.locator(`#${id} .x-rating__star`).evaluateAll((stars) =>
        stars.map((s) => ({
          full: s.classList.contains('x-rating__star--full'),
          color: getComputedStyle(s).color,
          glyph: s.textContent,
        }))
      );
    const a = await snapshot('r6a');
    const b = await snapshot('r6b');
    expect(a).toEqual(b);
  });
});

test.describe('native <input type="range" show-value> — range.js value display (src/wb-viewmodels/semantics/range.js)', () => {
  test('displayed value matches the initial value and updates live as the input value changes', async ({ page }) => {
    // x-behavior="range" applies the behavior explicitly. This mirrors the
    // convention already used for <pre x-behavior="pre"> elsewhere in this
    // suite (tests/behaviors/x-demo-width-and-toggle.spec.ts). It is
    // necessary here because the range behavior is only ever reached via
    // tag-map.js's autoInject path (input[type="range"] -> 'range'), and
    // getAutoInjectBehavior() in src/core/wb.js requires either a `variant`
    // attribute OR the global `autoInject` config to be true. The real site
    // turns this on via config/site.json's autoInjectComponents: true (see
    // src/core/site-engine.js), but demos/test-harness.html's own WB.init()
    // call omits autoInject, so it defaults to false there — confirmed by
    // reading src/core/wb.js's getAutoInjectBehavior(). x-behavior sidesteps
    // that gap the same way the existing pre/code tests do, without touching
    // src/ or inventing new behavior.
    await setup(page, '<input id="rng1" type="range" x-behavior="range" show-value min="0" max="100" value="50">');
    const display = page.locator('#x-slider-rating-range-test-area .x-range-value').first();
    await expect(display).toHaveText('50');

    await page.evaluate(() => {
      const input = document.getElementById('rng1') as HTMLInputElement;
      input.value = '80';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(display).toHaveText('80');
  });
});

test.describe('native <input type="range" show-labels> — min/max labels', () => {
  test('rendered min/max labels match the min/max attributes', async ({ page }) => {
    await setup(page, '<input id="rng2" type="range" x-behavior="range" show-value show-labels min="10" max="90" value="50">');
    const labels = page
      .locator('#x-slider-rating-range-test-area .x-range-wrapper > div')
      .last()
      .locator('span');
    await expect(labels).toHaveCount(2);
    await expect(labels.nth(0)).toHaveText('10');
    await expect(labels.nth(1)).toHaveText('90');
  });
});

test.describe('native <input type="range" value-suffix="%">', () => {
  test('displayed value includes the suffix — "75%", not just "75"', async ({ page }) => {
    await setup(page, '<input id="rng3" type="range" x-behavior="range" show-value value-suffix="%" min="0" max="100" value="75">');
    const display = page.locator('#x-slider-rating-range-test-area .x-range-value').first();
    await expect(display).toHaveText('75%');
  });
});
