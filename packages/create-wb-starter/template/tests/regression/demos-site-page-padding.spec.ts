import { test, expect } from '@playwright/test';

/**
 * Every demos/site/*.html page except cards.html rendered its body content
 * with ZERO padding -- no `.page` wrapper at all, so <h1>/<nav>/<p> sat
 * flush at x=0 against the viewport edge. Violates DEMOS-AND-DOCS-
 * STANDARDS.md #13 (>=1rem spacing from any edge, the same rule the user
 * asked for directly: "Text content should always be 1rem from edge").
 * cards.html already had the fix (body > .page { padding: var(--space-xl) });
 * applied the same pattern to the other 7, plus padding on index.html's
 * own pre-existing .site-index wrapper.
 *
 * A batch fix attempt briefly broke effects/feedback/forms/interactive/
 * layout.html by inserting `</div>` INSIDE their <script type="module">
 * block (a JS syntax error that silently killed WB.init()/WB.scan() on
 * those pages) -- this spec also guards against that regressing again by
 * asserting the init console.log actually fires.
 */

const PAGES = [
  { file: 'content', title: 'Content & Media initialized' },
  { file: 'effects', title: 'Visual Effects initialized' },
  { file: 'feedback', title: 'Feedback & Status initialized' },
  { file: 'forms', title: 'Form Controls initialized' },
  { file: 'interactive', title: 'Interactive & Utility initialized' },
  { file: 'layout', title: 'Layout & Navigation initialized' },
  { file: 'overlays', title: 'Overlays & Popups initialized' },
];

test.describe('demos/site/*.html: page-level padding wrapper', () => {
  for (const { file, title } of PAGES) {
    test(`${file}.html: .page wrapper has real padding and body has no console errors`, async ({ page }) => {
      const consoleLogs: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (msg) => consoleLogs.push(msg.text()));
      page.on('pageerror', (err) => pageErrors.push(String(err)));

      await page.goto(`/demos/site/${file}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => (window as any).__WB_DEMO_INITIALIZED__ === true, { timeout: 20000 });

      expect(pageErrors, 'no uncaught page errors (guards against the </div>-inside-<script> regression)').toEqual([]);
      expect(consoleLogs.some((l) => l.includes(title)), `init script should have logged "${title}"`).toBe(true);

      // #628: body's padding wrapper class was renamed from `.page` to
      // `.demo-page` in ece79e8 (wired via scripts/generate-site.mjs) --
      // this test's selector went stale and never got updated, so every
      // one of these 8 pages failed at "wrapper not found" regardless of
      // the actual padding fix being intact.
      const wrapper = page.locator('body.demo-page').first();
      await expect(wrapper).toBeVisible();
      const padding = await wrapper.evaluate((el) => getComputedStyle(el).paddingLeft);
      expect(parseFloat(padding)).toBeGreaterThanOrEqual(16); // >= 1rem

      const h1 = page.locator('h1').first();
      const x = await h1.evaluate((el) => el.getBoundingClientRect().x);
      expect(x, 'h1 must not sit flush against the viewport edge').toBeGreaterThanOrEqual(16);
    });
  }

  test('index.html: .site-index wrapper has real padding', async ({ page }) => {
    await page.goto('/demos/site/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).__WB_DEMO_INITIALIZED__ === true, { timeout: 20000 });
    const wrapper = page.locator('.site-index').first();
    await expect(wrapper).toBeVisible();
    const padding = await wrapper.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(parseFloat(padding)).toBeGreaterThanOrEqual(16);
  });
});
