import { test, expect, Page } from '../fixtures/offline';

/**
 * #917: `<figure x-demo>` renders exactly what `<div x-demo>` renders.
 *
 * DEMOS-AND-DOCS-STANDARDS.md §1 names <figure> as the preferred demo host, and
 * <figure> is itself auto-injected (tag-map.js nativeMap 'figure' -> figure()).
 * So on a page with auto-injection on, a <figure x-demo> runs two behaviors on
 * one element. Measured before the fix, in BOTH runtimes, they did not compose
 * cleanly:
 *
 *   - figure() reaches into the element: the example's own <img> got
 *     x-figure__zoomable and a lightbox onclick that the same example on a
 *     <div> host does not have -- the host tag changed what the example does;
 *   - the host itself got class x-figure;
 *   - the UA's `figure { margin: 1em 40px }` left a 16px top margin that a
 *     <div> host never had, so every demo moved down.
 *
 * Fixed at the root: x-demo owns its host outright, so no tag behavior runs on
 * it (replacement-guard.js HOST_OWNING_EXPLICIT), and demo.css undoes the UA
 * margin at zero specificity. A <figure> INSIDE a demo is an example and still
 * gets figure() -- the nested pair below checks that too.
 *
 * tests/fixtures/x-demo-host.html holds each example twice, once per host, as
 * AUTHORED markup (so the code panel comes from the page source, the real
 * path), and loads wb.js or wb-lazy.js from ?runtime=.
 */

const PAIRS = ['button', 'image', 'nested'];

/** Every computed property of the host and each descendant, tag names ignored. */
async function snapshot(page: Page, id: string) {
  return page.evaluate((hostId) => {
    const host = document.getElementById(hostId)!;
    const els = [host, ...host.querySelectorAll('*')];
    return els.map((el, i) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const props: Record<string, string> = {};
      for (let k = 0; k < cs.length; k++) props[cs[k]] = cs.getPropertyValue(cs[k]);
      return {
        i,
        // The host's own tag is the one thing allowed to differ.
        tag: el === host ? '(host)' : el.localName,
        cls: el.getAttribute('class') || '',
        click: typeof (el as HTMLElement).onclick === 'function',
        w: Math.round(r.width), h: Math.round(r.height),
        props,
      };
    });
  }, id);
}

for (const runtime of ['wb', 'wb-lazy']) {
  test.describe(`<figure x-demo> renders the same as <div x-demo> (${runtime}, autoInject on)`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/tests/fixtures/x-demo-host.html?runtime=${runtime === 'wb' ? 'wb' : 'lazy'}`);
      await page.waitForFunction(() => {
        const hosts = document.querySelectorAll('[x-demo]');
        return hosts.length === 6 && [...hosts].every((h) =>
          h.querySelector(':scope > .x-demo__grid') && h.querySelector('.x-demo__code') && h.classList.contains('x-demo--measured'));
      }, null, { timeout: 15000 });
    });

    test('the figure host shows the live demo AND its code panel', async ({ page }) => {
      for (const name of PAIRS) {
        const fig = page.locator(`#figure-${name}`);
        await expect(fig.locator(':scope > .x-demo__grid'), `${name}: live grid`).toHaveCount(1);
        await expect(fig.locator('.x-demo__code'), `${name}: code panel`).toHaveCount(1);
        const [divCode, figCode] = await Promise.all([
          page.locator(`#div-${name} .x-demo__code`).innerText(),
          fig.locator('.x-demo__code').innerText(),
        ]);
        expect(figCode.trim(), `${name}: the figure's panel shows the authored source`).not.toBe('');
        expect(figCode, `${name}: same source as the div host`).toBe(divCode);
      }
    });

    test('figure() does not stack on the demo host, and does not reach into the example', async ({ page }) => {
      await expect(page.locator('#figure-button'), 'host is the demo, not an x-figure').not.toHaveClass(/\bx-figure\b/);
      const img = page.locator('#figure-image img');
      await expect(img, 'the example <img> gets no lightbox from its host').not.toHaveClass(/x-figure__zoomable/);
      expect(await img.evaluate((el) => typeof (el as HTMLImageElement).onclick)).not.toBe('function');
      // A real <figure> that IS the example still gets its own behavior.
      await expect(page.locator('#figure-nested .x-demo__grid > figure')).toHaveClass(/\bx-figure\b/);
    });

    test('every element computes the same styles on either host', async ({ page }) => {
      for (const name of PAIRS) {
        const [a, b] = await Promise.all([snapshot(page, `div-${name}`), snapshot(page, `figure-${name}`)]);
        expect(b.length, `${name}: same element count`).toBe(a.length);
        const diffs: string[] = [];
        for (let i = 0; i < a.length; i++) {
          for (const key of ['tag', 'cls', 'click', 'w', 'h'] as const) {
            if (a[i][key] !== b[i][key]) diffs.push(`#${i} ${a[i].tag} ${key}: div=${a[i][key]} figure=${b[i][key]}`);
          }
          for (const p of Object.keys(a[i].props)) {
            if (a[i].props[p] !== b[i].props[p]) diffs.push(`#${i} ${a[i].tag} ${p}: div=${a[i].props[p]} figure=${b[i].props[p]}`);
          }
        }
        expect(diffs, `${name}: differences between the hosts`).toEqual([]);
      }
    });
  });
}
