/**
 * Card Image Rendering Test
 * =========================
 * Verifies x-cardimage actually displays images
 */

import { test, expect } from '@playwright/test';

test.describe('[x-cardimage] Rendering', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/site/cards.html');
    await page.waitForTimeout(1500);
  });

  test('[x-cardimage] should have img elements', async ({ page }) => {
    // Find all cardimage elements
    const cardImages = await page.locator('[x-cardimage]').all();
    expect(cardImages.length).toBeGreaterThan(0);
    
    console.log(`Found ${cardImages.length} [x-cardimage] elements`);
    
    for (let i = 0; i < cardImages.length; i++) {
      const card = cardImages[i];
      
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
    // Only top/bottom positions build a figure at all -- cardimage() has no
    // left/right branch. Excluding them by SELECTOR rather than by an
    // `if (count > 0)` guard: a guard is indistinguishable from a pass when
    // the locator matches nothing, which is what #863 was about.
    const cards = page.locator(
      '[x-cardimage][src]:not([position="left"]):not([position="right"])'
    );
    await expect(cards).not.toHaveCount(0);

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
        return {
          asked,
          // Chromium reports the computed value with spaces: "16 / 9".
          got: figure ? getComputedStyle(figure).aspectRatio : '(no figure rendered)',
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

  test('[x-cardvideo] should have video elements', async ({ page }) => {
    const cardVideos = await page.locator('[x-cardvideo]').all();
    expect(cardVideos.length).toBeGreaterThan(0);
    
    for (const card of cardVideos) {
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
    
    // Check x-cardimage
    const cardImages = await page.locator('[x-cardimage]').all();
    for (let i = 0; i < cardImages.length; i++) {
      const imgCount = await cardImages[i].locator('img').count();
      if (imgCount === 0) {
        issues.push(`[x-cardimage] #${i} has no img element`);
      }
    }
    
    // Check x-cardproduct (should have product images)
    const productCards = await page.locator('[x-cardproduct]').all();
    for (let i = 0; i < productCards.length; i++) {
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
