import { test, expect } from '@playwright/test';

/**
 * demos/site/feedback.html: John asked that every rendered example on this
 * page live inside a <div x-demo> (docs/standards/DEMOS-AND-DOCS-STANDARDS.md
 * §1 -- "Every component example is a <div x-demo>"), same sweep already done
 * for demos/site/overlays.html and pages/behaviors.html. Auditing the page's
 * own markup, every example section (Alert/Avatar/Badge/Chip/Progress/
 * Rating/Skeleton/Spinner/Toast/Tooltip, plus the x-tooltip/x-progressbar/
 * x-notify behavior sections) was already wrapped in <div x-demo>, including
 * the §17 grouped-control cases (e.g. the big Badge combinatorial grid is
 * one logical group in one <div x-demo>, not split per-badge). This is the
 * permanent regression gate: every example section must keep rendering
 * inside a <div x-demo> with both a visible live grid and a visible
 * source/code panel, and no rendered wb-* (or x-*) example may live
 * outside one.
 */

async function ready(page) {
  await page.goto('/demos/site/feedback.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForTimeout(1200); // x-demo blocks still need render/highlight time after app-ready
}

// Every example <section id="…"> on the page, in document order.
const SECTIONS = [
  'alert-alert',
  'alert-variant-variants',
  'alert-boolean-toggles',
  'avatar-avatar',
  'avatar-size-variants',
  'avatar-shape-variants',
  'avatar-status-variants',
  'avatar-boolean-toggles',
  'badge-badge',
  'badge-variant-variants',
  'badge-size-variants',
  'badge-boolean-toggles',
  'chip-chip',
  'chip-variant-variants',
  'chip-size-variants',
  'chip-boolean-toggles',
  'progress-progress',
  'progress-variant-variants',
  'progress-size-variants',
  'progress-boolean-toggles',
  'rating-rating',
  'rating-size-variants',
  'rating-boolean-toggles',
  'skeleton-skeleton',
  'skeleton-variant-variants',
  'spinner-spinner',
  'spinner-size-variants',
  'spinner-variant-variants',
  'spinner-speed-variants',
  'toast-toast',
  'toast-variant-variants',
  'toast-position-variants',
  'tooltip-tooltip',
  'tooltip-position-variants',
  'tooltip-variant-variants',
  'tooltip-trigger-variants',
  'tooltip-boolean-toggles',
  'x-tooltip-on-a-real-trigger-element',
  'x-progressbar-attribute-based-progress-bar',
  'x-notify-one-off-notification',
];

test.describe('Feedback & Status page: every example section renders inside <div x-demo>', () => {
  test.beforeEach(async ({ page }) => {
    await ready(page);
  });

  for (const id of SECTIONS) {
    test(`#${id} has a live grid + source panel inside <div x-demo>`, async ({ page }) => {
      const section = page.locator(`section#${id}`);
      await expect(section, `section#${id} should exist on the page`).toHaveCount(1);

      const demos = section.locator('x-demo');
      const demoCount = await demos.count();
      expect(demoCount, `section#${id} should contain at least one <div x-demo>`).toBeGreaterThan(0);

      for (let i = 0; i < demoCount; i++) {
        const demo = demos.nth(i);
        await expect(demo.locator('.x-demo__grid'), `section#${id} x-demo[${i}] should render a live grid`).toBeVisible();
        const codePanel = demo.locator('.x-demo__code, pre').first();
        await expect(codePanel, `section#${id} x-demo[${i}] should render a source/code panel`).toBeVisible();
        const codeText = await codePanel.innerText();
        expect(codeText.trim().length, `section#${id} x-demo[${i}] source panel should not be empty`).toBeGreaterThan(0);
      }
    });
  }

  test('no rendered wb-*/x-* example lives outside a <div x-demo> ancestor', async ({ page }) => {
    // Every example's direct rendered content (the x-demo's own grid
    // children) must be inside a <div x-demo>. Walk each <section>'s direct
    // element children (skipping headings/paragraphs, which are prose, not
    // examples) and assert each is either a <div x-demo> itself or nested
    // inside one.
    const stray = await page.evaluate(() => {
      const found: string[] = [];
      document.querySelectorAll('section[id]').forEach((section) => {
        Array.from(section.children).forEach((child) => {
          const tag = child.tagName.toLowerCase();
          if (tag === 'h2' || tag === 'p') return; // prose, not an example
          if (tag === 'x-demo') return; // the wrapper itself
          if (!child.closest('x-demo')) {
            found.push(`${section.id}: <${tag}>`);
          }
        });
      });
      return found;
    });
    expect(stray, `found rendered example(s) outside <div x-demo>: ${JSON.stringify(stray)}`).toEqual([]);
  });
});
