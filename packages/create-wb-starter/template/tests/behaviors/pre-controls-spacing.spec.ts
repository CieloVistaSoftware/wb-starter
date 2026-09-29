/**
 * pre.js header controls (copy button, language badge, collapse toggle) must
 * never sit closer than 1rem apart. The old implementation hardcoded each
 * control's `right` offset in rem, guessing at the language badge's width —
 * live report: the toggle button visibly overlapped the badge by ~10px
 * because badge width varies with its label text ("HTML" vs "JavaScript").
 * The fix measures each control's real rendered width after it's appended
 * and positions the next (further-left) control from that, guaranteeing a
 * minimum 1rem gap regardless of label length.
 */
import { test, expect } from '../fixtures/offline';
import { setupBehaviorTest, setupTestContainer } from '../base';

// The Behaviors page these specs used to read builds one example on selection
// now (#666/#910), and its code panel is a plain source view: no max-height, so
// no toggle, and no copy button. The block under test is authored here with
// every header control pre.js offers -- copy, a language badge, and the
// collapse toggle that only exists when there is a max-height to collapse.
const BLOCK =
  '<pre language="javascript" show-copy max-height="160px"><code>' +
  Array.from({ length: 24 }, (_, i) => `const line${i} = ${i};`).join('\n') +
  '</code></pre>';

test.describe('pre.js header controls stay >=1rem apart', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
    await setupTestContainer(page, BLOCK);
  });

  test('copy button, language badge, and toggle never overlap and keep >=1rem gaps', async ({ page }) => {
    const wrapper = page.locator('#test-container .x-pre-wrapper').filter({
      has: page.locator('.x-pre__copy, .x-pre__language, .x-pre__toggle'),
    }).first();
    await expect(wrapper).toBeVisible();

    const result = await wrapper.evaluate((el) => {
      const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const controls = ['.x-pre__copy', '.x-pre__language', '.x-pre__toggle']
        .map((sel) => el.querySelector(sel))
        .filter((node): node is Element => !!node)
        .map((node) => node.getBoundingClientRect())
        // sort left-to-right so adjacent-gap math is meaningful
        .sort((a, b) => a.left - b.left);
      const gaps: number[] = [];
      for (let i = 1; i < controls.length; i++) {
        gaps.push(controls[i].left - controls[i - 1].right);
      }
      return { gaps, rootFontSizePx, count: controls.length };
    });

    expect(result.count, 'expected at least copy+language+toggle to be present on this demo block').toBeGreaterThanOrEqual(3);
    for (const gap of result.gaps) {
      expect(gap, `gap between adjacent controls should be >= 1rem (${result.rootFontSizePx}px), got ${gap}px`).toBeGreaterThanOrEqual(result.rootFontSizePx - 1);
    }
  });
});
