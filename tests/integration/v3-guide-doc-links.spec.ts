import { test, expect } from '@playwright/test';

/**
 * Standard §14 (#250): "Doc sections that reference a doc must link to it."
 * docs/V3-GUIDE.md's "See also" section mentioned NOTES-V3-GUIDE.md as a
 * bare filename (no docs/ prefix) — the doc-viewer's auto-linker
 * (linkifyDocPaths in public/doc-viewer.html) only wraps a reference in a
 * link when its FULL text matches a repo-rooted path (docs/…, demos/…,
 * etc.) ending .md/.html; a bare filename can't be reliably resolved, so it
 * correctly stayed plain text. Fixed the source: `NOTES-V3-GUIDE.md` ->
 * `docs/NOTES-V3-GUIDE.md`, matching the sibling `docs/behaviors-reference.md`
 * reference right above it (which already linked correctly).
 */
test('every doc reference in V3-GUIDE.md renders as a working link (§14)', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs/V3-GUIDE.md', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const els = [...document.querySelectorAll('#content code')].filter((e) => e.textContent?.includes('.md'));
    return els.length >= 2 && els.every((e) => !!e.closest('a'));
  }, { timeout: 15000 });

  const refs = await page.evaluate(() => {
    return [...document.querySelectorAll('#content code')]
      .filter((e) => e.textContent?.includes('.md'))
      .map((e) => ({ text: e.textContent, isLink: !!e.closest('a') }));
  });
  expect(refs.length).toBeGreaterThanOrEqual(2);
  for (const ref of refs) {
    expect(ref.isLink, `"${ref.text}" should render as a link`).toBe(true);
  }

  // The NOTES-V3-GUIDE.md link specifically must resolve, not 404 — click it.
  const notesLink = page.locator('#content code', { hasText: 'NOTES-V3-GUIDE.md' });
  await notesLink.click();
  await page.waitForURL(/file=docs(%2F|\/)NOTES-V3-GUIDE\.md/, { timeout: 10000 });
  await expect(page.locator('#content')).not.toContainText('404');
});
