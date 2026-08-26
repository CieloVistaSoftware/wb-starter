/**
 * doc-viewer.html renders the markdown it is given (issue #140).
 * mdhtml() must read data-src (the doc-viewer sets content.dataset.src), else
 * config.src is null, the fetch is skipped, and the viewer is stuck on "Loading…".
 */
import { test, expect } from '@playwright/test';

test('doc-viewer renders the requested markdown, not the loading placeholder', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=%2Fdocs%2Fbehaviors%2Fcard.md');
  // content should populate; wait for the loading message to be replaced
  await page.waitForFunction(() => {
    const c = document.getElementById('content');
    const t = (c?.innerText || '').trim();
    return t.length > 200 && !t.includes('Loading documentation');
  }, { timeout: 15000 });

  const content = page.locator('#content');
  await expect(content).not.toContainText('Loading documentation');
  // rendered markdown should produce real structure (a heading) and substantial text
  await expect(content.locator('h1, h2, h3').first()).toBeVisible();
});

// #873: this test used to be a bare waitForFunction with no expect() anywhere
// in the body -- the gate (tests/compliance/tests-must-assert.spec.ts) listed
// it as asserting nothing. A waitForFunction that times out does fail, but it
// fails with "Timeout exceeded" and no statement of what was expected, and it
// left the more interesting half of the title unchecked: that the viewer
// stopped showing the loading placeholder, and that it named the file it could
// not fetch.
test('doc-viewer shows an error (not infinite loading) for a missing file', async ({ page }) => {
  const missing = '/docs/__does_not_exist__.md';
  await page.goto(`/public/doc-viewer.html?file=${encodeURIComponent(missing)}`);

  const content = page.locator('#content');

  // mdhtml.js:253 renders 'Failed to load <code>{src}</code>. See error log
  // below for details.' -- assert the real copy, with an auto-retrying matcher
  // because the fetch has to reject first.
  await expect(content).toContainText(/Failed to load|Error loading/i, { timeout: 15000 });

  // ...and that it names WHICH file. A generic "something went wrong" that
  // never mentions the path is the failure mode this page exists to avoid: the
  // whole point of #140 was a viewer that could not tell you what it was stuck
  // on.
  await expect(content).toContainText(missing);

  // The original bug: config.src was null, the fetch was skipped, and the
  // viewer sat on "Loading documentation" forever. An error message REPLACING
  // that placeholder is the thing being verified.
  await expect(content).not.toContainText('Loading documentation');
});
