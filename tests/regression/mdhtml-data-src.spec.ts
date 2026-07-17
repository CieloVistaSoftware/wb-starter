import { test, expect } from '@playwright/test';

/**
 * mdhtml.js originally read element.getAttribute('data-src') as a fallback
 * (added for issue #140 -- see tests/behaviors/doc-viewer.spec.ts, which
 * covers the doc-viewer.html page-level symptom of this exact bug). Commit
 * 8afed94 ("eager-scan root cause + widespread component/CSS/test-scope
 * bugs") deleted that fallback while removing what it believed were dead
 * `data-*` reads (#224: "zero data-* attributes anywhere") -- an audit that
 * only checked static HTML markup and missed that public/doc-viewer.html
 * SETS data-src dynamically via JS (`content.dataset.src = fileUrl`), never
 * as a literal attribute in any .html file a grep would find.
 *
 * Losing that fallback silently broke every doc on the site: mdhtml() fell
 * through to its "inline content" branch and rendered whatever was already
 * sitting in the element's innerHTML (doc-viewer.html's static "Loading
 * documentation..." placeholder) as if it were the markdown source --
 * still marking itself `wb-mdhtml--loaded` with no error. The existing
 * doc-viewer.spec.ts test would have caught this immediately, but it lives
 * in the `behaviors` Playwright project, which `npm run test:compliance`
 * (the documented "pre-push-to-.io gate") never runs -- so the regression
 * shipped anyway.
 *
 * This test isolates the bug at the mdhtml() function level directly
 * (bypassing doc-viewer.html's page structure entirely), so any future
 * "dead code" cleanup that touches config.src's attribute-reading order
 * fails immediately and unambiguously, independent of which Playwright
 * project happens to be included in a given gate.
 */
test.describe('mdhtml() config.src reads data-src (regression for the 8afed94 dead-code-removal incident)', () => {
  test('a bare element with only data-src (no src attribute, no options.src) still loads real content via mdhtml()', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=docs/index.md');

    // Directly pins the root cause: element.getAttribute('src') must not be
    // the only thing mdhtml() checks. Re-invoke mdhtml() on a fresh element
    // that carries ONLY a data-src attribute (no options.src, no src attr).
    const result = await page.evaluate(async () => {
      const { mdhtml } = await import('/src/wb-viewmodels/mdhtml.js');
      const el = document.createElement('div');
      el.dataset.src = '/docs/index.md';
      document.body.appendChild(el);
      await mdhtml(el, {});
      return {
        loaded: el.classList.contains('wb-mdhtml--loaded'),
        hasPlaceholderText: el.textContent.includes('Loading documentation'),
        h1: el.querySelector('h1')?.textContent || null,
      };
    });

    expect(result.loaded).toBe(true);
    expect(result.hasPlaceholderText).toBe(false);
    expect(result.h1).toBe('WB-Starter Documentation');
  });
});
