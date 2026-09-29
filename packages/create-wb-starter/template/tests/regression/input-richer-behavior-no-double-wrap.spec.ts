import { test, expect } from '../fixtures/offline';
import { showBehavior } from '../helpers/behaviors-page';

/**
 * A bare <input> auto-injects the generic `input()` behavior (nativeMap
 * 'input':'input', tag-map.js) -- but that fires REGARDLESS of a richer,
 * deliberately-opted-into x-{behavior} also being present (x-search,
 * x-colorpicker, ...). wb.js's getAutoInjectBehavior() has a skip-check for
 * this, but it only works if the other behavior module happens to already
 * be registered at scan time -- a load-order race, not a guarantee.
 * Confirmed live on pages/behaviors.html (?page=behaviors): <input
 * type="search" x-search> got wrapped by BOTH search() (search.js,
 * .x-search__wrapper) AND input() (.x-input) -- and search() itself then
 * fired a SECOND time, nesting x-search__wrapper > x-input >
 * x-search__wrapper > input ("concentric rings", screenshot). Separately,
 * <input type="color" x-colorpicker> got input()'s flex/padding/border
 * text-field styling forced onto it, squashing the native color swatch
 * into a thin bar. Fixed with defensive guards in input() (skip when a
 * richer x-{behavior} attribute is present) and search() (skip if already
 * wrapped).
 *
 * The Behaviors page no longer renders every demo inline: it is a browser that
 * builds one behavior's example on selection (#666/#910), so each test picks
 * its behavior first. `page.goto` alone found no input[x-search] to wait on.
 */
test.describe('input() defers to richer explicit behaviors (Behaviors page)', () => {
  test('x-search input has exactly one wrapper, no [x-input] nesting', async ({ page }) => {
    await showBehavior(page, 'x-search');
    const input = page.locator('#behaviors-live-example input[x-search]').first();
    // Wait for search()'s own marker class, not just element existence --
    // eager-scan behavior application is async, and a bare waitFor() can
    // resolve before it's actually finished (the source of the flakiness
    // below when checked with a one-shot evaluate() instead of polling).
    await expect(input).toHaveClass(/x-search__input/, { timeout: 10_000 });

    const readChain = () =>
      input.evaluate((el) => {
        const tags: string[] = [];
        let node: Element | null = el;
        for (let i = 0; i < 4 && node; i++) {
          tags.push(node.className || '(no class)');
          node = node.parentElement;
        }
        return tags;
      });

    // Poll instead of a single snapshot -- if input()'s stray wrapper is
    // still mid-insertion when we read, a one-shot check can catch a
    // transient state. The end state must be stable at exactly one wrapper.
    await expect.poll(async () => {
      const chain = await readChain();
      return chain.filter((c) => c.split(/\s+/).includes('x-search__wrapper')).length;
    }, { timeout: 5_000 }).toBe(1);

    // input()'s own wrapper and field classes. These read '[x-input] ' and
    // '[x-input]__field' after a bulk tag-to-attribute rewrite -- strings no
    // className can contain, so both checks passed whatever the DOM was.
    const chain = await readChain();
    expect(chain.some((c) => c.split(/\s+/).includes('x-input__wrapper'))).toBe(false);
    expect(chain[0]).not.toContain('x-input__field');
  });

  test('x-colorpicker input keeps its native size, no text-field styling forced on it', async ({ page }) => {
    await showBehavior(page, 'x-colorpicker');
    const picker = page.locator('#behaviors-live-example input[x-colorpicker]').first();
    // Same rationale as above: wait for colorpicker()'s own marker class
    // before measuring, not just element presence.
    await expect(picker).toHaveClass(/x-colorpicker__input/, { timeout: 10_000 });

    expect(await picker.evaluate((el) => el.className)).not.toContain('x-input__field');
    expect(await picker.evaluate((el) => el.hasAttribute('style'))).toBe(false);

    // A text-field-styled color input stretches to fill its flex container
    // (100+px wide); the native swatch is small and roughly square. Poll
    // since layout can take a frame to settle after the class appears.
    await expect.poll(async () => {
      const box = await picker.boundingBox();
      return box?.width ?? -1;
    }, { timeout: 5_000 }).toBeLessThan(80);
  });
});
