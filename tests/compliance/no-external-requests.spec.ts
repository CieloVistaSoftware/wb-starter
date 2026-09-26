/**
 * NO EXTERNAL REQUESTS
 * ====================
 * The site loads nothing from a CDN. Every third-party dependency (marked,
 * highlight.js themes, ajv, Chart.js, the web fonts, and the React / Vue /
 * Svelte / Angular / SolidJS / HTMX builds on demos/frameworks.html) is
 * vendored under src/lib/ -- see src/lib/VENDOR.md -- and loaded from there in
 * dev, in tests and on the published GitHub Pages site. Tests must never need
 * the internet.
 *
 * This drives real pages and records every request the browser makes. Any
 * request to a host other than the local test server fails the test, with the
 * offending URLs listed. External requests are also aborted, so a regression
 * fails fast instead of hanging on an unreachable host.
 *
 * Two narrow exemptions, both CONTENT rather than dependencies (nothing on the
 * page waits on them, and a failed load degrades to a missing picture, not a
 * broken page):
 *   - audio/video: by the owner's rule (#762, enforced by
 *     tests/regression/media-sources-are-remote.spec.ts) media sources are
 *     remote on purpose;
 *   - example photos from the placeholder-image services the demos use as
 *     sample content (PLACEHOLDER_IMAGE_HOSTS below) -- only when the browser
 *     requests them AS AN IMAGE. A script, stylesheet or font from any of
 *     those hosts still fails.
 */

import { test, expect, type Page, type Request } from '@playwright/test';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

const PLACEHOLDER_IMAGE_HOSTS = new Set(['picsum.photos', 'fastly.picsum.photos', 'images.unsplash.com', 'i.pravatar.cc']);

/** Sample content (see header), never a code/style/font dependency. */
function isExemptContent(req: Request): boolean {
  if (req.resourceType() === 'media') return true;
  return req.resourceType() === 'image' && PLACEHOLDER_IMAGE_HOSTS.has(new URL(req.url()).hostname);
}

async function recordExternal(page: Page): Promise<string[]> {
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !LOCAL_HOSTS.has(url.hostname)) {
      if (!isExemptContent(req)) external.push(`${req.resourceType()} ${req.url()}`);
      return route.abort();
    }
    return route.continue();
  });
  return external;
}

/** Scroll the whole page so lazily-loaded content (IntersectionObserver) runs. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

const ROUTES: Array<{ name: string; path: string; ready?: (page: Page) => Promise<void> }> = [
  { name: 'home', path: '/' },
  { name: 'behaviors', path: '/?page=behaviors' },
  {
    name: 'frameworks demo',
    path: '/demos/frameworks.html',
    ready: async (page) => {
      // Every framework must actually mount from the vendored copies.
      for (const sel of ['#react-root button', '#vue-app button', '#svelte-root button', '#angular-root button', '#solid-root button']) {
        await expect(page.locator(sel).first(), `${sel} must render from vendored code`).toBeVisible({ timeout: 30000 });
      }
    },
  },
  {
    name: 'doc viewer',
    path: '/public/doc-viewer.html',
    ready: async (page) => {
      // marked is loaded on demand -- wait for real rendered markdown.
      await expect(page.locator('#content h1, #content h2').first()).toBeVisible({ timeout: 30000 });
      expect(await page.evaluate(() => typeof (window as any).marked), 'marked must load (from src/lib/marked)').toBe('object');
    },
  },
  {
    name: 'forms demo (ajv)',
    path: '/demos/site/forms.html',
    ready: async (page) => {
      // The x-label section validates its schema with the vendored ajv.
      await expect(page.locator('#label-schema-validation pre')).toContainText('Schema validation', { timeout: 30000 });
    },
  },
  { name: 'code theme control', path: '/demos/site/content.html' },
  {
    name: 'performance dashboard (chart.js)',
    path: '/public/performance-dashboard.html',
    ready: async (page) => {
      await page.waitForFunction(() => typeof (window as any).Chart === 'function', null, { timeout: 15000 });
    },
  },
];

test.describe('no request leaves localhost', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) makes no external requests`, async ({ page }) => {
      test.setTimeout(90000);
      const external = await recordExternal(page);
      await page.goto(route.path, { waitUntil: 'load' });
      if (route.ready) await route.ready(page);
      await scrollThrough(page);
      await settle(page);
      expect(external, `external requests from ${route.path} -- vendor them under src/lib (see src/lib/VENDOR.md)`).toEqual([]);
    });
  }
});
