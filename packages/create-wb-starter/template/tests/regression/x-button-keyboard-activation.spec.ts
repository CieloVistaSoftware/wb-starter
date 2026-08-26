import { test, expect } from '@playwright/test';
import { setupBehaviorTest, setupTestContainer } from '../base';

/**
 * <button> deliberately does NOT build a real inner <button> -- CSS
 * targets the x-button tag/attributes directly instead (see the doc
 * comment at the top of semantics/button.js). It sets role="button" and
 * tabindex="0" so it reads as a button to assistive tech, which is a valid
 * pattern IF the rest of the WAI-ARIA button contract is implemented too --
 * specifically, activating via Enter or Space, since a non-native element
 * gets no default key handling the way a real <button> does. button.js
 * never wires that up: found live via HOST-CHILD-DISPATCH-AUDIT.md's
 * semantic-element-fidelity sweep, then confirmed directly -- a focused
 * <button> does not fire a click on Enter or Space at all.
 */
test.describe('x-button responds to keyboard activation like a real <button>', () => {
  test.beforeEach(async ({ page }) => {
    await setupBehaviorTest(page);
  });

  test('Enter activates a focused x-button', async ({ page }) => {
    const el = await setupTestContainer(page, '<button>Click me</button>');
    let clicked = false;
    await el.evaluate((node) => { (node as any).addEventListener('click', () => { (node as any).__clicked = true; }); });
    await el.focus();
    await page.keyboard.press('Enter');
    clicked = await el.evaluate((node) => !!(node as any).__clicked);
    expect(clicked).toBe(true);
  });

  test('Space activates a focused x-button', async ({ page }) => {
    const el = await setupTestContainer(page, '<button>Click me</button>');
    await el.evaluate((node) => { (node as any).addEventListener('click', () => { (node as any).__clicked = true; }); });
    await el.focus();
    await page.keyboard.press('Space');
    const clicked = await el.evaluate((node) => !!(node as any).__clicked);
    expect(clicked).toBe(true);
  });
});
