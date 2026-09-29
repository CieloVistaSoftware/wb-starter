/**
 * The playground preview upgrades NATIVE elements, not only x-* attributes.
 *
 * John: "why doesn't this preview show the correct format?" -- a pasted
 * multi-line <code language="javascript"> listing rendered as a few wrapped
 * lines. The playground inits WB with autoInject off (so its own editor UI is
 * never enhanced), which also meant a pasted <code> was never enhanced: it
 * stayed inline with white-space: normal. render() now turns autoInject on
 * for the preview scan only.
 */
import { test, expect } from '../fixtures/offline';

const LISTING = [
  '<code language="javascript">',
  '// Debounce',
  'export function debounce(fn, wait = 200) {',
  '  let timer = null;',
  '  return 1;',
  '}',
  '</code>',
].join('\n');

test('a pasted multi-line <code> renders as a formatted block; the editor stays untouched', async ({ page }) => {
  await page.goto('/demos/playground.html');
  await page.waitForFunction(() => (window as any).WB?.scan);
  const editor = page.locator('textarea').first();
  await editor.fill(LISTING);
  await editor.dispatchEvent('input');

  const code = page.locator('#pg-preview code').first();
  await expect(code).toHaveAttribute('x-ready', '', { timeout: 15_000 });
  await expect(code).toHaveClass(/x-code--block/);
  expect(await code.evaluate((el) => getComputedStyle(el).whiteSpace), 'newlines must survive').toMatch(/^pre/);
  // Six source lines, so the block is several lines tall, not one wrapped run.
  const lineHeight = await code.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight) || 20);
  expect((await code.boundingBox())!.height).toBeGreaterThan(lineHeight * 4);

  // Scoped: the playground's own editor textarea is still not enhanced.
  await expect(editor).not.toHaveAttribute('x-ready', '');
});
