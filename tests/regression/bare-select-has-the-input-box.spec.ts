import { test, expect } from '../fixtures/offline';

/**
 * A BARE <select> HAS THE SAME BOX AS THE INPUTS BESIDE IT (#682)
 * ==============================================================
 * #682 wrote the rule: a value is chosen with a plain <select> (an action
 * with x-dropdown). But a plain <select> got no class from any behavior, so
 * none of the padding .x-input gives a text input. Alone in a demo grid it
 * was stretched to 40px; next to a filter box, inside the clearable wrapper,
 * or anywhere in a form it sat at its 19px intrinsic height -- a squashed
 * field beside full-height inputs.
 *
 * See it by hand: open /demos/site/forms.html and scroll to "📋 Select".
 * Before: the searchable and clearable samples were 19px tall, the plain one
 * 40px. Now: every single-line select is as tall as a text input.
 */

test('a bare <select> is as tall as a text input, wherever it sits (#682)', async ({ page }) => {
  await page.goto('/demos/site/forms.html', { waitUntil: 'load' });
  const section = page.locator('#select-select');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.x-select__search')).toHaveCount(1, { timeout: 20_000 });
  await expect(section.locator('.x-select__clear')).toHaveCount(1);

  const sizes = await page.evaluate(() => {
    // A text input styled by .x-input, measured in the same page and theme.
    const probe = document.createElement('input');
    probe.className = 'x-input';
    document.body.appendChild(probe);
    const inputH = probe.offsetHeight;
    probe.remove();
    const selects = [...document.querySelectorAll('#select-select select:not([multiple])')] as HTMLSelectElement[];
    return { inputH, selects: selects.map((s) => ({ name: s.name, h: s.offsetHeight })) };
  });

  expect(sizes.selects.length, 'the Select section lost its samples').toBeGreaterThanOrEqual(4);
  for (const s of sizes.selects) {
    expect(Math.abs(s.h - sizes.inputH), `<select name="${s.name}"> is ${s.h}px; a text input is ${sizes.inputH}px`).toBeLessThanOrEqual(2);
  }
});
