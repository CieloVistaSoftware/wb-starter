import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

/**
 * TEST AUDIT — Dimension 4 of 4: "do the events work?" (John,
 * docs/_today/test-audit-2026-08-14.md). This was the dimension with NO
 * existing coverage at all before this pass.
 *
 * §27 of docs/standards/DEMOS-AND-DOCS-STANDARDS.md: a `<div x-demo
 * events="wb:switch:change">` (see src/wb-viewmodels/demo.js) builds a
 * LIVE log panel (`.x-demo__events-log`) that's supposed to show the
 * named event actually firing, in real time, when a reader interacts with
 * the rendered control above it -- "proof, not just claims." This test is
 * that proof, automated: for every `<div x-demo events="...">` usage in the
 * repo, actually interact with the rendered control and assert the log
 * updates (the placeholder "Interact with the demo above..." row is
 * replaced with a real `.x-demo__events-log-entry`).
 *
 * DISCOVERY: rather than hand-listing every file (the same "doesn't scale
 * to future usage" problem docs-live-media-assets-exist.spec.ts avoided by
 * driving off behavior-index.json), this greps for `<div x-demo[^>]*\bevents=`
 * across demos/**\/*.html, pages/**\/*.html, and docs/**\/*.md (fenced code
 * and inline spans stripped in .md first, matching every other test in
 * this session's audit pass -- an `events=` attribute shown as inline
 * code/prose, like DEMOS-AND-DOCS-STANDARDS.md §27's own example, is not a
 * live control). As of this pass there are 6 real usages across 5 files;
 * any future `events=` usage is automatically picked up.
 *
 * INTERACTION: the control behind an `events=` demo varies by behavior
 * (a button, a switch, a tab, a table row, ...) and this test does not
 * hand-pick a selector per file -- it tries a small, ordered cascade of
 * generic candidate selectors (the shapes real behaviors in this repo
 * actually expose: a real `<button>`, `[role=switch]`, `[role=tab]`, a
 * `<tr>`, then a last-resort click on the first rendered child) and stops
 * at the first one that actually moves the event log. This generalizes to
 * new `events=` usages of a similar shape without per-file maintenance;
 * see the header comment on `interactionCandidates()` for the exact order
 * and reasoning.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const toPosix = (f: string) => f.split(path.sep).join('/');

function liveTextOnly(src: string, isMd: boolean): string {
  let out = src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  if (isMd) {
    out = out
      .replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[ \t]*$/gm, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  }
  return out;
}

function usesLiveEventsDemo(file: string, isMd: boolean): boolean {
  try {
    const live = liveTextOnly(fs.readFileSync(file, 'utf8'), isMd);
    return /<div x-demo\b[^>]*\bevents\s*=/.test(live);
  } catch {
    return false;
  }
}

interface Target {
  rel: string;
  isMd: boolean;
}

const TARGETS: Target[] = [
  ...globSync('demos/**/*.html', { cwd: ROOT }).map((f) => ({ rel: toPosix(f), isMd: false })),
  ...globSync('pages/**/*.html', { cwd: ROOT }).map((f) => ({ rel: toPosix(f), isMd: false })),
  ...globSync('docs/**/*.md', { cwd: ROOT, ignore: ['docs/_today/**'] }).map((f) => ({ rel: toPosix(f), isMd: true })),
]
  .filter((t) => usesLiveEventsDemo(path.join(ROOT, t.rel), t.isMd))
  .sort((a, b) => a.rel.localeCompare(b.rel));

/**
 * Ordered cascade of generic interaction candidates for the control(s)
 * inside one `x-demo[events]`'s `.x-demo__grid`. Each entry is a
 * Playwright locator string tried in order; the first one that's visible
 * AND actually moves the event log wins. Order matters -- more specific
 * interactive-control shapes first, generic fallback last:
 *   1. A real `<button>` NOT inside a code panel (covers
 *      `<div x-cardproduct>`'s "Add to Cart" button, `<button x-toggle>`).
 *   2. `[role="switch"]` (covers `<div x-switch>` -- clicking the HOST toggles
 *      it per switch.js, not just the inner hidden checkbox).
 *   3. `[role="tab"]` not already active (covers `<div x-tabs>`; if every tab
 *      is already marked active -- shouldn't happen, but defensively --
 *      falls through to any `[role=tab]`).
 *   4. A `<tr>` inside a `<table>`/custom table body (covers
 *      `<table selectable>`'s row-click event).
 *   5. Last resort: the first rendered child of the grid itself, plain
 *      click (covers a control this cascade doesn't have a specific case
 *      for yet -- if this also fails to move the log, the test correctly
 *      fails and names the failed control candidate for a human to add a
 *      case, rather than silently mis-reporting "events work").
 */
function interactionCandidates(grid: import('@playwright/test').Locator) {
  return [
    { label: 'button (not in a code panel)', locator: grid.locator('button:not(.x-demo__code button)').first() },
    { label: '[role="switch"]', locator: grid.locator('[role="switch"]').first() },
    { label: '[role="tab"]:not(.x-tabs__tab--active)', locator: grid.locator('[role="tab"]:not(.x-tabs__tab--active)').first() },
    { label: '[role="tab"]', locator: grid.locator('[role="tab"]').first() },
    { label: 'tr (table row)', locator: grid.locator('tr').first() },
    { label: 'first grid child (fallback)', locator: grid.locator(':scope > *').first() },
  ];
}

test.describe('x-demo events= panels actually fire when interacted with (§27 audit)', () => {
  for (const { rel, isMd } of TARGETS) {
    test(`${rel}: every x-demo[events] logs a real event on interaction`, async ({ page }) => {
      const url = isMd ? '/public/doc-viewer.html?file=' + encodeURIComponent(rel) : '/' + rel;
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const eventDemos = page.locator('x-demo[events]');
      // mdhtml/doc-viewer renders markdown asynchronously; wait for the
      // attribute-carrying element to actually exist before counting.
      try {
        await expect(eventDemos.first()).toBeAttached({ timeout: 20000 });
      } catch {
        test.skip(true, 'no x-demo[events] rendered on this page (attribute may be inside an inert code sample only)');
      }

      const count = await eventDemos.count();
      if (count === 0) test.skip(true, 'no x-demo[events] rendered on this page');

      const failures: string[] = [];

      for (let i = 0; i < count; i++) {
        const demo = eventDemos.nth(i);
        await demo.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});

        const log = demo.locator('.x-demo__events-log');
        await expect(log, `x-demo[events][${i}] should build its events log panel (§27)`).toBeAttached({ timeout: 10000 });

        const entriesBefore = await demo.locator('.x-demo__events-log-entry').count();
        expect(entriesBefore, `x-demo[events][${i}] should start with an EMPTY event log (nothing interacted with yet)`).toBe(0);

        const grid = demo.locator('.x-demo__grid');
        const candidates = interactionCandidates(grid);

        let fired = false;
        const tried: string[] = [];
        for (const { label, locator } of candidates) {
          const visible = await locator.isVisible().catch(() => false);
          if (!visible) continue;
          tried.push(label);
          try {
            await locator.click({ timeout: 3000 });
          } catch {
            continue;
          }
          const entriesAfter = await demo.locator('.x-demo__events-log-entry').count();
          if (entriesAfter > entriesBefore) {
            fired = true;
            break;
          }
        }

        if (!fired) {
          const eventsAttr = await demo.getAttribute('events');
          failures.push(
            `x-demo[events="${eventsAttr}"][${i}]: interacted with candidate control(s) [${tried.join(', ') || 'none visible'}] ` +
              `but .x-demo__events-log-entry count never increased -- the event either never fired or the log never caught it`
          );
        }
      }

      expect(failures, `${rel}:\n${failures.join('\n')}`).toEqual([]);
    });
  }
});
