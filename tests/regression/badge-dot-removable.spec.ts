import { test, expect, Page } from '@playwright/test';

/**
 * #415: `<span x-badge dot removable>` rendered NOTHING usable -- `removable`'s
 * remove-button construction lived entirely inside feedback.js badge()'s
 * `else` branch (the non-dot branch), so setting `dot` silently swallowed
 * `removable`: no dot visual with any room to show, no remove button, and
 * for `outline` the whole element collapsed to a transparent-background 8px
 * circle with a 1px border, which is not usably visible.
 *
 * Root cause confirmed: `dot` and `removable` are NOT mutually exclusive --
 * dot = a small colored indicator instead of a text label, removable = a
 * close/remove affordance. feedback.js's badge() now builds the remove
 * button outside the dot/else split (runs whenever `removable` is true,
 * regardless of `dot`), and badge.css scopes the dot's whole-element 8px
 * circle-collapse to `.x-badge--dot:not(.x-badge--removable)` so a
 * dot+removable badge keeps normal badge sizing/rounding (respecting
 * size/pill) and renders the dot as a small `.x-badge__dot` inline
 * indicator instead.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  const ids = await page.evaluate(async (h: string) => {
    const existing = document.getElementById('badge-dot-removable-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'badge-dot-removable-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
    return Array.from(container.children).map(el => el.id).filter(Boolean);
  }, html);

  await page.waitForFunction(
    (elementIds: string[]) => elementIds.every(id => {
      const el = document.getElementById(id);
      return el && Array.from(el.classList).some(c => c.startsWith('x-badge--'));
    }),
    ids,
    { timeout: 5000 }
  );
}

test.describe('Badge — dot + removable (#415)', () => {

  test('the exact reported combo (default/xs/pill/dot/outline/removable) shows a dot AND a working remove button', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b415" label="default-xs-pill-dot-outline-removable" variant="default" size="xs" pill dot outline removable>
        label=default-xs-pill-dot-outline-removable, variant=default, size=xs, pill, dot, outline, removable
      </span>
    `);

    const badge = page.locator('#b415');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(/x-badge--dot/);
    await expect(badge).toHaveClass(/x-badge--outline/);
    await expect(badge).toHaveClass(/x-badge--pill/);
    await expect(badge).toHaveClass(/x-badge--removable/);

    // The dot visual must render as a real, sized element -- not just a
    // class name with no visible box (the pre-fix bug: `dot` cleared all
    // text/children and `removable`'s button-building code never ran).
    const dotBox = await badge.locator('.x-badge__dot').boundingBox();
    expect(dotBox, 'dot indicator (.x-badge__dot) must render with real dimensions').not.toBeNull();
    expect(dotBox!.width).toBeGreaterThan(0);
    expect(dotBox!.height).toBeGreaterThan(0);

    // The remove button must exist, be visible, and actually be clickable --
    // this element did not exist at all before the fix.
    const removeBtn = badge.locator('.x-badge__remove');
    await expect(removeBtn).toBeVisible();
    const btnBox = await removeBtn.boundingBox();
    expect(btnBox, 'remove button must have real dimensions').not.toBeNull();
    expect(btnBox!.width).toBeGreaterThan(0);
    expect(btnBox!.height).toBeGreaterThan(0);

    // The badge as a whole must not have collapsed into the 8px dot-only
    // box -- there must be room for both the dot and the remove button.
    const badgeBox = await badge.boundingBox();
    expect(badgeBox!.width).toBeGreaterThan(8);

    // Outline must be VISIBLY applied, not just present as a class: transparent
    // background + a real (non-zero) border.
    const outlineStyle = await badge.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { background: cs.backgroundColor, borderWidth: cs.borderTopWidth };
    });
    expect(parseFloat(outlineStyle.borderWidth)).toBeGreaterThan(0);
    expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(outlineStyle.background);

    // Clicking the remove button actually removes the badge.
    await removeBtn.click();
    await expect(badge).toHaveCount(0);
  });

  test('dot + removable without outline still shows a filled (non-transparent) dot indicator and remove button', async ({ page }) => {
    await inject(page, `
      <span x-badge id="b415-filled" variant="success" dot removable>Live</span>
    `);

    const badge = page.locator('#b415-filled');
    await expect(badge.locator('.x-badge__dot')).toBeVisible();
    await expect(badge.locator('.x-badge__remove')).toBeVisible();

    const bg = await badge.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg, 'non-outline dot+removable badge must keep its filled variant background').not.toBe('rgba(0, 0, 0, 0)');

    // Sanity: outline visibly differs from filled for the same combo (proves
    // outline isn't a no-op on a dot+removable badge).
    await inject(page, `
      <span x-badge id="b415-filled2" variant="success" dot removable>Live</span>
      <span x-badge id="b415-outline2" variant="success" dot outline removable>Live</span>
    `);
    const filledBg = await page.locator('#b415-filled2').evaluate((el) => getComputedStyle(el).backgroundColor);
    const outlineBg = await page.locator('#b415-outline2').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(outlineBg, 'outline background must differ from filled background').not.toBe(filledBg);
  });

  test('a plain dot badge (no removable) still collapses to a small circle with no remove button', async ({ page }) => {
    // Guards against a regression in the OTHER direction: fixing dot+removable
    // must not change plain dot-only badges.
    await inject(page, '<span x-badge id="b415-plain-dot" variant="info" dot></span>');

    const badge = page.locator('#b415-plain-dot');
    await expect(badge.locator('.x-badge__remove')).toHaveCount(0);
    expect((await badge.textContent())?.trim()).toBe('');

    const box = await badge.boundingBox();
    expect(box!.width, 'plain dot (no removable) must stay collapsed to its small circle').toBeLessThanOrEqual(10);
  });

  test('removable without dot is unaffected (remove button still renders on a normal labeled badge)', async ({ page }) => {
    await inject(page, '<span x-badge id="b415-plain-removable" label="Tag" variant="info" removable></span>');

    const badge = page.locator('#b415-plain-removable');
    await expect(badge).toContainText('Tag');
    await expect(badge.locator('.x-badge__remove')).toBeVisible();
  });
});
