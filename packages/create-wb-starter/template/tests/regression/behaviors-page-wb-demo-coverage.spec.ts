import { test, expect } from '@playwright/test';

/**
 * pages/behaviors.html mixed two demo-wrapper conventions: some sections used
 * <div x-demo> (live control + its own source panel, per docs/standards/
 * DEMOS-AND-DOCS-STANDARDS.md §1), while others -- Radio Buttons, Switch
 * Toggle, Select Dropdown, Checkboxes, and most of the Selection/Overlays/
 * Data/Media sections, plus the Effects section's "Attention Seekers"
 * subsection -- used a plain <div class="demo-row">/"demo-grid-2">/
 * "demo-grid-3">/"demo-full"> wrapper with NO <div x-demo> at all, so those
 * examples never showed their own source code. John flagged this directly
 * looking at a screenshot of the Radio Buttons/Switch Toggle/Select Dropdown
 * section. This is the permanent regression gate for that whole sweep:
 * every demo subsection on the page must now render inside a <div x-demo> with
 * both a visible live grid and a visible source/code panel.
 */

async function ready(page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
  await page.waitForTimeout(1000); // x-demo blocks still need render/highlight time after app-ready
}

// Each entry names an <h3> subsection heading; the assertion locates the
// <div x-demo> that immediately follows it (matching the page's own
// heading-then-demo structure) and checks it actually rendered a live grid
// + source panel, per docs/standards/DEMOS-AND-DOCS-STANDARDS.md §1.
const SUBSECTIONS = [
  // John's explicitly called-out sections (Selection):
  'Radio Buttons',
  'Switch Toggle',
  'Select Dropdown',
  'Checkboxes',
  // Spot-checks across the other affected sections:
  'Rating',
  'Stepper & Range',
  'Modal Dialog',
  'Drawer',
  'Tooltips',
  'Tabs',
  'Accordion',
  'Timeline',
  'Enhanced Images',
  'Gallery',
  'YouTube Embed',
  'Attention Seekers (click to trigger)',
];

test.describe('Behaviors page: every demo section renders inside <div x-demo>', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  for (const heading of SUBSECTIONS) {
    test(`"${heading}" section has a live grid + source panel`, async ({ page }) => {
      const h3 = page.locator('h3', { hasText: heading }).first();
      await expect(h3, `heading "${heading}" should exist on the page`).toBeVisible();

      // The <div x-demo> immediately following this <h3> (XPath sibling, since
      // Playwright CSS locators have no "next element" combinator).
      const demo = h3.locator('xpath=following-sibling::x-demo[1]');
      await expect(demo, `"${heading}" should be followed by a <div x-demo>, not a plain div`).toHaveCount(1);

      await expect(demo.locator('.x-demo__grid'), `"${heading}" x-demo should render a live grid`).toBeVisible();
      await expect(
        demo.locator('.x-demo__code, pre').first(),
        `"${heading}" x-demo should render a source/code panel`
      ).toBeVisible();

      // The code panel isn't empty boilerplate -- it actually shows the
      // demo's own markup (Standard §1: "shows its source").
      const codeText = await demo.locator('.x-demo__code, pre').first().innerText();
      expect(codeText.trim().length, `"${heading}" source panel should not be empty`).toBeGreaterThan(0);
    });
  }

  test('no plain demo-row/demo-grid/demo-full wrapper divs remain outside x-demo', async ({ page }) => {
    // Any surviving `.demo-row`/`.demo-grid-2`/`.demo-grid-3`/`.demo-full`/
    // `.alerts-stack`/`.progress-stack` element must be NESTED inside a
    // <div x-demo> (e.g. the "progress-item" rows nested inside the Progress
    // Bars <div x-demo columns="1">) -- never a top-level replacement for one.
    const stray = await page.evaluate(() => {
      const selectors = ['.demo-row', '.demo-grid-2', '.demo-grid-3', '.demo-full', '.alerts-stack', '.progress-stack'];
      const found: string[] = [];
      document.querySelectorAll(selectors.join(',')).forEach((el) => {
        if (!el.closest('x-demo')) {
          found.push(el.className);
        }
      });
      return found;
    });
    expect(stray, `found top-level demo-* wrapper divs not inside a <div x-demo>: ${JSON.stringify(stray)}`).toEqual([]);
  });
});
