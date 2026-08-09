import { test, expect } from '@playwright/test';

/**
 * Guards the markdown double-parse regression (root cause: the /docs/*.md route
 * pre-rendered markdown to HTML, then mdhtml parsed it AGAIN, collapsing multi-line
 * code blocks — V3-GUIDE quick-start showed <head>/<body> children crammed onto one
 * line). mdhtml is the single markdown formatter; the server must hand it raw
 * markdown, and format nothing itself.
 */
const DOC = 'docs/V3-GUIDE.md';

test.describe('doc-viewer markdown is formatted once (no server double-parse)', () => {
  test('/docs/*.md returns RAW MARKDOWN to fetch() (not pre-rendered HTML)', async ({ request }) => {
    const res = await request.get('/' + DOC, { headers: { 'Sec-Fetch-Dest': 'empty' } });
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.trimStart().startsWith('#'), 'body should be raw markdown, not <h1> HTML').toBe(true);
    expect(body).toContain('```'); // fences are literal in markdown, not <pre>
    expect(body).not.toMatch(/^<(h1|p|pre)\b/m);
  });

  test('/docs/*.md direct navigation redirects to the doc-viewer', async ({ request }) => {
    const res = await request.get('/' + DOC, {
      headers: { 'Sec-Fetch-Dest': 'document' },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    expect(res.headers()['location']).toContain('/public/doc-viewer.html?file=');
    expect(res.headers()['location']).toContain(encodeURIComponent(DOC));
  });

  test('doc-viewer preserves newlines + indentation in multi-line code blocks', async ({ page }) => {
    await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(DOC), {
      waitUntil: 'domcontentloaded',
    });
    const code = page.locator('#content pre code').filter({ hasText: 'DOCTYPE html' }).first();
    await expect(code).toBeVisible({ timeout: 20000 });

    const info = await code.evaluate((el) => {
      const t = el.textContent || '';
      return {
        newlines: (t.match(/\n/g) || []).length,
        headOwnLine: /\n\s*<head>/.test(t),
        metaIndented: /\n\s{4}<meta/.test(t),
      };
    });
    // The block is ~30 source lines; a collapse showed only ~7 newlines.
    expect(info.newlines, 'multi-line code must keep its line breaks').toBeGreaterThan(20);
    expect(info.headOwnLine, '<head> renders on its own line').toBe(true);
    expect(info.metaIndented, 'child tags stay indented under their parent').toBe(true);
  });
});
