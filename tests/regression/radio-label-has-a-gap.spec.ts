import { test, expect } from '../fixtures/offline';

/**
 * #1795: radio.js wraps a labelled radio in <label class="x-radio__wrapper">,
 * and the label behavior marks that same <label> x-label. label.css's
 * `.x-label { display: block }` (0,1,0, loaded later) beat the wrapper's
 * flex, so its 0.5rem gap did nothing and the text touched the radio --
 * on the Behaviors page the circle sat on the "M" of "Monthly billing".
 *
 * A labelled radio keeps a real gap between button and text, and a group of
 * them still stacks one option per line, as it always has.
 */
test.use({ serviceWorkers: 'block' });

test('a labelled radio has a gap before its text, and a group still stacks', async ({ page }) => {
  await page.goto('/demos/test-harness.html');
  await page.evaluate(() => {
    const host = document.createElement('fieldset');
    host.id = 'radio-gap-probe';
    host.innerHTML = '<legend>Plan</legend>'
      + '<input type="radio" name="gap-probe" label="Monthly billing" checked>'
      + '<input type="radio" name="gap-probe" label="Yearly billing">';
    document.body.append(host);
  });
  const wrappers = page.locator('#radio-gap-probe .x-radio__wrapper');
  await expect(wrappers).toHaveCount(2);

  const seen = await wrappers.evaluateAll((labels) => labels.map((label) => {
    const input = label.querySelector('input')!.getBoundingClientRect();
    const text = label.querySelector('.x-radio__label')!.getBoundingClientRect();
    return {
      display: getComputedStyle(label).display,
      gap: Math.round(text.left - input.right),
      top: Math.round(label.getBoundingClientRect().top),
      left: Math.round(label.getBoundingClientRect().left),
    };
  }));

  for (const s of seen) {
    expect(s.display, 'the wrapper is a flex row, not the block .x-label makes it').toBe('flex');
    expect(s.gap, 'the text starts 0.5rem (8px) after the radio').toBeGreaterThanOrEqual(8);
  }
  expect(seen[1].top, 'the second option sits below the first').toBeGreaterThan(seen[0].top);
  expect(seen[1].left, 'both options start at the same left edge').toBe(seen[0].left);
});
