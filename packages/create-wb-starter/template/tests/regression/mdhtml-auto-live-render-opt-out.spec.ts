import { test, expect } from '@playwright/test';

/**
 * pages/issues.html renders GitHub issue bodies through mdhtml() (arbitrary,
 * untrusted author text) using the SAME auto-live-render feature built for
 * curated docs/*.md content (mdhtml.js: any fenced ```html block containing
 * real <wb-*>/x-* markup gets promoted from read-only text into a live,
 * executing element). Confirmed live: issue #527's own body illustrates this
 * exact bug with a fenced `<div x-mdhtml src="/docs/guide.md">` example -- once
 * rendered on pages/issues.html, that example itself got auto-promoted into
 * a real element, which fetched the fake illustrative path and 404'd,
 * reproducing the very bug the issue describes on a page that has nothing to
 * do with it.
 *
 * Fix: mdhtml() config now has `autoLiveRender` (default true, so
 * doc-viewer.html's existing behavior is unchanged) -- pages/issues.html
 * passes `autoLiveRender: false` when rendering issue bodies.
 */
test.describe('mdhtml() autoLiveRender option', () => {
  const ISSUE_BODY_MD =
    'Some text describing a bug.\n\n' +
    '```html\n' +
    '<div x-mdhtml src="/docs/__auto_live_render_test_placeholder__.md"></div>\n' +
    '```\n' +
    '\nMore text.';

  test('default (docs) behavior: a real behavior example gets promoted to a live x-demo', async ({ page }) => {
    await page.goto('/demos/test-harness.html');
    const result = await page.evaluate(async (md) => {
      const { mdhtml } = await import('/src/wb-viewmodels/mdhtml.js');
      const el = document.createElement('div');
      el.textContent = md;
      document.body.appendChild(el);
      await mdhtml(el, {});
      return { hasLiveDemo: !!el.querySelector('x-demo x-mdhtml') };
    }, ISSUE_BODY_MD);

    expect(result.hasLiveDemo, 'doc-viewer.html\'s existing auto-live-render behavior must be unchanged').toBe(true);
  });

  test('autoLiveRender: false (issue bodies): the same example stays read-only text, never fetches', async ({ page }) => {
    const fetchedFakePath: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('__auto_live_render_test_placeholder__.md')) fetchedFakePath.push(req.url());
    });

    await page.goto('/demos/test-harness.html');
    const result = await page.evaluate(async (md) => {
      const { mdhtml } = await import('/src/wb-viewmodels/mdhtml.js');
      const el = document.createElement('div');
      el.textContent = md;
      document.body.appendChild(el);
      await mdhtml(el, { autoLiveRender: false });
      return { hasLiveDemo: !!el.querySelector('x-demo x-mdhtml') };
    }, ISSUE_BODY_MD);

    expect(result.hasLiveDemo, 'an issue body\'s embedded example must not become a live element').toBe(false);
    await page.waitForTimeout(300);
    expect(fetchedFakePath, 'the fake illustrative src must never actually be fetched').toEqual([]);
  });
});
