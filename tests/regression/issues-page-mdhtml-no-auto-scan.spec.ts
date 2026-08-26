import { test, expect } from '@playwright/test';

/**
 * pages/issues.html renders GitHub issue bodies through mdhtml() and never
 * explicitly calls await WB.scan()/WB.inject() on its freshly-built issue-row
 * list -- it relied entirely on the { autoLiveRender: false } option passed
 * inside its own click-to-expand handler. That option never had a chance to
 * matter: tag-map.js registers `[x-mdhtml]` for WB's own generic auto-scan,
 * which called mdhtml() with DEFAULT options (autoLiveRender left at its
 * true default) the moment `listEl.innerHTML = ...` inserted the
 * `<div x-mdhtml>` tags -- racing ahead of any click, and ahead of the
 * page-level scan even completing. Confirmed live: issue #527's own body
 * (which illustrates this exact class of bug with a fenced
 * `<div x-mdhtml src="/docs/guide.md">` example) got auto-promoted and 404'd
 * on a completely fresh, un-interacted page load of pages/issues.html --
 * before any row was ever expanded.
 *
 * Fix: pages/issues.html now uses a plain <div class="issue-row__mdhtml">,
 * not a real <div x-mdhtml> tag -- mdhtml() supports this directly (same
 * pattern public/doc-viewer.html's own plain <div id="content"> already
 * relies on), so the element is invisible to WB's generic tag-based
 * auto-scan and is ONLY ever processed by the page's own explicit,
 * correctly-configured WB.inject(el, 'mdhtml', { autoLiveRender: false })
 * call, triggered on expand.
 */
test('pages/issues.html never fetches the fake illustrative path embedded in issue #527\'s own body', async ({ page }) => {
  const fetched: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/docs/guide.md')) fetched.push(req.url());
  });

  await page.goto('/?page=issues');
  await page.waitForSelector('.issue-row[data-number="527"]', { timeout: 15000 });

  // The original bug fired on a fresh, un-interacted load -- but also verify
  // expanding the row (which renders the body, embedded example included)
  // stays inert too.
  await page.locator('.issue-row[data-number="527"] .issue-row__summary').click();
  await page.waitForTimeout(1000);

  expect(fetched, 'the fake illustrative /docs/guide.md path embedded in #527\'s own body must never actually be fetched').toEqual([]);
});
