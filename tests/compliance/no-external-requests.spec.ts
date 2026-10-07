/**
 * NO TEST REQUEST ESCAPES TO THE INTERNET
 * =======================================
 * The site loads its dependencies from CDNs and its sample media from remote
 * hosts -- in development exactly as in production. The tests must never
 * depend on the network, so tests/fixtures/offline.ts routes every browser
 * request: localhost goes to the test server, a CDN URL is answered from the
 * recorded cache (tests/fixtures/offline/, rebuilt by
 * scripts/record-offline-cache.mjs), sample media from generated stand-ins,
 * and ANYTHING ELSE is aborted and recorded as "offline-blocked".
 *
 * This drives the pages that load the most third-party code and media and
 * fails on any blocked URL -- i.e. a gap in the cache or the media mapping --
 * listing the URLs. The fix for a failure is to re-record the cache
 * (`NODE_USE_ENV_PROXY=1 node scripts/record-offline-cache.mjs`) or extend
 * scripts/sample-media-catalog.mjs; never to rewrite the site's URLs.
 *
 * The pages also have to actually WORK offline: the frameworks demo mounts
 * every framework from the cache, the doc viewer renders markdown with the
 * cached marked, and the performance dashboard gets Chart.js.
 */

import { test, expect, type Page } from '../fixtures/offline';
import { openBehaviorsPage } from '../helpers/behaviors-page';

/** Scroll the whole page so lazily-loaded content (IntersectionObserver) runs. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      // Two frames per step for the lazy observer to see it (#1516: not 50ms).
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, 0);
  });
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

/** Behaviors whose demos load remote media (photos, audio, video, embeds). */
const MEDIA_BEHAVIORS = ['audio', 'video', 'img', 'figure', 'gallery', 'youtube', 'vimeo', 'cardimage', 'cardvideo', 'cardhero', 'cardprofile', 'avatar'];

type RouteCase = { name: string; path: string; ready?: (page: Page) => Promise<void> };

const ROUTES: RouteCase[] = [
  { name: 'home', path: '/' },
  {
    name: 'behaviors (media rows opened)',
    path: '/?page=behaviors',
    ready: async (page) => {
      await openBehaviorsPage(page);
      let opened = 0;
      for (const name of MEDIA_BEHAVIORS) {
        await page.fill('#behaviors-search', name);
        // A token can have several rows (the behavior and its attributes), some
        // collapsed -- take the first one a user could actually click.
        const row = page
          .locator(`.behaviors-search-results__row[data-browse-token="x-${name}"], .behaviors-search-results__row[data-browse-token="${name}"]`)
          .filter({ visible: true })
          .first();
        if (!(await row.waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false))) continue;
        await row.click();
        // The example has rendered once the live panel is no longer busy (#1516: not 400ms).
        await expect(page.locator('#behaviors-live')).not.toHaveAttribute('aria-busy', /.*/, { timeout: 15000 });
        await settle(page);
        opened++;
      }
      expect(opened, 'at least some media behaviors must be listed on the behaviors page').toBeGreaterThan(3);
    },
  },
  {
    name: 'frameworks demo',
    path: '/demos/frameworks.html',
    ready: async (page) => {
      // Every framework must actually mount from the cached CDN responses.
      for (const sel of ['#react-root button', '#vue-app button', '#svelte-root button', '#angular-root button', '#solid-root button']) {
        await expect(page.locator(sel).first(), `${sel} must render offline`).toBeVisible({ timeout: 30000 });
      }
    },
  },
  {
    name: 'doc viewer',
    path: '/public/doc-viewer.html',
    ready: async (page) => {
      // marked is loaded on demand from jsdelivr -- wait for real rendered markdown.
      await expect(page.locator('#content h1, #content h2').first()).toBeVisible({ timeout: 30000 });
      expect(await page.evaluate(() => typeof (window as any).marked), 'marked must load (from the cache)').toBe('object');
    },
  },
  {
    name: 'forms demo (ajv)',
    path: '/demos/site/forms.html',
    ready: async (page) => {
      await expect(page.locator('#label-schema-validation pre')).toContainText('Schema validation', { timeout: 30000 });
    },
  },
  {
    name: 'performance dashboard (chart.js)',
    path: '/public/performance-dashboard.html',
    ready: async (page) => {
      await page.waitForFunction(() => typeof (window as any).Chart === 'function', null, { timeout: 15000 });
    },
  },
  { name: 'cards', path: '/demos/site/cards.html' },
  { name: 'content (code theme control)', path: '/demos/site/content.html' },
  { name: 'feedback', path: '/demos/site/feedback.html' },
  { name: 'shop now', path: '/demos/site/shop-now.html' },
  { name: 'autoinject', path: '/demos/autoinject.html' },
  { name: 'playground', path: '/demos/playground.html' },
  { name: 'charity food', path: '/demos/charity-food.html' },
  { name: 'landing page showcase', path: '/demos/landing-page-showcase.html' },
  { name: 'hero variants', path: '/?page=hero-variants' },
];

test.describe('no test request escapes to the internet', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) needs nothing outside the offline cache`, async ({ page, offlineBlocked }) => {
      test.setTimeout(120000);
      await page.goto(route.path, { waitUntil: 'load' });
      if (route.ready) await route.ready(page);
      await scrollThrough(page);
      await settle(page);
      expect(
        offlineBlocked,
        `external requests from ${route.path} that the offline cache does not cover -- ` +
          're-record it (NODE_USE_ENV_PROXY=1 node scripts/record-offline-cache.mjs) or map the media in scripts/sample-media-catalog.mjs',
      ).toEqual([]);
    });
  }
});
