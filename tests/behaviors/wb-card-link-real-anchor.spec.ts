/**
 * <wb-card-link>'s click handler called e.preventDefault() then
 * window.open(href, target) on a plain <div> — not native link
 * navigation. Some mobile browsers (confirmed: Samsung Internet) handle
 * a JS-triggered window.open() differently from an actual tapped
 * <a target="_blank">, including viewport/rendering context — reported
 * live as "tapping any demo card opens a desktop-style window".
 *
 * Fixed in src/wb-viewmodels/card.js: a real, stretched <a href
 * target="_blank" rel="noopener"> now covers the whole card instead.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'cardlink-test-area';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('<wb-card-link> renders a real stretched <a> (not JS window.open)', () => {
  test('a real anchor with the right href/target/rel exists inside the card', async ({ page }) => {
    await setup(page, '<wb-card-link id="cl1" title="Example" href="/demos/site/forms.html" target="_blank"></wb-card-link>');
    const link = page.locator('#cl1 a');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', /\/demos\/site\/forms\.html$/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
  });

  test('the anchor is stretched to cover the whole card (position:absolute, inset:0)', async ({ page }) => {
    await setup(page, '<wb-card-link id="cl2" title="Example" href="/demos/site/forms.html" target="_blank"></wb-card-link>');
    const link = page.locator('#cl2 a');
    const styles = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { position: cs.position, top: cs.top, left: cs.left, right: cs.right, bottom: cs.bottom };
    });
    expect(styles.position).toBe('absolute');
    expect(styles.top).toBe('0px');
    expect(styles.left).toBe('0px');
  });

  test('clicking the card triggers real navigation (a new tab opens, not window.open())', async ({ page, context }) => {
    await setup(page, '<wb-card-link id="cl3" title="Example" href="/demos/site/forms.html" target="_blank"></wb-card-link>');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.locator('#cl3').click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toMatch(/\/demos\/site\/forms\.html$/);
    await popup.close();
  });
});
