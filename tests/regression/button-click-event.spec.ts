import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#344 schema/behavior completeness audit):
 * button.schema.json's `interactions.elements.element.click.event` always
 * documented "wb:button:click" as the event this behavior fires, but
 * button() (src/wb-viewmodels/semantics/button.js) never actually
 * dispatched any custom event -- only the native "click" event existed, and
 * the schema had no top-level `events` section declaring it either. A
 * documented-but-never-implemented event. Fixed by dispatching a real
 * bubbling `wb:button:click` CustomEvent (in addition to native click) for
 * both <wb-button> and native <button> paths, and adding the missing
 * top-level `events` section to the schema.
 */
test.describe('wb:button:click event dispatch (#344)', () => {
  test('<wb-button> dispatches wb:button:click on click', async ({ page }) => {
    await page.goto('/');
    await page.setContent(`
      <wb-button id="wbb">Click me</wb-button>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__wbDone = false;
        WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
      </script>
    `);
    await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

    const fired = await page.evaluate(() => {
      return new Promise((resolve) => {
        const el = document.getElementById('wbb')!;
        el.addEventListener('wb:button:click', () => resolve(true), { once: true });
        // NOTE: <wb-button>'s customElements.define() is unexpectedly owned by
        // the unrelated "WB Views" system (see button.js's own comment on
        // synthesizeClick()) -- that class's element.click() silently no-ops,
        // so a real click must be dispatched instead, same as button.js's own
        // keyboard (Enter/Space) handling already does.
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        setTimeout(() => resolve(false), 2000);
      });
    });

    expect(fired).toBe(true);
  });

  test('a plain native <button> also dispatches wb:button:click', async ({ page }) => {
    await page.goto('/');
    await page.setContent(`
      <button id="nativeBtn">Native</button>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__wbDone = false;
        WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
      </script>
    `);
    await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

    const fired = await page.evaluate(() => {
      return new Promise((resolve) => {
        const el = document.getElementById('nativeBtn')!;
        el.addEventListener('wb:button:click', () => resolve(true), { once: true });
        (el as HTMLElement).click();
        setTimeout(() => resolve(false), 2000);
      });
    });

    expect(fired).toBe(true);
  });
});
