/**
 * Docs page links resolve (issue #125)
 * Doc-viewer links must point at the real /public/doc-viewer.html so they
 * resolve under both `npm start` (server.js) and `npm run dev` (static serve).
 */
import { test, expect } from '@playwright/test';

test.describe('docs page links', () => {
  test('doc cards render and every href resolves (no 404)', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForSelector('.docs-card', { timeout: 20000 });

    const hrefs = await page.locator('a.docs-card').evaluateAll(
      (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || '')
    );
    expect(hrefs.length).toBeGreaterThan(0);

    // doc-viewer links must use the real /public path (the bug used /doc-viewer.html)
    const docViewer = hrefs.filter((h) => h.includes('doc-viewer.html'));
    if (docViewer.length) {
      for (const h of docViewer) {
        expect(h, `doc-viewer link should point at /public: ${h}`).toContain('/public/doc-viewer.html');
      }
    }

    // Every link must resolve (status < 400)
    for (const h of hrefs) {
      const resp = await page.request.get(h);
      expect(resp.status(), `href ${h} returned ${resp.status()}`).toBeLessThan(400);
    }
  });
});
