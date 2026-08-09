/**
 * Docs page links must resolve to REAL content (issues #125, #140).
 *
 * Why the old test was useless: it only asserted `status < 400`. The server's
 * SPA catch-all serves index.html for ANY unmatched path, so a *missing*
 * /pages/X.html returned 200 with the home shell. The status check passed while
 * the link was broken (clicking it opened the home page, not the doc).
 *
 * This test compares each link's body against the SPA shell, so a fallback is
 * detected as the broken link it is.
 */
import { test, expect } from '@playwright/test';

const ORIGIN = 'http://localhost:3000';

test.describe('docs page links', () => {
  test('every docs-card link resolves to real content, not the SPA fallback shell', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForSelector('.docs-card', { timeout: 20000 });

    const hrefs = await page.locator('a.docs-card').evaluateAll(
      (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || '')
    );
    expect(hrefs.length, 'docs cards should render').toBeGreaterThan(0);

    // The home shell that the SPA catch-all returns for missing paths.
    const shell = (await (await page.request.get('/index.html')).text()).trim();
    const isShellFallback = (body: string) =>
      body.trim() === shell || (/data-theme=/.test(body) && /site__loading|new WBSite|WBSite\s*\(/.test(body));

    const broken: string[] = [];
    for (const href of hrefs) {
      // doc-viewer links: the doc itself (?file=) is the resource that must exist
      const target = href.includes('/public/doc-viewer.html')
        ? new URL(href, ORIGIN).searchParams.get('file') || href
        : href;

      const resp = await page.request.get(target);
      const body = await resp.text();
      if (resp.status() >= 400) {
        broken.push(`${href} → ${target} returned ${resp.status()}`);
      } else if (isShellFallback(body)) {
        broken.push(`${href} → ${target} returned the SPA fallback shell (the target file is missing)`);
      }
    }

    expect(broken, `Broken docs links (resolve to the home shell or 404):\n${broken.join('\n')}`).toEqual([]);
  });

  test('doc-viewer links use the real /public path (#125)', async ({ page }) => {
    await page.goto('/?page=docs');
    await page.waitForSelector('.docs-card', { timeout: 20000 });
    const docViewer = await page.locator('a.docs-card[href*="doc-viewer"]').evaluateAll(
      (els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') || '')
    );
    for (const h of docViewer) {
      expect(h, `doc-viewer link should point at /public: ${h}`).toContain('/public/doc-viewer.html');
    }
  });
});
