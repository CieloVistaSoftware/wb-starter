import { test, expect } from '../fixtures/offline';
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
// Only pages that exist. At HEAD this read
//   ['pages/components.html', 'pages/behaviors.html', 'pages/newbehaviors.html']
// The 4.0.0 sweep rewrote the deleted components.html into behaviors.html,
// producing the SAME title twice -- and Playwright rejects duplicate test
// titles by aborting collection for the whole project. The regression suite
// reported 'Total: 0 tests in 0 files' as a result, so none of it ran.
// newbehaviors.html does not exist either and would throw on readFileSync.
//
// pages/behaviors.html no longer carries its demos inline: all 88 <div x-demo>
// blocks moved to data/behavior-examples.json (scripts/build-behavior-examples.mjs)
// and the page renders them on demand, so reading the HTML found 0 overlay
// triggers and failed on "found none". The examples file is what the page
// actually shows, so it is what gets checked.
const PAGES = ['data/behavior-examples.json'];

/** The markup a file shows: HTML as-is; for the examples JSON, every source + alternate. */
function markupOf(rel: string, raw: string): string {
  if (!rel.endsWith('.json')) return raw;
  const { examples } = JSON.parse(raw) as { examples: Record<string, { source?: string; alternates?: unknown[] }> };
  const out: string[] = [];
  for (const ex of Object.values(examples)) {
    if (ex.source) out.push(ex.source);
    for (const alt of ex.alternates ?? []) {
      out.push(typeof alt === 'string' ? alt : JSON.stringify(alt));
    }
  }
  return out.join('\n');
}

// Extract opening tags of overlay triggers (x-modal — legacy custom-element
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
  const re = /<(?:x-modal\b[^>]*|[a-zA-Z][\w-]*\b[^>]*?\b(?:x-modal|x-drawer|x-confirm|x-prompt|x-popover)\b[^>]*)>/g;
  return unescaped.match(re) ?? [];
}

test.describe('Overlay demo markup uses canonical plain attributes (#196/#200/#204/#205)', () => {
  for (const rel of PAGES) {
    test(`${rel}: overlay triggers avoid data-* attributes the components never read`, () => {
      const html = markupOf(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'));
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
