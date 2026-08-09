import { test, expect } from '@playwright/test';

/**
 * mdhtml.js now auto-converts a doc's ```html fenced examples containing
 * real component markup into live <wb-demo> widgets (John: "all of these
 * examples must use wb-demo"), instead of leaving them as read-only
 * syntax-highlighted text.
 *
 * Live-reported regression found immediately after shipping that: demo.js's
 * single-item shrink-to-fit measurement (#486) took ONE measurement via
 * requestAnimationFrame -- correct for a child whose content already
 * finished loading, but wb-audio's showEq UI (docs/components/semantics/
 * audio.md's "With Equalizer" example) builds its 15-band equalizer
 * asynchronously, so the demo measured near-zero width before that UI
 * existed and never re-measured. The whole demo (widget + code panel)
 * stayed collapsed to a narrow sliver forever. Same root cause already hit
 * 3 times before this (cardhero, 9 more card-family async-image demos) --
 * each previously patched one instance at a time via the `full-width`
 * escape hatch. This time fixed at the ROOT: demo.js polls the child's
 * width until it stops changing (layout has settled) instead of measuring
 * once.
 */
test.describe('Auto-live-rendered doc examples do not collapse to a sliver', () => {
  test('audio.md: none of the auto-rendered wb-demo widgets collapse to a sliver', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs%2Fcomponents%2Fsemantics%2Faudio.md', { waitUntil: 'domcontentloaded' });

    const demos = page.locator('wb-demo');
    await expect(demos.first()).toBeVisible({ timeout: 15000 });
    const count = await demos.count();
    expect(count, 'expected the auto-live-render conversion to have produced multiple wb-demo widgets').toBeGreaterThan(1);

    // demo.js's poll-until-stable measurement caps at 5s -- give every
    // widget on the page room to finish, including the equalizer's own
    // async UI build.
    await page.waitForTimeout(5500);

    for (let i = 0; i < count; i++) {
      const box = await demos.nth(i).boundingBox();
      expect(box, `wb-demo[${i}] must have a measurable box`).not.toBeNull();
      // Well above any "measured before content existed" collapse width
      // (confirmed live: the equalizer bug measured ~0-30px) and well
      // below any real widget's rendered size.
      expect(
        box!.width,
        `wb-demo[${i}] rendered only ${Math.round(box!.width)}px wide -- collapsed to a sliver.`
      ).toBeGreaterThan(150);
    }
  });
});
