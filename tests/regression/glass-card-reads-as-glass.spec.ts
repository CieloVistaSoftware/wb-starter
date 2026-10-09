/**
 * THE GLASS CARD READS AS GLASS (#832)
 * ====================================
 * John, on a Samsung S21: "Glass does not work on my samsung s71."
 *
 * Two causes, neither of them Samsung's:
 *  1. A glass card's demo stood on a flat colour. backdrop-filter blurs what
 *     is painted behind the element, and blurring a flat colour returns the
 *     same colour, so the blur could not show on any device.
 *  2. The moving sheen is what reads as glass, and reduced motion (Android's
 *     "Remove animations", and its power-saving modes) froze it, leaving an
 *     8% tint: "a slightly tinted rectangle".
 *
 * Now a demo holding a glass card stands it on bands of the theme's colours,
 * and under reduced motion glass carries a static treatment: the stronger
 * tint and border, a bright top edge and an inner highlight. An elevated
 * glass card keeps its elevation shadow.
 *
 * See it by hand: open demos/site/cards.html at "Glass Card". Before: a faint
 * box on the plain demo background. Now: the card is frosted over colour
 * bands. With the OS set to reduce motion, the card still has its bright edge.
 */
import { test, expect, type Page } from '../fixtures/offline';

const glassDemo = (page: Page) =>
  page.locator('#card-card [x-demo]').filter({ has: page.locator('article[variant="glass"][title="Glass Card"]') }).first();

async function openCards(page: Page) {
  await page.goto('/demos/site/cards.html');
  await expect(glassDemo(page).locator('article[variant="glass"]')).toHaveAttribute('x-ready', /.*/, { timeout: 20000 });
}

/** The glass card's surface: background, border and shadow, as computed. */
const surface = (page: Page, selector: string) => page.locator(selector).first().evaluate((el) => {
  const cs = getComputedStyle(el);
  return { background: cs.backgroundColor, border: cs.borderTopColor, shadow: cs.boxShadow };
});

/** What a custom property resolves to as a colour, read off a probe. */
const resolved = (page: Page, token: string) => page.evaluate((name) => {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${name})`;
  document.querySelector('article[variant="glass"]')!.after(probe);
  const value = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return value;
}, token);

test('a glass card\'s demo gives the blur something to blur', async ({ page }) => {
  await openCards(page);
  const stage = await glassDemo(page).locator('.x-demo__grid').evaluate((g) => getComputedStyle(g).backgroundImage);
  expect(stage, 'the stage behind the glass card is not a flat colour').toContain('gradient');
  const card = glassDemo(page).locator('article[variant="glass"]');
  expect(await card.evaluate((c) => getComputedStyle(c).backdropFilter)).toContain('blur');

  // Demos of other cards keep the plain stage.
  const plain = page.locator('#card-card [x-demo]').filter({ has: page.locator('article[title="Default Card"]') }).first();
  expect(await plain.locator('.x-demo__grid').evaluate((g) => getComputedStyle(g).backgroundImage)).toBe('none');
});

test.describe('with reduced motion', () => {
  test('glass carries a static treatment instead of the frozen sheen', async ({ page }) => {
    // emulateMedia, not test.use({ reducedMotion }): the offline fixture's
    // context does not take that option.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openCards(page);
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const glass = await surface(page, '#card-card article[variant="glass"][title="Glass Card"]');
    expect(glass.background, 'the stronger hover tint').toBe(await resolved(page, '--card-glass-bg-hover'));
    expect(glass.shadow, 'a bright top edge and an inner highlight').toContain('inset');

    // The elevated glass card at the top of the page keeps its elevation.
    const elevated = await surface(page, 'article[variant="glass"][elevated]');
    const layers = elevated.shadow.split(/,(?![^(]*\))/);
    expect(layers.some((l) => l.includes('inset'))).toBe(true);
    expect(layers.some((l) => !l.includes('inset')), 'the elevation shadow is still there').toBe(true);
  });
});

test('without reduced motion, glass is as it was: the sheen moves and there is no static highlight', async ({ page }) => {
  await openCards(page);
  const card = page.locator('#card-card article[variant="glass"][title="Glass Card"]');
  expect(await card.evaluate((c) => getComputedStyle(c, '::before').animationName)).toBe('x-card-glass-shimmer');
  expect((await surface(page, '#card-card article[variant="glass"][title="Glass Card"]')).shadow).not.toContain('inset');
});
