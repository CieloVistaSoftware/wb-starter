/**
 * x-toggle — effect-based coverage (Standard #19: every declared attribute
 * must be tested to actually WORK, not merely that the element renders).
 * The auto-generated tests/components/toggle.spec.ts only checks render +
 * no-console-errors; this file asserts the real behavior of toggle.js:
 * class toggling (self and `target`), aria-pressed, keyboard activation,
 * and the wb:toggle event.
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = '/demos/test-harness.html';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate((h: string) => {
    const container = document.createElement('div');
    container.id = 'toggle-effect-test-area';
    container.innerHTML = h;
    document.body.appendChild(container);
  }, html);
  // `{ eager: true }` skips wb-lazy.js's IntersectionObserver deferral — the
  // default lazy scan can leave toggle.js's event listeners un-attached by
  // the time a one-shot interaction (a single click, a single keypress) is
  // dispatched below, since only assertions retry, not the interaction
  // itself. x-demo-width-and-toggle.spec.ts uses the same fix.
  await page.evaluate(async () => {
    await (window as any).WB.scan(document.getElementById('toggle-effect-test-area'), { eager: true });
  });
  await page.waitForTimeout(100);
}

test.describe('[x-toggle] behavior effects', () => {
  test('clicking toggles the default "active" class on itself and updates aria-pressed', async ({ page }) => {
    await setup(page, '<div x-toggle id="t1">Click me</div>');
    const el = page.locator('#t1');

    await expect(el).toHaveAttribute('aria-pressed', 'false');
    await el.click();
    await expect(el).toHaveClass(/active/);
    await expect(el).toHaveAttribute('aria-pressed', 'true');

    await el.click();
    await expect(el).not.toHaveClass(/active/);
    await expect(el).toHaveAttribute('aria-pressed', 'false');
  });

  test('target attribute toggles the class on the referenced element, not just itself', async ({ page }) => {
    await setup(page, '<div x-toggle id="t2" target="#panel2">Show</div><div id="panel2">Panel content</div>');
    const trigger = page.locator('#t2');
    const target = page.locator('#panel2');

    await expect(target).not.toHaveClass(/active/);
    await trigger.click();
    await expect(target).toHaveClass(/active/);

    await trigger.click();
    await expect(target).not.toHaveClass(/active/);
  });

  test('toggle-class attribute toggles that class instead of the default "active"', async ({ page }) => {
    // Note: a literal `class="highlighted"` attribute is NOT the config
    // channel for this — toggle.js reads a pre-existing `class` attribute as
    // the class to flip, so it would already count as "on" at parse time and
    // a click would immediately remove it. `toggle-class` is the declared,
    // non-destructive way to rename the toggled class.
    await setup(page, '<div x-toggle id="t3" toggle-class="highlighted">Custom</div>');
    const el = page.locator('#t3');

    await expect(el).not.toHaveClass(/highlighted/);
    await el.click();
    await expect(el).toHaveClass(/highlighted/);
    await expect(el).not.toHaveClass(/\bactive\b/);
  });

  test('Enter key triggers the same toggle effect as a click', async ({ page }) => {
    await setup(page, '<div x-toggle id="t4">Key toggle</div>');
    const el = page.locator('#t4');

    await el.focus();
    await el.press('Enter');
    await expect(el).toHaveClass(/active/);
    await expect(el).toHaveAttribute('aria-pressed', 'true');
  });

  test('fires a wb:toggle custom event carrying the new active state', async ({ page }) => {
    await setup(page, '<div x-toggle id="t5">Event</div>');

    await page.evaluate(() => {
      (window as any).__wbToggleDetail = null;
      document.getElementById('t5')!.addEventListener('wb:toggle', (e: Event) => {
        (window as any).__wbToggleDetail = (e as CustomEvent).detail;
      });
    });

    await page.locator('#t5').click();
    const detail = await page.evaluate(() => (window as any).__wbToggleDetail);
    expect(detail).toBeTruthy();
    expect(detail.active).toBe(true);
  });
});
