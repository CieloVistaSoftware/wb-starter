/**
 * Behaviors page — remaining sections coverage (Overlays / Selection / Inputs /
 * Media / Utilities / Data). Goal: every action on the page is exercised and
 * none throws. Breadth via a present-and-no-error sweep, plus targeted
 * interaction checks for the key overlays/inputs.
 */
import { test, expect, Page, Locator } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForSelector('[x-badge], [x-bounce], [x-modal], input', { timeout: 20000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}
async function reveal(loc: Locator) {
  try { await loc.first().scrollIntoViewIfNeeded({ timeout: 4000 }); } catch { /* zero-box ok */ }
  await loc.page().waitForTimeout(200);
}

// breadth sweep: each must be present and upgrade without throwing (no x-error)
const SWEEP = [
  '[x-modal]', '[x-drawer]', '[x-audio]',
  '[x-tooltip]', '[x-popover]', '[x-confirm]', '[x-prompt]', '[x-lightbox]',
  '[x-stepper]', '[x-masked]', '[x-password]',
  '[x-gallery]', '[x-image]', '[x-youtube]',
  '[x-share]', '[x-print]', '[x-fullscreen]', '[x-truncate]', '[x-kbd]', '[x-timeline]',
  'input[type="checkbox"]', 'input[type="radio"]', 'input[type="range"]', 'select',
];

test.describe('Behaviors page — remaining sections (sweep)', () => {
  for (const sel of SWEEP) {
    test(`${sel} is present and upgrades without error`, async ({ page }) => {
      await loadPage(page);
      const el = page.locator(sel);
      const n = await el.count();
      expect(n, `${sel} present`).toBeGreaterThan(0);
      await reveal(el);
      const errored = await el.first().getAttribute('x-error');
      expect(errored, `${sel} should not be x-error`).not.toBe('true');
    });
  }
});

test.describe('Behaviors page — key interactions', () => {
  test('tooltip appears on hover', async ({ page }) => {
    await loadPage(page);
    const trg = page.locator('[x-tooltip]').first();
    await reveal(trg);
    await trg.hover();
    await page.waitForTimeout(300);
    // a tooltip element/text should become visible somewhere
    const shown = await page.evaluate(() => {
      const tips = Array.from(document.querySelectorAll('.wb-tooltip, [role="tooltip"], .tooltip'));
      return tips.some((t) => (t as HTMLElement).offsetParent !== null || getComputedStyle(t).opacity !== '0');
    });
    expect(shown).toBe(true);
  });

  test('modal opens from its trigger', async ({ page }) => {
    await loadPage(page);
    const opener = page.locator('[x-modal], [data-modal], button:has-text("Open Modal"), button:has-text("Modal")').first();
    if (await opener.count() === 0) test.skip();
    await reveal(opener);
    await opener.click();
    await page.waitForTimeout(300);
    const open = await page.evaluate(() => {
      const m = document.querySelector('wb-modal, .wb-modal, dialog[open], .modal');
      return !!m && (m as HTMLElement).offsetParent !== null;
    });
    expect(open).toBe(true);
  });

  test('checkbox toggles', async ({ page }) => {
    await loadPage(page);
    const cb = page.locator('input[type="checkbox"]').first();
    await reveal(cb);
    const before = await cb.isChecked();
    await cb.click();
    expect(await cb.isChecked()).toBe(!before);
  });

  test('kbd renders key caps', async ({ page }) => {
    await loadPage(page);
    const kbd = page.locator('[x-kbd]').first();
    await reveal(kbd);
    await expect(kbd).not.toHaveText('');
  });

  test('truncate clamps long text', async ({ page }) => {
    await loadPage(page);
    const tr = page.locator('[x-truncate]').first();
    if (await tr.count() === 0) test.skip();
    await reveal(tr);
    const overflow = await tr.evaluate((el) => getComputedStyle(el).overflow + '|' + getComputedStyle(el).textOverflow + '|' + getComputedStyle(el).webkitLineClamp);
    expect(overflow).toMatch(/hidden|ellipsis|[1-9]/);
  });
});
