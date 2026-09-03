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
  'alert-toggles',
  'avatar-avatar',
  'avatar-size-variants',
  'avatar-shape-variants',
  'avatar-status-variants',
  'avatar-toggles',
  'badge-badge',
  'badge-variant-variants',
  'badge-size-variants',
  'badge-toggles',
  'chip-chip',
  'chip-variant-variants',
  'chip-size-variants',
  'chip-toggles',
  'progress-progress',
  'progress-variant-variants',
  'progress-size-variants',
  'progress-toggles',
  'rating-rating',
  'rating-size-variants',
  'rating-toggles',
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
  'tooltip-toggles',
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

      const demos = section.locator('[x-demo]');
      const demoCount = await demos.count();
      expect(demoCount, `section#${id} should contain at least one <div x-demo>`).toBeGreaterThan(0);

      for (let i = 0; i < demoCount; i++) {
        const demo = demos.nth(i);
        await expect(demo.locator('.x-demo__grid'), `section#${id} [x-demo][${i}] should render a live grid`).toBeVisible();
        const codePanel = demo.locator('.x-demo__code, pre').first();
        await expect(codePanel, `section#${id} [x-demo][${i}] should render a source/code panel`).toBeVisible();
        const codeText = await codePanel.innerText();
        expect(codeText.trim().length, `section#${id} [x-demo][${i}] source panel should not be empty`).toBeGreaterThan(0);
      }
    });
  }

  /**
   * REMOVED: "no rendered x-* example lives outside <div x-demo>".
   *
   * John: "there is no requirement that states an x-behavior tag must be in a
   * div." The standard agrees. DEMOS-AND-DOCS-STANDARDS.md §1 says "Every
   * behavior EXAMPLE is a <div x-demo>" -- a rule about how examples are
   * authored, not a ban on x-* markup elsewhere.
   *
   * The inverted form cannot hold under auto-injection, where a semantic tag
   * IS its behavior: the <code> inside the prose sentence "attaches via
   * <code>x-tooltip</code> to a real trigger element" becomes an x-code
   * behavior. Enforcing this would mean wrapping prose in demo wrappers.
   *
   * The §1 requirement that DOES hold -- an example renders its live control
   * and its source together -- is covered by the per-section tests above,
   * which assert each x-demo has both a visible grid and a code panel.
   */
});
