import { test, expect } from '@playwright/test';

/**
 * #449: demos/frameworks.html had its own page-local <style> block and
 * enhanceCodeBlocks() JS implementing syntax highlighting + a copy button
 * for its hand-written `<pre language="..." copy="true">` blocks -- written
 * under the (now-stale) assumption in its own comment that "WB's code
 * behavior doesn't activate on these hand-written blocks" (#241). That
 * assumption stopped being true once the global auto-inject system started
 * enhancing plain <pre> tags too (pre.js's `.x-pre .x-pre--has-header
 * .x-pre--has-line-numbers` classes), so BOTH systems ran on the same
 * elements:
 *
 * 1. The local CSS's `pre[language] { padding: 2.5rem 1rem 1rem; }` (an
 *    attribute selector, specificity 0,1,1) outranked the global
 *    `.x-pre--has-line-numbers { padding-left: 2.5rem; }` (a single class,
 *    0,1,0) regardless of source order, so the local rule's
 *    `padding-left: 1rem` (16px) won over the ~40px the line-number gutter
 *    needs -- the gutter visually overlapped the first ~24px of every code
 *    line.
 * 2. The local enhanceCodeBlocks() independently called
 *    hljs.highlightElement() and appended its own .code-copy-btn,
 *    duplicating what the global pre.js/code.js system already does --
 *    two copy buttons per code panel.
 *
 * Fix removed the local legacy CSS block + enhanceCodeBlocks() + its call
 * site entirely, letting the global pre.js/pre.css system own these
 * `<pre language>` blocks like every other code panel on the site. The
 * page's theme-variable syntax colors were re-scoped onto the global
 * system's own `.x-pre` class so that real, still-needed override survives.
 */

test.describe('demos/frameworks.html: legacy pre[language] system removed (#449)', () => {
  test('first line of code text is not clipped by the line-number gutter', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });

    const panels = page.locator('pre[language]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      await expect(panel, `panel #${i} must be enhanced by the global pre.js system`).toHaveClass(/x-pre/, { timeout: 5000 });
      await expect(panel, `panel #${i} must have line numbers (global system)`).toHaveClass(/x-pre--has-line-numbers/, { timeout: 5000 });

      // pre.js appends the line-number gutter and copy button as SIBLINGS of
      // <pre> inside a wrapping .x-pre-wrapper div, not as descendants of
      // <pre> itself -- look at the wrapper, not the panel locator.
      const wrapper = panel.locator('xpath=..');
      const gutter = wrapper.locator('.x-pre__line-numbers').first();
      const code = panel.locator('code').first();

      const gutterCount = await gutter.count();
      const gutterBox = gutterCount > 0 ? await gutter.boundingBox() : null;
      const codeBox = await code.boundingBox();
      expect(codeBox, `panel #${i} code element must be visible`).not.toBeNull();

      if (gutterBox) {
        // The code text's own left edge (its padding-left, where glyphs
        // actually start rendering) must sit at or past the gutter's right
        // edge -- not underneath it. Read the code element's effective text
        // start (border-box left + padding-left) rather than its
        // bounding-box left, since the box itself may still start at the
        // gutter edge while its padding provides the clearance.
        const codeTextStart = await code.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return rect.left + parseFloat(cs.paddingLeft || '0');
        });
        expect(
          codeTextStart,
          `panel #${i}: code text start (${codeTextStart}px) must clear the gutter's right edge (${gutterBox.x + gutterBox.width}px), not sit underneath it`
        ).toBeGreaterThanOrEqual(gutterBox.x + gutterBox.width - 1);
      } else {
        // Fallback when no dedicated gutter element is found by selector:
        // assert directly against the computed left padding that pre.css's
        // .x-pre--has-line-numbers rule is expected to supply (2.5rem =
        // 40px at the default 16px root), which is what the local
        // `pre[language]` rule used to override down to 1rem (16px).
        const paddingLeft = await panel.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
        expect(paddingLeft, `panel #${i} left padding must clear the line-number gutter, not the old local 1rem`).toBeGreaterThan(24);
      }
    }
  });

  test('each code panel has exactly one copy button, not a duplicate local one', async ({ page }) => {
    await page.goto('/demos/frameworks.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });

    // The old local system appended its own `.code-copy-btn` in addition to
    // whatever the global system renders -- assert that legacy class is
    // gone from the page entirely.
    await expect(page.locator('.code-copy-btn')).toHaveCount(0);

    const panels = page.locator('pre[language]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      await expect(panel, `panel #${i} must be enhanced by the global pre.js system`).toHaveClass(/x-pre/, { timeout: 5000 });

      // pre.js's own copy button is `.x-pre__copy`, appended as a sibling of
      // <pre> inside .x-pre-wrapper (see comment above) -- if the legacy
      // local system's enhanceCodeBlocks() were still running, a second,
      // differently-classed `.code-copy-btn` would also be present here.
      const wrapper = panel.locator('xpath=..');
      const copyButtons = wrapper.locator('button[class*="copy"], [class*="copy-btn"], [class*="copy-button"]');
      const btnCount = await copyButtons.count();
      expect(btnCount, `panel #${i} must have exactly one copy button, found ${btnCount}`).toBe(1);
    }
  });
});
