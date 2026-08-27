import { test, expect, Page } from '@playwright/test';

/**
 * A bare boolean attribute must switch the option on.
 *
 * John, on the behaviors showcase: "Not striped why didn't our tests catch
 * this? first recreate with a test, then correct, then retest to prove it
 * works."
 *
 * `<div x-progressbar striped>` rendered a plain solid bar. progressbar.js
 * read the option as:
 *
 *     striped: options.striped ?? readAttr(element, 'striped') === 'true'
 *
 * A BARE attribute has the empty string as its value. readAttr() treats empty
 * as absent and returns its '' fallback, and `'' === 'true'` is false -- so
 * the only spelling that ever enabled stripes was `striped="true"`, which no
 * doc, schema default or showcase example uses.
 *
 * Same shape as #881, where x-tooltip's `??` chain accepted the empty string
 * from a bare `x-tooltip` and never consulted `content`. readFlag() exists for
 * exactly this and already handles bare / "false" / "0".
 *
 * WHY THE EXISTING TESTS MISSED IT
 *
 * #861's probe sets one attribute and asks whether the element CHANGED. The
 * bar renders either way, so `striped` looked honoured. Nothing compared a
 * striped bar against an unstriped one. These tests do: the assertion is that
 * the two DIFFER, which no amount of "something rendered" can satisfy.
 */

// The 45-degree repeating wedge is what "striped" MEANS here. Matching a bare
// /gradient/ was too loose -- the bar carries a gradient in other states too,
// so the first version of this test passed while nothing was striped.
const STRIPE_PATTERN = /45deg/i;

async function mount(page: Page, html: string) {
  await page.evaluate(async (markup: string) => {
    document.getElementById('pb-probe')?.remove();
    const host = document.createElement('div');
    host.id = 'pb-probe';
    host.style.cssText = 'position:fixed;top:0;left:0;width:600px;z-index:99999';
    host.innerHTML = markup;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
  }, html);
  return page.locator('#pb-probe');
}

/** The built fill element, whichever block name it carries. */
const barOf = (host: any) => host.locator('[class*="progress-bar"], [class*="__bar"]').first();

test.describe('x-progressbar: bare boolean attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });
  });

  test('a bare `striped` paints stripes', async ({ page }) => {
    const host = await mount(page, `<div id="p" x-progressbar striped value="72" max="100"></div>`);
    const bar = barOf(host);
    await expect(bar).toHaveCount(1, { timeout: 10000 });

    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(
      bg,
      `the bar's background-image is "${bg}". A bare \`striped\` must switch stripes on -- ` +
      'requiring striped="true" makes the attribute dead for every doc and example, ' +
      'none of which spell it that way.',
    ).toMatch(STRIPE_PATTERN);
  });

  test('striped and unstriped actually differ', async ({ page }) => {
    // The assertion that could not be satisfied by "the bar rendered".
    const host = await mount(
      page,
      `<div id="a" x-progressbar striped value="72" max="100"></div>
       <div id="b" x-progressbar value="72" max="100"></div>`,
    );
    const striped = await host.locator('#a [class*="progress-bar"], #a [class*="__bar"]').first()
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    const plain = await host.locator('#b [class*="progress-bar"], #b [class*="__bar"]').first()
      .evaluate((el) => getComputedStyle(el).backgroundImage);

    expect(striped, 'the striped bar has no gradient').toMatch(STRIPE_PATTERN);
    expect(
      striped === plain,
      `both bars render background-image "${plain}" -- striped changes nothing`,
    ).toBe(false);
  });

  test('striped="true" still works', async ({ page }) => {
    // The one spelling that DID work must not break.
    const host = await mount(page, `<div id="p" x-progressbar striped="true" value="50" max="100"></div>`);
    const bg = await barOf(host).evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg).toMatch(STRIPE_PATTERN);
  });

  test('striped="false" turns stripes OFF', async ({ page }) => {
    // #747: "false"/"0" mean off. A bare-presence check would read the string
    // "false" as true, which is the opposite of what the markup says.
    const host = await mount(page, `<div id="p" x-progressbar striped="false" value="50" max="100"></div>`);
    const bg = await barOf(host).evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(bg, 'striped="false" still painted stripes').not.toMatch(STRIPE_PATTERN);
  });

  test('a bare `animated` animates', async ({ page }) => {
    // Same defect, same line: animated used the identical === 'true' compare.
    const host = await mount(page, `<div id="p" x-progressbar animated value="60" max="100"></div>`);
    const anim = await barOf(host).evaluate((el) => getComputedStyle(el).animationName);
    expect(anim, 'a bare `animated` set no animation').not.toBe('none');
  });
});
