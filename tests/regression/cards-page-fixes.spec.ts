import { test, expect } from '@playwright/test';

/**
 * Fixes found while running the full unit-test suite for
 * demos/site/cards.html (per user request):
 *
 * 1. Every <div x-demo> in #card-gallery must carry a stable id (already
 *    partially true for single-item sections like #demo-hero) -- most
 *    multi-item comparison sections never got one. Added ids to all 34.
 * 2. x-cardlink's own behavior (card.js) stretches a real <a href> over
 *    the whole card -- demo.js's #388 "card doc-link" badge feature added
 *    a SECOND <a href> on top of it. Originally "fixed" by excluding
 *    x-cardlink from the badge entirely, but #390 ("put all links on the
 *    card itself, upper right hand corner" -- no carve-outs) reversed that:
 *    the badge's own z-index (demo.css, z-index:5) keeps its small corner
 *    independently clickable above the stretched anchor underneath it, so
 *    both anchors coexist and both are reachable. Verified live via a real
 *    Playwright click (not this MCP browser tool, which was separately
 *    confirmed unreliable here -- IntersectionObserver-driven lazy builds
 *    don't fire in its backgrounded/hidden tab).
 * 3. (Separate page, found investigating a related text-wrap report)
 *    inline <code> tag-name chips like <article> could wrap mid-hyphen
 *    ("<wb-" / "card>" on separate lines) because their white-space was
 *    'normal'. Fixed to 'nowrap' for the inline code variant.
 */

test.describe('demos/site/cards.html: full-page fixes', () => {
  test('every [x-demo] in #card-gallery has a unique, stable id', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

    const demos = page.locator('#card-gallery [x-demo]');
    const count = await demos.count();
    expect(count).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (let i = 0; i < count; i++) {
      const id = await demos.nth(i).getAttribute('id');
      expect(id, `[x-demo] #${i} missing id`).toBeTruthy();
      expect(ids.has(id!), `duplicate id "${id}"`).toBe(false);
      ids.add(id!);
    }
  });

  test('link card has both its own stretched <a> anchor AND an independently-clickable doc-link badge', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

    const card = page.locator('#card-gallery [x-cardlink]').first();
    await card.scrollIntoViewIfNeeded();

    const stretched = card.locator('a[href]:not(.x-demo__card-doc-link)');
    await expect(stretched).toHaveCount(1);
    await expect(stretched).toHaveAttribute('href', /.+/);

    const badge = card.locator('a.x-demo__card-doc-link');
    await expect(badge).toHaveCount(1);

    // The badge must be independently clickable (its z-index keeps it
    // reachable above the full-card stretched anchor beneath it) -- clicking
    // it should navigate to the docs, not the card's own stretched href.
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      badge.click(),
    ]);
    expect(popup.url()).toContain('doc-viewer.html');
    await popup.close();
  });

  test('other card types inside a [x-demo] still get their doc-link badge (regression guard)', async ({ page }) => {
    await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

    const card = page.locator('#card-gallery [x-cardimage]').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('a.x-demo__card-doc-link')).toHaveCount(1);
  });

  test('?page=behaviors: inline <code> tag-name chip does not wrap mid-word', async ({ page }) => {
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB, { timeout: 20000 });

    const hero = page.locator('#components-hero');
    const codeChip = hero.locator('code', { hasText: '.x-card' }).first();
    await expect(codeChip).toBeVisible({ timeout: 10000 });
    await expect(codeChip).toHaveCSS('white-space', 'nowrap');

    // A single-line inline chip's bounding box height should be one line,
    // not two -- confirms it isn't visually broken across a line boundary.
    const box = await codeChip.boundingBox();
    const lineHeight = await codeChip.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight) || 20);
    expect(box!.height).toBeLessThan(lineHeight * 1.5);
  });
});
