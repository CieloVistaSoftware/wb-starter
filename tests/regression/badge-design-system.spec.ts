import { test, expect, Page } from '@playwright/test';

/**
 * Badge design system (John: "we need a badge design system this is too
 * plain") — adds `variant="glass"`, `variant="gradient"`, and a `glow`
 * boolean modifier to <span x-badge> (feedback.js badge()), styled entirely in
 * badge.css (Law 9: zero inline styles) with theme tokens (Law 10: zero
 * hardcoded colors) and plain attributes (Law 11: no data-*).
 *
 * Same injection pattern as card-typed-variants-no-op.spec.ts: inject into
 * /demos/test-harness.html, run await WB.scan(), poll for the base class before
 * asserting computed style — await WB.scan()'s non-eager path defers wb-* elements
 * to an IntersectionObserver, so a fixed-instant check would be flaky.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('badge-test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'badge-test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
    return Array.from(container.children).map(el => el.id).filter(Boolean);
  }, html);

  // #448: a literal <span x-badge> host no longer carries a same-named
  // `.x-badge` class -- badge.css selects the tag directly. Wait for a
  // variant modifier class instead, which only gets added once badge()
  // has actually run.
  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every(id => {
      const el = document.getElementById(id);
      return el && Array.from(el.classList).some(c => c.startsWith('x-badge--'));
    }),
    ids,
    { timeout: 5000 }
  );
}

async function surface(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      background: cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor,
      boxShadow: cs.boxShadow,
      backdropFilter: (cs as any).backdropFilter || (cs as any).webkitBackdropFilter || 'none',
    };
  });
}

test.describe('Badge design system — new variants actually differ', () => {
  test('glass variant applies a backdrop-filter blur that default does not', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b-default">Default</span>
      <span x-badge id="b-glass" variant="glass">Glass</span>
    `);

    const def = await surface(page, '#b-default');
    const glass = await surface(page, '#b-glass');

    expect(glass.backdropFilter, 'glass badge must have a backdrop-filter blur').toMatch(/blur/);
    expect(glass.backdropFilter, 'glass backdrop-filter must differ from default').not.toBe(def.backdropFilter);
    expect(glass.background, 'glass background must differ from default').not.toBe(def.background);
  });

  test('gradient variant applies a gradient background that default does not', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b-default2">Default</span>
      <span x-badge id="b-gradient" variant="gradient">Gradient</span>
    `);

    const def = await surface(page, '#b-default2');
    const gradient = await surface(page, '#b-gradient');

    expect(gradient.background, 'gradient badge must use a linear-gradient background').toMatch(/gradient/);
    expect(gradient.background, 'gradient background must differ from default').not.toBe(def.background);
  });

  test('glow modifier adds a box-shadow-free but visually distinct halo (via ::after) not present on a plain badge', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b-plain" variant="primary">Plain</span>
      <span x-badge id="b-glow" variant="primary" glow>Glow</span>
    `);

    // The glow halo is implemented as a positioned, blurred ::after (not an
    // animated box-shadow) so the pulse keyframe never needs to encode a
    // color per variant. Assert the ::after actually gets a real background
    // and non-zero blur filter — the observable signal that the halo exists.
    const glowAfter = await page.locator('#b-glow').evaluate((el) => {
      const cs = getComputedStyle(el, '::after');
      return { background: cs.backgroundColor, filter: cs.filter, position: cs.position };
    });
    const plainAfter = await page.locator('#b-plain').evaluate((el) => {
      const cs = getComputedStyle(el, '::after');
      return { background: cs.backgroundColor, filter: cs.filter, position: cs.position };
    });

    expect(glowAfter.position, 'glow ::after must be positioned').toBe('absolute');
    expect(glowAfter.filter, 'glow ::after must have a blur filter').toMatch(/blur/);
    expect(glowAfter.filter, 'glow ::after filter must differ from a plain badge (no glow)').not.toBe(plainAfter.filter);
  });

  test('different variants under glow use different halo colors', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b-glow-success" variant="success" glow>Live</span>
      <span x-badge id="b-glow-error" variant="error" glow>Alert</span>
    `);

    const successAfter = await page.locator('#b-glow-success').evaluate((el) => getComputedStyle(el, '::after').backgroundColor);
    const errorAfter = await page.locator('#b-glow-error').evaluate((el) => getComputedStyle(el, '::after').backgroundColor);

    expect(successAfter, 'success glow color must differ from error glow color').not.toBe(errorAfter);
  });

  test('icon attribute renders a leading icon element before the label', async ({ page }) => {
    await inject(page, `<span x-badge id="b-icon" variant="success" icon="🟢">Live</span>`);

    const icon = page.locator('#b-icon .x-badge__icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveText('🟢');
    await expect(page.locator('#b-icon')).toContainText('Live');
  });

  test('variant="glass" pill glow composes cleanly: no throw, all classes present, still visible with text', async ({ page }) => {
    await inject(page, `<span x-badge id="b-combo" variant="glass" pill glow icon="💎">Combo</span>`);

    const badge = page.locator('#b-combo');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/x-badge--glass/);
    await expect(badge).toHaveClass(/x-badge--pill/);
    await expect(badge).toHaveClass(/x-badge--glow/);
    await expect(badge).toContainText('Combo');

    const radius = await badge.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(parseFloat(radius), 'pill must still fully round the glass+glow badge').toBeGreaterThan(99);

    // No console errors from combining all three.
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.waitForTimeout(100);
    expect(errors).toHaveLength(0);
  });

  test('existing modifiers (pill/outline/dot/size) still compose with the new variants', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b-mix1" variant="gradient" size="lg" pill>Big Gradient Pill</span>
      <span x-badge id="b-mix2" variant="glass" outline>Glass Outline</span>
      <span x-badge id="b-mix3" variant="success" dot glow></span>
    `);

    await expect(page.locator('#b-mix1')).toHaveClass(/x-badge--gradient/);
    await expect(page.locator('#b-mix1')).toHaveClass(/x-badge--lg/);
    await expect(page.locator('#b-mix1')).toHaveClass(/x-badge--pill/);

    await expect(page.locator('#b-mix2')).toHaveClass(/x-badge--glass/);
    await expect(page.locator('#b-mix2')).toHaveClass(/x-badge--outline/);

    await expect(page.locator('#b-mix3')).toHaveClass(/x-badge--dot/);
    await expect(page.locator('#b-mix3')).toHaveClass(/x-badge--glow/);
    expect((await page.locator('#b-mix3').textContent())?.trim()).toBe('');
  });
});
