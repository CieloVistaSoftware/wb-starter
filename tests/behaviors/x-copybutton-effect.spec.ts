/**
 * Effect-based coverage for x-copybutton (#291): overlays a positioned copy
 * button on ANY element, reusing copy.js's shared writeToClipboard() core.
 * Distinct from x-copy (tests/behaviors/x-button-effect.spec.ts covers that
 * one's clipboard effect) — x-copy makes the element ITSELF the trigger;
 * x-copybutton puts a SEPARATE button on the element without changing what
 * the element does.
 *
 * Standard DEMOS-AND-DOCS-STANDARDS.md #19: every declared attribute must be
 * proven to produce its REAL effect (clipboard write / DOM mutation / event
 * payload) -- not just "the element rendered".
 *
 * Setup pattern copied from tests/behaviors/x-button-effect.spec.ts: goto
 * the lightweight test-harness page (wb-lazy.js runtime), inject markup,
 * then await WB.scan(document.body, { eager: true }) so behaviors attach
 * synchronously before any interaction is dispatched.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string, id = 'x-copybutton-effect-area'): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate(({ h, containerId }) => {
    const c = document.createElement('div');
    c.id = containerId;
    c.innerHTML = h;
    document.body.appendChild(c);
  }, { h: html, containerId: id });
  await page.evaluate(async () => {
    if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true });
  });
  await page.waitForTimeout(400);
}

test.describe('x-copybutton -- renders a positioned overlay button, host element unchanged', () => {
  test('a top-right button is injected inside a wrapper, and the host <textarea> stays a real, typeable textarea', async ({ page }) => {
    await setup(page, `<textarea id="ta" x-copybutton rows="3">npm install wb-starter</textarea>`);

    const wrapper = page.locator('#x-copybutton-effect-area .x-copybutton-wrapper');
    await expect(wrapper).toHaveCount(1);

    const btn = wrapper.locator('.x-copybutton__btn');
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveClass(/x-copybutton__btn--top-right/);

    // The host element is untouched by the overlay -- still the same
    // <textarea>, still editable (x-copy would instead turn the whole
    // element into the click trigger; x-copybutton must not).
    const textarea = page.locator('#ta');
    await expect(textarea).toBeVisible();
    await textarea.fill('still typeable');
    await expect(textarea).toHaveValue('still typeable');
  });

  test('position="bottom-left" renders the button in that corner instead of the default', async ({ page }) => {
    await setup(page, `<div id="card" x-copybutton position="bottom-left">Card body text</div>`);
    const btn = page.locator('#x-copybutton-effect-area .x-copybutton__btn');
    await expect(btn).toHaveClass(/x-copybutton__btn--bottom-left/);
    await expect(btn).not.toHaveClass(/x-copybutton__btn--top-right/);
  });
});

test.describe('x-copybutton -- click actually writes the host\'s content to the clipboard, with feedback', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('clicking the button copies a <textarea>\'s value and shows "Copied" feedback that reverts', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setup(page, `<textarea id="ta2" x-copybutton copy-duration="600">npm install wb-starter</textarea>`);

    const btn = page.locator('#x-copybutton-effect-area .x-copybutton__btn');

    const eventDetail = page.evaluate(() => new Promise((resolve) => {
      document.getElementById('ta2')!.addEventListener('wb:copy:success', (e: any) => resolve(e.detail), { once: true });
    }));
    await btn.click();
    const detail: any = await eventDetail;
    expect(detail.text).toBe('npm install wb-starter');

    // Visible feedback: button text swaps and the --copied class is added.
    await expect(btn).toHaveClass(/x-copybutton__btn--copied/);
    await expect(btn).toHaveText('Copied ✓');

    // Real clipboard effect, since permissions are granted for this origin.
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('npm install wb-starter');

    // Reverts after copy-duration.
    await expect(btn).not.toHaveClass(/x-copybutton__btn--copied/, { timeout: 2000 });
  });

  test('clicking the button on a <pre> copies its textContent', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setup(page, `<pre id="code-block" x-copybutton>const x = 1;</pre>`);

    const btn = page.locator('#x-copybutton-effect-area .x-copybutton__btn');
    await btn.click();
    await page.waitForTimeout(150);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('const x = 1;');
  });

  test('x-copybutton="#targetId" copies the TARGET element\'s content, not the host\'s own', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await setup(page, `
      <div>
        <code id="snippet">npm install wb-starter --save</code>
        <button id="target-btn" x-copybutton="#snippet">Host label, not what gets copied</button>
      </div>
    `);

    const btn = page.locator('#x-copybutton-effect-area .x-copybutton__btn');
    await btn.click();
    await page.waitForTimeout(150);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('npm install wb-starter --save');
  });

  test('a11y: the injected control is a focusable, labeled <button>', async ({ page }) => {
    await setup(page, `<textarea id="ta3" x-copybutton label="Copy the command">npm install wb-starter</textarea>`);
    const btn = page.locator('#x-copybutton-effect-area .x-copybutton__btn');
    await expect(btn).toHaveAttribute('type', 'button');
    await expect(btn).toHaveAttribute('aria-label', 'Copy the command');
    await btn.focus();
    await expect(btn).toBeFocused();
  });
});
