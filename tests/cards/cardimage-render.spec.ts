/**
 * Card Image Rendering Test
 * =========================
 * Verifies x-cardimage actually displays images
 *
 * See it by hand: Open /demos/site/cards.html and scroll to the cardimage
 * cards with position="left" and position="right". Before: both showed text
 * with no picture (#877). Now: each shows its picture beside the text, and the
 * new cardimage-render test fails if either loses it.
 */

import { test, expect } from '../fixtures/offline';
import { buildInView } from '../base';

test.describe('[x-cardimage] Rendering', () => {
  
  // cards.html runs the lazy runtime (#491): a card below the fold is not
  // built until it is scrolled to, so the fixed 1500ms sleep that stood here
  // only ever covered the first screenful. Each test now brings every card it
  // inspects into view with buildInView() and waits for THAT card's x-ready.
  // Walking ~90 cards one at a time needs more than the default 30s.
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/demos/site/cards.html');
  });

  test('[x-cardimage] should have img elements', async ({ page }) => {
    // Find all cardimage elements
    const cardImages = await page.locator('[x-cardimage]').all();
    expect(cardImages.length).toBeGreaterThan(0);
    
    console.log(`Found ${cardImages.length} [x-cardimage] elements`);
    
    for (let i = 0; i < cardImages.length; i++) {
      const card = cardImages[i];
      await buildInView(card);
      
      // Each cardimage should have an img element
      const img = card.locator('img');
      const imgCount = await img.count();
      
      console.log(`Card ${i}: found ${imgCount} img elements`);
      expect(imgCount).toBeGreaterThan(0);
      
      // Get the src attribute
      const src = await img.first().getAttribute('src');
      console.log(`Card ${i} image src: ${src}`);
      expect(src).toBeTruthy();
      expect(src?.length).toBeGreaterThan(10); // Should be a real URL
    }
  });

  test('[x-cardimage] should have title rendered', async ({ page }) => {
    // Find Mountain Vista card
    const mountainCard = page.locator('[x-cardimage][title="Mountain Vista"]');
    await buildInView(mountainCard);
    await expect(mountainCard).toBeVisible();
    
    // Should have title text
    const title = mountainCard.locator('.x-card__title, h3');
    const titleText = await title.textContent();
    expect(titleText).toContain('Mountain Vista');
  });

  // #873: this test used to read the computed aspect-ratio and console.log it.
  // No expect() anywhere in the body -- the gate
  // (tests/compliance/tests-must-assert.spec.ts) listed it as asserting
  // nothing. It could not distinguish "16 / 9" from "auto" from a figure that
  // was never built.
  //
  // cardimage() (src/wb-viewmodels/card.js:807/822) sets
  // `figure.style.aspectRatio = config.aspect`, where config.aspect is the
  // `aspect` attribute or '16/9' by default. So the expectation is DERIVED
  // per-card from the markup and compared against the COMPUTED style: every
  // card must paint the ratio it asked for, and a card that asked for nothing
  // must paint the documented default.
  test('[x-cardimage] figures paint the aspect ratio their markup asked for', async ({ page }) => {
    // Top/bottom only. Left/right DO build a figure now (card.js puts it in
    // its own grid column, #877), but a side image fills that column's height,
    // so the aspect ratio is not the box to measure there -- the test below
    // holds that they render their image. Excluded by SELECTOR rather than by
    // an `if (count > 0)` guard: a guard is indistinguishable from a pass when
    // the locator matches nothing, which is what #863 was about.
    const cards = page.locator(
      '[x-cardimage][src]:not([position="left"]):not([position="right"])'
    );
    await expect(cards).not.toHaveCount(0);

    // Nothing below the fold is built until it is scrolled to (#491), so the
    // poll below could only ever see the first screenful -- it reported 26
    // cards with no figure, each of which rendered once scrolled to.
    for (const card of await cards.all()) await buildInView(card);

    // WB.scan() is async and cards.html does not await it, so wait on the
    // OUTCOME with an auto-retrying matcher -- reading computed styles off a
    // one-shot query would race hydration under --workers=8.
    await expect
      .poll(
        async () =>
          cards.evaluateAll(
            (els) => els.filter((el) => !el.querySelector('figure, .x-card__figure')).length
          ),
        {
          timeout: 20000,
          message: 'some [x-cardimage] never rendered a <figure> at all',
        }
      )
      .toBe(0);

    const rows = await cards.evaluateAll((els) =>
      els.map((el) => {
        // '16/9' is cardimage()'s own default when the attribute is absent.
        const asked = (el.getAttribute('aspect') || '16/9').trim();
        const figure = el.querySelector('figure, .x-card__figure');
        // A captioned figure hands its ratio to the <img> (card.css, 3afb42b7):
        // the figure itself goes `aspect-ratio: auto` so overflow:hidden cannot
        // clip the <figcaption>. The ratio the markup asked for is then painted
        // by the image, so that is the box to measure.
        const painter = figure?.querySelector(':scope > figcaption') ? figure.querySelector('img') : figure;
        return {
          asked,
          // Chromium reports the computed value with spaces: "16 / 9".
          got: painter ? getComputedStyle(painter).aspectRatio : '(no figure rendered)',
        };
      })
    );

    const normalise = (v: string) => v.replace(/\s+/g, '');
    const wrong = rows.filter((r) => normalise(r.got) !== normalise(r.asked));

    expect(
      wrong,
      'every [x-cardimage] must render a <figure> whose computed aspect-ratio is the one '
      + 'its `aspect` attribute asked for (or 16/9, cardimage()\'s documented default, when '
      + 'the attribute is absent).\n'
      + wrong.map((r) => `  asked ${r.asked} -> got ${r.got}`).join('\n'),
    ).toEqual([]);
  });

  // #877: "cardimage position=left/right renders no image". cardimage() had no
  // left/right branch, so those cards rendered text only. They now build the
  // figure; this holds both positions to an <img> with the card's own src.
  test('[x-cardimage] left and right positions render their image (#877)', async ({ page }) => {
    for (const position of ['left', 'right']) {
      const card = page.locator(`[x-cardimage][position="${position}"][src]`).first();
      await expect(card, `cards.html has no position="${position}" card to check`).toHaveCount(1);
      await buildInView(card);
      const img = card.locator('figure img, .x-card__figure img').first();
      await expect(img, `position="${position}" rendered no image`).toBeAttached({ timeout: 20000 });
      expect(await img.getAttribute('src')).toBe(await card.getAttribute('src'));
    }
  });

  test('[x-cardvideo] should have video elements', async ({ page }) => {
    const cardVideos = await page.locator('[x-cardvideo]').all();
    expect(cardVideos.length).toBeGreaterThan(0);
    
    for (const card of cardVideos) {
      await buildInView(card);
      const video = card.locator('video');
      const videoCount = await video.count();
      console.log(`Video card: found ${videoCount} video elements`);
      expect(videoCount).toBeGreaterThan(0);
      
      const src = await video.first().getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('ALL cards with images should render them', async ({ page }) => {
    const issues: string[] = [];
    // Every card family below is built lazily (#491); bring each into view and
    // wait for it to settle before counting what it rendered.
    for (const card of await page.locator(
      '[x-cardimage], [x-cardproduct], [x-cardprofile], [x-cardtestimonial], [x-cardhorizontal]'
    ).all()) await buildInView(card);
    
    // Check x-cardimage
    const cardImages = await page.locator('[x-cardimage]').all();
    for (let i = 0; i < cardImages.length; i++) {
      const imgCount = await cardImages[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`[x-cardimage] #${i} has no img element`);
      }
    }
    
    // Check x-cardproduct (the image is OPTIONAL). cardproduct() builds its
    // <figure><img> only when `image` is set; cards.html now demos every
    // cardproduct attribute one at a time, and most of those cards carry no
    // image by design. Gated on the attribute like the avatar checks below.
    const productCards = await page.locator('[x-cardproduct]').all();
    for (let i = 0; i < productCards.length; i++) {
      if (!(await productCards[i].getAttribute('image'))) continue;
      const imgCount = await productCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`[x-cardproduct] #${i} has no img element`);
      }
    }
    
    // Check x-cardprofile (avatars are OPTIONAL -- #843)
    // cardprofile() in src/wb-viewmodels/card.js renders an <img> only when the
    // `avatar` attribute is set; `cover` is painted as a CSS background-image on
    // a figure, never an <img>. So a profile card with no `avatar` is CORRECT
    // with zero <img> elements -- 12 of the 15 demos on cards.html are exactly
    // that. Gate the check on the attribute, the same way the x-cardtestimonial
    // and x-cardhorizontal checks below already do.
    const profileCards = await page.locator('[x-cardprofile]').all();
    for (let i = 0; i < profileCards.length; i++) {
      const hasAvatar = await profileCards[i].getAttribute('avatar');
      if (!hasAvatar) continue;
      const imgCount = await profileCards[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`[x-cardprofile] #${i} has avatar attr but no img element`);
      }
    }
    
    // Check x-cardtestimonial (optional avatars)
    const testimonialCards = await page.locator('[x-cardtestimonial]').all();
    for (let i = 0; i < testimonialCards.length; i++) {
      const hasAvatar = await testimonialCards[i].getAttribute('avatar');
      if (hasAvatar) {
        const imgCount = await testimonialCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`[x-cardtestimonial] #${i} has avatar attr but no img element`);
        }
      }
    }
    
    // Check x-cardhorizontal
    const horizCards = await page.locator('[x-cardhorizontal]').all();
    for (let i = 0; i < horizCards.length; i++) {
      const hasImage = await horizCards[i].getAttribute('image');
      if (hasImage) {
        const imgCount = await horizCards[i].locator('img').count();
        if (imgCount === 0) {
          issues.push(`[x-cardhorizontal] #${i} has image attr but no img element`);
        }
      }
    }
    
    if (issues.length > 0) {
      console.error('Image rendering issues:');
      issues.forEach(issue => console.error(`  - ${issue}`));
    }
    
    expect(issues).toHaveLength(0);
  });
});
