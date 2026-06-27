/**
 * wb-accordion: markup is three SIBLING accordions each with its own answer —
 * the body no longer duplicates the title (#145). (The original bug was malformed
 * nested markup that made each accordion's "content" echo the title.)
 */
import { test, expect, Page } from '@playwright/test';

async function loadPage(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
  await page.waitForSelector('wb-accordion', { timeout: 20000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

test('three sibling accordions, each with its distinct answer (not the title)', async ({ page }) => {
  await loadPage(page);
  await page.locator('wb-accordion').first().scrollIntoViewIfNeeded();
  // markup fix: three SIBLING accordions (the malformed version nested them)
  expect(await page.locator('wb-accordion').count()).toBeGreaterThanOrEqual(3);

  // each distinct answer renders on the page (proves bodies hold answers, not duplicated titles)
  await expect(page.locator('body')).toContainText('zero-build web component library');
  await expect(page.locator('body')).toContainText('No installation needed');
  await expect(page.locator('body')).toContainText('enterprise hardened');

  // and no accordion's own content is just its title repeated
  const dup = await page.locator('wb-accordion').evaluateAll((els) => els.filter((e) => {
    const title = (e.getAttribute('title') || '').trim();
    const body = (e.querySelector('p')?.textContent || '').trim();
    return title && body && title === body;
  }).length);
  expect(dup, 'no accordion body equals its title').toBe(0);
});
