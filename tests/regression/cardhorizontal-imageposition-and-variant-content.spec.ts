import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#455): two separate reports on the same page --
 * tests/fixtures/cards-permutation-matrix.html's "imagePosition variants"
 * and "variant variants" sections for x-cardhorizontal:
 *
 * 1. "no images" -- the imagePosition-variants markup
 *    (`<div x-cardhorizontal image-position="left">image-position=left</div>`)
 *    never carried an `image="..."` attribute at all. cardhorizontal()
 *    (src/wb-viewmodels/card.js) only builds a <figure><img> when
 *    config.image is truthy, so these two cards rendered as empty gray
 *    boxes -- confirmed live via screenshot, zero <img> elements present.
 *    Root cause: fixture-authoring gap (every other section in this file
 *    passes a real image= attribute), not a component defect.
 *
 * 2. "none of this text is shwoing" -- the variant-variants markup relies
 *    on plain inner text ("variant=default" etc.) as the card body, but
 *    cardhorizontal()'s own local `config` object only ever read `image`/
 *    `imagePosition`/`imageWidth` -- it never captured element.innerHTML
 *    as a `content` fallback the way card()/cardimage()/cardvideo() all
 *    do, so `element.innerHTML = ''` (cardhorizontal(), right after config
 *    is built) permanently wiped that text before it was ever captured.
 *    This is a real component bug: ANY x-cardhorizontal relying on plain
 *    inner text for its body loses it, not just this fixture.
 *
 * Both are fixed together: cardhorizontal() now captures innerHTML as a
 * content fallback (matching cardimage()), and the fixture markup gained
 * a real image= attribute on the imagePosition-variants cards plus
 * descriptive body copy on the variant-variants cards.
 */
test.describe('[x-cardhorizontal] permutation-matrix examples actually render (#455)', () => {
  test('imagePosition variants render a real, visible <img>', async ({ page }) => {
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');

    const section = page.locator('#cardhorizontal-imageposition-variants');
    await expect(section, 'the matrix fixture should still have the imagePosition variants section').toHaveCount(1);
    await section.scrollIntoViewIfNeeded();

    const cards = section.locator('[x-cardhorizontal]');
    await expect(cards).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const card = cards.nth(i);
      const img = card.locator('img');
      await expect(img, `card ${i} (image-position) must render a real <img>`).toHaveCount(1);
      const src = await img.getAttribute('src');
      expect(src, `card ${i} img must have a non-empty src`).toBeTruthy();
      await expect(img, `card ${i} img must actually be visible, not just present in the DOM`).toBeVisible();
    }
  });

  test('variant variants render real, visible body text describing the variant', async ({ page }) => {
    await page.goto('/tests/fixtures/cards-permutation-matrix.html');

    const section = page.locator('#cardhorizontal-variant-variants');
    await expect(section, 'the matrix fixture should still have the variant variants section').toHaveCount(1);
    await section.scrollIntoViewIfNeeded();

    const cards = section.locator('[x-cardhorizontal]');
    await expect(cards).toHaveCount(4);

    const seenTexts = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      const body = card.locator('.x-card__horiz-body');
      await expect(body, `card ${i} must render a body element, not silently drop its content`).toHaveCount(1);
      await expect(body, `card ${i} body must actually be visible`).toBeVisible();

      const text = ((await body.textContent()) || '').trim();
      expect(text.length, `card ${i} body text must not be empty`).toBeGreaterThan(0);
      // Content must genuinely be DESCRIPTIVE (John: "change it to describe
      // what it should look like"), not the old raw "variant=default" /
      // "variant=elevated" placeholder echo of the attribute itself.
      expect(text, `card ${i} body text must not just echo the raw attribute ("variant=...")`).not.toMatch(/^variant=/i);
      seenTexts.add(text);
    }
    expect(seenTexts.size, 'all 4 variant descriptions must be distinct from each other').toBe(4);
  });
});
