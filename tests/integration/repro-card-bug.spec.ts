import { test, expect } from '../fixtures/offline';
import { pagePath } from '../helpers/page-path';
import { pickBehavior } from '../helpers/behaviors-page';

/**
 * #279 — <div x-cardimage>/<div x-cardvideo> intermittently rendered as empty
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
 * x-card* family from schema-driven DOM construction (schema-builder.js's
 * SCHEMA_EXCLUDED_TAGS + wb.js's processSchema()).
 *
 * card.js's cardimage()/cardvideo() also carry permanent [WB:card-media]
 * tracing (BUILD/PAINTED/STALE CHECK) for this exact failure mode — this
 * test asserts on the DOM state directly rather than parsing console output.
 */
test('cardimage/cardvideo survive a fresh nav to Components without being wiped', async ({ page }) => {
  // Two picks, each followed by the #279 race window.
  test.setTimeout(60_000);
  await page.goto('/?page=home', { waitUntil: 'networkidle' });
  await page.click(`a.nav__item[href="${pagePath('behaviors')}"]`);

  // The behaviors page is a searchable browser now (#910): nothing is on the
  // stage until a behavior is picked, so the fresh navigation above is
  // followed by picking each media card the way a reader would. The race this
  // guards (#279) is a cold schema fetch resolving AFTER the behavior built its
  // media, so each pick is still followed by a wait long enough for a stale
  // fetch to land and wipe it, if the exclusion ever regressed.
  const survivors = async (token: 'x-cardimage' | 'x-cardvideo', media: 'img' | 'video') => {
    await pickBehavior(page, token);
    await page.waitForTimeout(2500);
    return page.evaluate(([t, m]) => {
      const found = Array.from(document.querySelectorAll(`#behaviors-live-example [${t}] ${m}`));
      return found.map((el) => ({
        inDom: el.isConnected,
        hasCard: !!el.closest('[x-cardimage], [x-cardvideo]'),
      }));
    }, [token, media] as const);
  };
  const images = await survivors('x-cardimage', 'img');
  const videos = await survivors('x-cardvideo', 'video');
  const survived = { imageCount: images.length, videoCount: videos.length, images, videos };

  expect(survived.imageCount, 'no <div x-cardimage> images found on Components page').toBeGreaterThan(0);
  expect(survived.videoCount, 'no <div x-cardvideo> videos found on Components page').toBeGreaterThan(0);
  for (const img of survived.images) {
    expect(img.inDom, 'cardimage <img> was removed from the DOM (schema/behavior race)').toBe(true);
    expect(img.hasCard, 'cardimage <img> is orphaned from its [x-cardimage] card').toBe(true);
  }
  for (const video of survived.videos) {
    expect(video.inDom, 'cardvideo <video> was removed from the DOM (schema/behavior race)').toBe(true);
    expect(video.hasCard, 'cardvideo <video> is orphaned from its [x-cardvideo] card').toBe(true);
  }
});
