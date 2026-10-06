import { test, expect } from '../fixtures/offline';

/**
 * Colour attributes take the theme's colour NAME (#907).
 *
 * `<button x-glow color="success">` used to set `--glow-color: success`, which
 * is not a colour, so the glow silently fell back to primary. The author had
 * to write `color="var(--success-color)"` and know the token's name to get it.
 *
 * Now a theme name resolves to its token (src/core/theme-color.js), and for
 * x-glow the name is matched in CSS, so the element carries nothing generated.
 * A real colour (#ff00aa) still works.
 */
async function probe(page: import('@playwright/test').Page, markup: string, token: string) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
  return page.evaluate(async ({ html, token }) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el = host.firstElementChild as HTMLElement;
    // What the token resolves to on this theme, as a computed colour.
    const ref = document.createElement('span');
    ref.style.color = token ? `var(${token})` : '';
    host.appendChild(ref);
    const cs = getComputedStyle(el);
    return {
      expected: getComputedStyle(ref).color,
      boxShadow: cs.boxShadow,
      background: cs.backgroundColor,
      generated: el.getAttribute('data-x-style'),
      style: el.getAttribute('style'),
    };
  }, { html: markup, token });
}

test('x-glow color="success" glows in the success colour and writes nothing on the element', async ({ page }) => {
  const r = await probe(page, '<button x-glow color="success">Saved</button>', '--success-color');
  expect(r.boxShadow, 'the halo is the success colour').toContain(r.expected);
  expect(r.generated, 'no generated rule: CSS matched the name').toBeNull();
  expect(r.style, 'no inline style').toBeNull();
});

test('x-glow color="#ff00aa" still glows in that exact colour', async ({ page }) => {
  const r = await probe(page, '<button x-glow color="#ff00aa">Hot</button>', '');
  expect(r.boxShadow).toContain('rgb(255, 0, 170)');
});

test('x-grid background="bg-tertiary" paints the theme\'s tertiary background', async ({ page }) => {
  const r = await probe(page, '<div x-grid background="bg-tertiary"><div>a</div></div>', '--bg-tertiary');
  expect(r.background).toBe(r.expected);
});

test('x-stack bg="success" paints the success colour', async ({ page }) => {
  const r = await probe(page, '<div x-stack bg="success"><div>a</div></div>', '--success-color');
  expect(r.background).toBe(r.expected);
});
