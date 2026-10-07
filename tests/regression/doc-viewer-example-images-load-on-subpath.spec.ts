/**
 * EVERY EXAMPLE IMAGE IN EVERY BEHAVIOR DOC LOADS IN THE DOC VIEWER (#1183)
 * ========================================================================
 * John, 2026-09-18, error log on doc-viewer.html?file=docs/behaviors/avatar.md:
 * "img failed to load: …/public/images/placeholder.svg". Done means every
 * example image in every behavior doc loads in the viewer, on localhost AND on
 * the deployed sub-path.
 *
 * The docs write images two ways: `/images/x.svg` (root) and `../../images/x.svg`
 * (relative to the doc's own folder). The viewer rewrote only the first before
 * rendering. The relative form was resolved by the browser against the VIEWER
 * page (/wb-starter/public/doc-viewer.html), which walks up past /wb-starter/
 * to github.io/images/x.svg -- a 404 that fires the moment the <img> is
 * inserted, before the later rebase pass can correct the attribute. Locally the
 * site root IS the origin root, so the bug hid there.
 *
 * So the docs are loaded exactly as they deploy: the site mounted under
 * /wb-starter/, with anything outside it answered 404 like github.io.
 */
import { test, expect } from '../fixtures/offline';
import { readdirSync, readFileSync } from 'node:fs';
import { mountUnderSubPath } from '../helpers/sub-path';
import { settlePage } from '../base';

// ANY example image, not only a local one (#1122).
//
// This filter used to require a LOCAL path, because in September every doc had
// one and the bug was the viewer mis-resolving it. #1122 then made media remote
// for real, which emptied the filter -- and the guard below correctly refused to
// pass on an empty set (#863: a filter that matches nothing proves nothing).
//
// Deleting this spec was the wrong answer: what it actually proves is that every
// example image RENDERS in the doc viewer under the deployed sub-path, and that
// is just as true of a remote URL. The per-doc test below already inspects every
// #content img regardless of host. So the filter widens and the guard stays.
//
// Local paths are now forbidden outright by
// tests/regression/media-sources-are-remote.spec.ts, which is the right place
// for that rule -- one invariant, one gate.
const EXAMPLE_IMAGE = /\s(?:src|image|avatar|cover|poster|background)="[^"]*\.(?:svg|png|jpe?g|gif|webp)"/;

const DOCS = readdirSync('docs/behaviors')
  .filter((f) => f.endsWith('.md'))
  .filter((f) => EXAMPLE_IMAGE.test(readFileSync(`docs/behaviors/${f}`, 'utf8')));

test('docs with example images exist to check', () => {
  expect(DOCS.length, 'a filter that matches nothing proves nothing (#863)').toBeGreaterThan(10);
});

for (const doc of DOCS) {
  test(`${doc}: every example image loads in the doc viewer under /wb-starter/`, async ({ page, baseURL }) => {
    // The waits below add up to more than the default 30s (20s load, a frame
    // per element scrolled, 15s idle, 15s image poll), so an image-heavy doc
    // under full-suite load ran out of time, not out of correctness (#1302,
    // #341: the budget has to be bigger than the thing it is timing).
    test.setTimeout(90_000);
    const mount = await mountUnderSubPath(baseURL!);
    try {
      const failed: string[] = [];
      page.on('response', (r) => {
        if (r.request().resourceType() === 'image' && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
      });
      await page.goto(`${mount.base}public/doc-viewer.html?file=${encodeURIComponent(`docs/behaviors/${doc}`)}`);
      await expect(page.locator('#content')).toHaveClass(/x-mdhtml--loaded/, { timeout: 20_000 });

      // Everything built and every image settled, loaded or not.
      await page.evaluate(async () => {
        const content = document.getElementById('content')!;
        for (const el of Array.from(content.querySelectorAll('*'))) {
          (el as HTMLElement).scrollIntoView({ block: 'center' });
          await new Promise((r) => requestAnimationFrame(r));
        }
      });
      await settlePage(page, { timeout: 15000 });
      await expect.poll(() => page.$$eval('#content img', (imgs) =>
        imgs.every((i) => (i as HTMLImageElement).complete)), { timeout: 15_000 }).toBe(true);

      const broken = await page.$$eval('#content img', (imgs) => imgs
        .filter((i) => !(i as HTMLImageElement).closest('pre, code') && (i as HTMLImageElement).naturalWidth === 0)
        .map((i) => (i as HTMLImageElement).src));
      expect(failed, 'image requests that 404ed').toEqual([]);
      expect(broken, 'images that rendered broken').toEqual([]);
    } finally {
      await mount.close();
    }
  });
}
