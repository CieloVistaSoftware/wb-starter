import { test, expect, type Page } from '@playwright/test';

/**
 * A multi-line <code> listing must keep its lines.
 *
 * John, on the Behaviors showcase's `code` demo: "not formatted right...". A
 * 27-line JavaScript listing rendered as ONE wrapped paragraph — every newline
 * collapsed to a space, the whole thing reflowed as prose.
 *
 * Cause: `variant` defaults to "inline" in code.schema.json. That is correct
 * for the common case (a `<code>wb-card</code>` chip amid prose) and wrong for
 * a standalone listing — an inline box gets `white-space: normal`, so source
 * newlines are collapsed by CSS before anyone sees them.
 *
 * The fix keys on the CONTENT (does it contain a newline?) rather than on the
 * attribute, so the many single-line inline chips across the docs keep their
 * existing treatment. Both halves of that are asserted here: a regression in
 * either direction is a real defect.
 *
 * Assertions are on RENDERED line count and computed white-space, not on the
 * presence of "\n" in textContent — the newlines were always in the DOM; CSS
 * was throwing them away. A textContent check would have passed throughout.
 */

const FIXTURE = '/tests/fixtures/blank.html';

const LISTING = [
  '// Debounce — delay a call until the caller stops firing.',
  'export function debounce(fn, wait = 200) {',
  '  let timer = null;',
  '  return function debounced(...args) {',
  '    clearTimeout(timer);',
  '  };',
  '}',
].join('\n');

async function render(page: Page, markup: string) {
  await page.goto(FIXTURE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async (html) => {
    const host = document.createElement('div');
    host.id = 'harness';
    host.style.cssText = 'width: 700px;';
    document.body.appendChild(host);
    host.innerHTML = html;
    const mod: any = await import('/src/core/wb-lazy.js');
    const WB = mod.default || mod.WB;
    await WB.scan(host, { eager: true });
  }, markup);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

function info(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      whiteSpace: cs.whiteSpace,
      renderedLines: (el.innerText || '').split('\n').filter((l) => l.trim()).length,
      height: Math.round(el.getBoundingClientRect().height),
    };
  }, selector);
}

test.describe('multi-line <code> keeps its line breaks', () => {
  test('a standalone listing renders one line per source line', async ({ page }) => {
    await render(page, `<code id="listing" language="javascript">\n${LISTING}\n</code>`);

    const got = await info(page, '#listing');
    expect(got, 'the listing should exist').not.toBeNull();
    expect(got!.whiteSpace, 'a listing must preserve its newlines').toMatch(/^pre/);
    expect(got!.renderedLines, `expected ${LISTING.split('\n').length} rendered lines`)
      .toBe(LISTING.split('\n').length);
  });

  test('it is visibly tall, not collapsed into a paragraph', async ({ page }) => {
    // The reported symptom was geometric: many lines squashed into a short
    // wrapped block. One line of monospace is roughly 20px, so a 7-line
    // listing that renders under 80px tall has collapsed.
    await render(page, `<code id="listing" language="javascript">\n${LISTING}\n</code>`);
    const got = await info(page, '#listing');
    expect(got!.height, 'a 7-line listing should be visibly tall').toBeGreaterThan(80);
  });

  test('a single-line inline chip is NOT turned into a block', async ({ page }) => {
    // The other half of the fix: keying on content instead of the variant
    // attribute must leave every inline `<code>` chip in the docs alone.
    await render(page, `<p>prose with <code id="chip">wb-card</code> inline</p>`);

    const got = await info(page, '#chip');
    expect(got!.renderedLines, 'an inline chip stays on one line').toBe(1);
    expect(got!.whiteSpace, 'and keeps its inline whitespace handling').not.toMatch(/^pre/);
    expect(got!.height, 'and stays chip-sized').toBeLessThan(60);
  });

  test('a multi-word inline snippet still wraps normally', async ({ page }) => {
    // Guard on the documented themes.php-style case: multi-word inline code
    // must wrap at spaces rather than run off its container. It has no
    // newline, so it must not be promoted to a block.
    await render(page, `<p><code id="formula">Colors = Primary + 0°, 120°, 240°</code></p>`);
    const got = await info(page, '#formula');
    expect(got!.whiteSpace, 'no newline means no block promotion').not.toMatch(/^pre/);
  });
});
