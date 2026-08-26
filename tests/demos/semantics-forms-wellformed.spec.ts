import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * demos/site/forms.html — every behavior host renders as its own SIBLING.
 *
 * Original defect (pre-4.0.0): the demo had <wb-switch> tags with no closing
 * tag and <wb-rating>/<wb-themecontrol> closed with </div>. Unknown custom
 * elements have no auto-close rules, so those nested/swallowed each other
 * instead of rendering as siblings — the switch and rating sections didn't
 * render correctly. A source-level `</wb-switch>` count caught it. (The
 * all-demos smoke test misses this: malformed tags throw no JS error.)
 *
 * #854 — why the check changed shape: 4.0.0 removed the component tags. The
 * hosts are now plain `<div x-switch>` / `<span x-rating>`, which the HTML
 * parser closes for us, so counting `</wb-switch>` in the source no longer
 * means anything. (The 4.0.0 rename also rewrote the tag list as CSS selectors
 * — `'[x-switch]'` — which turned `<${tag}[\s>]` into an illegal character
 * class (`x-s` is a descending range), so the check threw a SyntaxError on
 * every run instead of asserting anything at all.)
 *
 * The invariant the old count was a proxy for still matters and is asserted
 * directly against the parsed DOM here: every host appears, and no host ends up
 * INSIDE another host.
 */

const FORMS_PATH = path.join(process.cwd(), 'demos', 'site', 'forms.html');
const FORMS_URL = '/demos/site/forms.html';
const html = fs.readFileSync(FORMS_PATH, 'utf8');

/** Opening tags in the source that carry `attr`, e.g. `<div x-switch label="…">`. */
function sourceCount(attr: string): number {
  return (html.match(new RegExp(`<[a-z][a-z0-9-]*[^>]*\\s${attr}(?=[\\s=>])`, 'gi')) || []).length;
}

test.describe('semantics-forms.html — behavior hosts are siblings, not nested', () => {
  for (const attr of ['x-switch', 'x-rating', 'x-themecontrol']) {
    test(`[${attr}] hosts all render as their own siblings`, async ({ page }) => {
      await page.goto(FORMS_URL, { waitUntil: 'domcontentloaded' });

      const inSource = sourceCount(attr);
      const inDom = await page.locator(`[${attr}]`).count();
      expect(
        inDom,
        `[${attr}]: ${inSource} host(s) in demos/site/forms.html but ${inDom} in the parsed DOM — ` +
          `an unclosed or wrongly closed tag lost some of them`,
      ).toBe(inSource);

      const nested = await page.locator(`[${attr}] [${attr}]`).count();
      expect(
        nested,
        `[${attr}]: ${nested} host(s) parsed INSIDE another [${attr}] — an unclosed host, ` +
          `or one closed with the wrong end tag, swallowed the examples after it`,
      ).toBe(0);
    });
  }
});
