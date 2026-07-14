import { test, expect } from '@playwright/test';

/**
 * #279 — <wb-cardimage>/<wb-cardvideo> intermittently rendered as empty
 * cards, most reliably on the FIRST navigation to Components from Home or
 * Behaviors in a fresh session. Root cause: cardimage.schema.json/
 * cardvideo.schema.json each have a real, non-empty $view that builds an
 * empty (src-less) <img>/<video>. cardimage()/cardvideo() (card.js) build
 * the REAL, correctly-sourced media unconditionally via their own
 * `element.innerHTML = ''` + rebuild — but SchemaBuilder's own
 * loadSchemaFile() fetch is async on a cold cache, so on first load it can
 * resolve AFTER the real behavior already built (and loaded) the image/
 * video, silently wiping it via that same innerHTML=''. Non-deterministic
 * (depends on network timing vs a warm schema cache), which is why it kept
 * recurring instead of getting caught once. Fixed by excluding the whole
 * wb-card* family from schema-driven DOM construction (schema-builder.js's
 * SCHEMA_EXCLUDED_TAGS + wb.js's processSchema()).
 *
 * card.js's cardimage()/cardvideo() also carry permanent [WB:card-media]
 * tracing (BUILD/PAINTED/STALE CHECK) for this exact failure mode — this
 * test asserts on the DOM state directly rather than parsing console output.
 */
test('cardimage/cardvideo survive a fresh nav to Components without being wiped', async ({ page }) => {
  await page.goto('http://localhost:3000/?page=home', { waitUntil: 'networkidle' });
  await page.click('a.nav__item[href="?page=components"]');

  // Give the real behavior time to build + load, AND give a stale/cold
  // schema fetch time to resolve and (if the bug regressed) wipe it — the
  // race window that made this non-deterministic before the fix.
  await page.waitForTimeout(2500);

  const survived = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('wb-cardimage img'));
    const videos = Array.from(document.querySelectorAll('wb-cardvideo video'));
    const check = (el: Element) => ({
      inDom: el.isConnected,
      hasCard: !!el.closest('wb-cardimage, wb-cardvideo'),
    });
    return {
      imageCount: images.length,
      videoCount: videos.length,
      images: images.map(check),
      videos: videos.map(check),
    };
  });

  expect(survived.imageCount, 'no <wb-cardimage> images found on Components page').toBeGreaterThan(0);
  expect(survived.videoCount, 'no <wb-cardvideo> videos found on Components page').toBeGreaterThan(0);
  for (const img of survived.images) {
    expect(img.inDom, 'cardimage <img> was removed from the DOM (schema/behavior race)').toBe(true);
    expect(img.hasCard, 'cardimage <img> is orphaned from its wb-cardimage card').toBe(true);
  }
  for (const video of survived.videos) {
    expect(video.inDom, 'cardvideo <video> was removed from the DOM (schema/behavior race)').toBe(true);
    expect(video.hasCard, 'cardvideo <video> is orphaned from its wb-cardvideo card').toBe(true);
  }
});
