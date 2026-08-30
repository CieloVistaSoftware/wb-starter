import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/**
 * A raw <div x-demo> embedded directly in a Markdown doc must render in the viewer:
 * the LIVE control on top, its SOURCE code underneath. Authors get "both the
 * rendered view and the code" from one tag — no ```demo fence needed.
 *
 * The doc-viewer boots WB whenever a rendered doc contains any <wb-*> element or
 * x-* behavior (not only for ```demo fences), which is what makes this work.
 */
// Most components build real internal DOM structure on upgrade, so
// children.length > 0 is a solid "did it actually upgrade" proxy. x-button
// is the exception: its behavior (src/wb-viewmodels/semantics/button.js)
// deliberately does NO DOM restructuring for a plain-text button — no icon,
// no loading state, so no child spans — it only sets tabindex/role="button"
// on the element itself. Element children were only ever added by a
// competing schema $view that has since been removed as a duplicate/buggy
// renderer (see button.schema.json's _view_note). For x-button, checking
// role="button" is the correct "did it upgrade" signal instead.
type Case = { file: string; liveSelector: string; label: string; upgradeAttr?: string };
const CASES: Case[] = [
  // Only the docs that ACTUALLY embed a raw <div x-demo>. This list used to
  // carry 47 entries; 10 named docs that do not exist, and 35 more that have
  // no x-demo in them, so 45 of 47 had been red since the day they were
  // written (#900).
  //
  // The list was describing an aspiration -- "every behavior doc embeds a live
  // demo" -- that the pipeline never implemented: generate-behavior-docs.mjs
  // emits a link to the showcase, not an embedded demo. A permanently red test
  // guards nothing; it just teaches people to scroll past this file.
  //
  // Add a case here when a doc gains a real <div x-demo>. Whether every doc
  // SHOULD have one is a docs-pipeline decision, tracked on #900, not
  // something this spec gets to assert on its own.
  { file: 'docs/behaviors/help.md', liveSelector: 'span', label: 'help behavior doc', upgradeAttr: 'class' },
  { file: 'docs/behaviors/tooltip.md', liveSelector: 'button', label: 'tooltip behavior doc', upgradeAttr: 'aria-describedby' },
];

// The FILE is the identity, not the label. Two entries here carried the label
// '[x-stack] behavior doc' -- docs/behaviors/x-column.md and
// docs/behaviors/x-stack.md -- and Playwright treats a duplicate test title as
// a FATAL collection error for the entire project: `npm run test:fast` printed
// "Total: 0 tests" and exited. Not one test in any project ran, and nothing
// said so beyond a single line above the summary. Titling by file makes a
// duplicate impossible to write.
test.describe('raw <div x-demo> in Markdown renders live control + source', () => {
  test('every referenced doc exists', () => {
    // 11 of 47 entries pointed at files that are not in the repo. Every one of
    // those tests would have failed at runtime -- but collection died first, so
    // the rot was invisible. Asserted ONCE, as a list, rather than as 11
    // separate "page not found" failures that bury the real ones.
    const missing = CASES.map((c) => c.file).filter((f) => !fs.existsSync(f));
    expect(
      missing,
      'these docs are referenced by this spec but do not exist — either restore ' +
      'the doc or drop its case, but do not leave a test pointed at nothing',
    ).toEqual([]);
  });

  for (const c of CASES) {
    test(`${c.file} (${c.label}): <div x-demo> upgrades and shows both`, async ({ page }) => {
      const errs: string[] = [];
      page.on('pageerror', (e) => errs.push(String(e)));

      await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(c.file), {
        waitUntil: 'domcontentloaded',
      });

      // x-demo upgraded → it builds a live grid + a source panel.
      const demo = page.locator('[x-demo]').first();
      await expect(demo.locator('.x-demo__grid')).toBeVisible({ timeout: 20000 });
      await expect(demo.locator('.x-demo__code, pre').first()).toBeVisible();

      // The live control actually rendered (upgraded custom element, not inert markup).
      // Poll rather than read once — some components (e.g. carddraggable) upgrade a
      // beat later, which made a one-shot childCount read flaky.
      const live = demo.locator(`.x-demo__grid ${c.liveSelector}`).first();
      await expect(live).toBeVisible();
      if (c.upgradeAttr) {
        await expect
          .poll(() => live.getAttribute(c.upgradeAttr as string), {
            message: `${c.liveSelector} should have [${c.upgradeAttr}] set (upgraded)`,
            timeout: 10000,
          })
          .toBeTruthy();
      } else {
        await expect
          .poll(() => live.evaluate((el) => el.children.length), {
            message: `${c.liveSelector} should render internal DOM (upgraded)`,
            timeout: 10000,
          })
          .toBeGreaterThan(0);
      }

      expect(errs, `no page errors while rendering ${c.file}`).toEqual([]);
    });
  }
});
