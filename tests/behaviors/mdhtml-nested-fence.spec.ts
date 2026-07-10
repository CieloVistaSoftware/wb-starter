import { test, expect } from '@playwright/test';

/**
 * demos/autoinject.html's "Code:" example contains a fenced code block
 * whose CONTENT itself contains a nested ```javascript fence (showing what
 * markdown-with-a-code-fence-inside-HTML looks like as source). CommonMark
 * requires the outer fence to use MORE backticks than anything nested
 * inside it — a 3-backtick outer fence closes at the first 3-backtick line
 * it finds, which was the inner block's own closing fence, truncating the
 * rendered code block and leaving `</div>` + the real closing fence as
 * orphaned literal text on the page instead of inside the widget. (#260)
 *
 * Fixed by widening the outer fence to 4 backticks. This block must be
 * scrolled into view before it renders — <wb-mdhtml> (via wb-lazy.js's
 * customElementMappings) is lazily injected on IntersectionObserver, not
 * eagerly on page load.
 */
test('nested code fence renders as one complete, highlighted block (#260)', async ({ page }) => {
  await page.goto('/demos/autoinject.html', { waitUntil: 'domcontentloaded' });
  const widget = page.locator('#autoinject-mdhtml-typo');
  await widget.scrollIntoViewIfNeeded();
  await expect(widget).toHaveClass(/wb-mdhtml--loaded/, { timeout: 10000 });

  // Rendered as a real highlighted code block, not left as plain unparsed
  // markdown text.
  const code = widget.locator('code');
  await expect(code).toBeVisible();
  await expect(code).toHaveClass(/hljs/);

  // The whole example — including the closing </div> that comes AFTER the
  // nested fence — is inside the one rendered block, not truncated at the
  // inner fence's closing ```.
  const codeText = await code.textContent();
  expect(codeText, 'rendered code should include the nested example\'s closing </div>').toContain('</div>');
  expect(codeText, 'rendered code should include the nested javascript example as literal text').toContain('function hello()');

  // No orphaned markdown syntax leaked out as stray text after the widget.
  const container = page.locator('#autoinject-div-typo-code');
  const afterWidgetText = await container.evaluate((el, widgetId) => {
    const widgetEl = document.getElementById(widgetId);
    let text = '';
    let node = widgetEl?.nextSibling;
    while (node) {
      text += node.textContent || '';
      node = node.nextSibling;
    }
    return text;
  }, 'autoinject-mdhtml-typo');
  expect(afterWidgetText, 'no stray ``` should leak out after the rendered widget').not.toContain('```');
});
