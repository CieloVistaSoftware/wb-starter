import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * REGRESSION (#196 / #200 / #204 / #205): overlay demo markup must use the
 * canonical PLAIN attributes that the overlay behaviors actually read.
 *
 * The old demos used data-* attributes the components never read — e.g.
 * `x-drawer data-position="left"` was ignored, so x-drawer fell back to its
 * default `position: 'right'` and BOTH drawer buttons opened to the right
 * (#204/#205). Likewise data-title/data-content/data-message rendered the
 * overlays with their default placeholder text. The demos were silently broken
 * AND taught users the wrong API. No prior test validated attribute names —
 * which is exactly why this slipped through.
 *
 * Canonical attributes, verified from source:
 *   x-modal    : title | modal-title,    content via modal-content (src/wb-viewmodels/semantics/dialog.js:15-17)
 *   x-drawer   : drawer-title | heading,  drawer-content | description,  position   (src/wb-viewmodels/overlay.js:143-145)
 *   x-confirm  : confirm-title | heading, confirm-message | message                  (overlay.js:460-461)
 *   x-prompt   : prompt-title | heading,  prompt-message | message                   (overlay.js:508-509)
 *   x-popover  : popover-title | heading, popover-content | description              (overlay.js:51-52)
 *
 * None of the overlay behaviors read these data-* forms, so they must never
 * appear on an overlay trigger:
 */
const FORBIDDEN_OVERLAY_ATTRS = [
  'data-title',
  'data-content',
  'data-message',
  'data-position',
  'data-modal-title',
  'data-modal-content',
];

// process.cwd() (not __dirname, unavailable in ESM) — matches tests/base.ts's
// own PATHS convention; Playwright always runs from the project root.
const ROOT  = process.cwd();
const PAGES = ['pages/components.html', 'pages/behaviors.html', 'pages/newbehaviors.html'];

// Extract opening tags of overlay triggers (wb-modal — legacy custom-element
// tag form, still checked for any remaining archived pages — or any element
// carrying an x-modal/x-drawer/x-confirm/x-prompt/x-popover behavior
// attribute). Code samples in the page are HTML-escaped (&lt;…&gt;), so
// unescape first to check those too.
function overlayTriggerTags(html: string): string[] {
  const unescaped = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  const re = /<(?:wb-modal\b[^>]*|[a-zA-Z][\w-]*\b[^>]*?\b(?:x-modal|x-drawer|x-confirm|x-prompt|x-popover)\b[^>]*)>/g;
  return unescaped.match(re) ?? [];
}

test.describe('Overlay demo markup uses canonical plain attributes (#196/#200/#204/#205)', () => {
  for (const rel of PAGES) {
    test(`${rel}: overlay triggers avoid data-* attributes the components never read`, () => {
      const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      const tags = overlayTriggerTags(html);

      expect(tags.length, `Expected overlay triggers in ${rel} but found none`).toBeGreaterThan(0);

      const offenders: string[] = [];
      for (const tag of tags) {
        for (const bad of FORBIDDEN_OVERLAY_ATTRS) {
          if (new RegExp('\\b' + bad + '\\s*=').test(tag)) {
            offenders.push(`  ${bad} → ${tag.replace(/\s+/g, ' ').slice(0, 130)}`);
          }
        }
      }

      expect(
        offenders,
        `${rel}: overlay triggers use data-* attributes the behaviors never read ` +
        `(see canonical names in this spec's header):\n${offenders.join('\n')}`
      ).toEqual([]);
    });
  }
});
