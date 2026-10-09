/**
 * ```powershell blocks in the docs are highlighted.
 *
 * The vendored highlight.js bundle (src/lib/highlight.js) ships 36 languages
 * and PowerShell is not one of them, so highlight.js logged "Could not find
 * the language 'powershell'" and fell back to no-highlight: the block stayed
 * plain text with no `hljs` class. The repo's own standard writes commands as
 * PowerShell, so the guide's setup steps were the ones left unstyled.
 *
 * every-doc-fits-a-phone.spec.ts waits for every code block to carry `hljs`
 * and so timed out on docs/_today/TODO.md whenever its check ran after the
 * block existed; it passed only when the check ran before. The grammar is now
 * registered beside the bundle (src/lib/highlight-powershell.js).
 */
import { test, expect } from '../fixtures/offline';

test('a ```powershell block in a doc is highlighted', async ({ page }) => {
  await page.goto('/public/doc-viewer.html?file=docs%2Fguides%2Fcreate-a-website.md', { waitUntil: 'domcontentloaded' });
  const block = page.locator('#content pre code.language-powershell').first();
  await expect(block).toHaveClass(/\bhljs\b/, { timeout: 15000 });
  // Tokens, not just the class: the grammar actually ran.
  expect(await block.locator('[class^="hljs-"]').count(), 'no highlight.js tokens in the PowerShell block').toBeGreaterThan(0);
});
