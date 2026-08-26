import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#344 schema/behavior completeness audit):
 *
 * 1. `move.schema.json` (schemaFor "move") had NO matching exported `move()`
 *    function anywhere in src/wb-viewmodels, AND wb-viewmodels/index.js's
 *    `behaviorModules` table had no `move` key at all -- even though
 *    tag-map.js's elementMap/extensionMap already mapped <div x-move> and
 *    [x-move] to behavior name "move". Using either the tag or the
 *    attribute threw "[WB] Unknown behavior: move" the moment WB tried to
 *    resolve it. Fixed by adding a real `move()` entry point (move.js) that
 *    marks the container with the schema's baseClass and wires up any
 *    descendant [x-moveup]/[x-movedown]/[x-moveleft]/[x-moveright] buttons,
 *    plus registering `move: 'move'` in behaviorModules.
 *
 * 2. movedown()/moveleft()/moveright() (move.js) each referenced undefined
 *    variables inside their click handlers (e.g. movedown() declared
 *    `dataItem`/`moveContainer`/`focusIndex`/`destinationIndex` but then
 *    read `item`/`container`/`currentIndex`/`targetIndex`, none of which
 *    existed in scope) -- every click on a move-down/left/right button threw
 *    a ReferenceError instead of swapping elements. Only moveup() worked.
 *    Fixed by renaming each handler's locals to match what it actually uses.
 */
test.describe('x-move behavior (#344)', () => {
  test('<div x-move> resolves without "Unknown behavior" and gets the baseClass', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.setContent(`
      <div id="grid" style="display:grid;grid-template-columns:1fr 1fr;">
        <div x-move id="mv">
          <div class="grid-item" id="item-a">A<button x-moveright>Right</button></div>
          <div class="grid-item" id="item-b">B<button x-moveleft>Left</button></div>
        </div>
      </div>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__wbDone = false;
        WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
      </script>
    `);
    await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

    const host = page.locator('#mv');
    await expect(host).toHaveClass(/(^|\s)x-move(\s|$)/, { timeout: 10000 });

    const unknownBehaviorErrors = errors.filter((e) => e.includes('Unknown behavior'));
    expect(unknownBehaviorErrors, `Console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('moveright/moveleft swap adjacent grid items without throwing (#344)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');
    await page.setContent(`
      <div x-move id="mv" style="display:grid;grid-template-columns:1fr 1fr;">
        <div class="grid-item" data-moveable id="item-a">A<button id="btn-right" x-moveright>Right</button></div>
        <div class="grid-item" data-moveable id="item-b">B<button id="btn-left" x-moveleft>Left</button></div>
      </div>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__wbDone = false;
        WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
      </script>
    `);
    await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

    // Before: A, B. After clicking A's "move right": B, A.
    const orderBefore = await page.locator('.grid-item').allTextContents();
    expect(orderBefore[0]).toContain('A');
    expect(orderBefore[1]).toContain('B');

    await page.locator('#btn-right').click();

    const orderAfter = await page.locator('.grid-item').allTextContents();
    expect(orderAfter[0]).toContain('B');
    expect(orderAfter[1]).toContain('A');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('movedown does not throw ReferenceError when clicked (#344)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/');
    await page.setContent(`
      <div x-move id="mv">
        <div class="moveable" id="row-1">Row 1<button id="btn-down" x-movedown>Down</button></div>
        <div class="moveable" id="row-2">Row 2</div>
      </div>
      <script type="module">
        import WB from '/src/core/wb.js';
        window.__wbDone = false;
        WB.init({ autoInject: true }).then(() => WB.scan(document.body)).then(() => { window.__wbDone = true; });
      </script>
    `);
    await page.waitForFunction(() => (window as any).__wbDone === true, { timeout: 30000 });

    await page.locator('#btn-down').click();

    const order = await page.locator('.moveable').allTextContents();
    expect(order[0]).toContain('Row 2');
    expect(order[1]).toContain('Row 1');
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });
});
