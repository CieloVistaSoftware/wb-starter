import { test, expect, type Page } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';

/**
 * #344: x-carddraggable carried its own copy of x-draggable's drag code and
 * fired wb:carddraggable:* events while its schema promised wb:drag:*. It now
 * drags through draggable(), with its header as the handle, so one
 * implementation fires one set of events.
 *
 * Moving it surfaced a bug in that one implementation: bounds="parent" and
 * "viewport" clamped left/top to [0, container - size], which is only right
 * for a box whose origin is the container's corner. A position:relative box
 * lower in its parent could not be dragged up at all.
 */

/** Drag `selector` by (dx, dy) with the mouse, in a few steps. */
async function drag(page: Page, selector: string, dx: number, dy: number) {
  const box = (await page.locator(selector).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 });
  await page.mouse.move(x + dx, y + dy, { steps: 3 });
  await page.mouse.up();
}

test('dragging a card by its header moves it and fires wb:drag:start, move and end', async ({ page }) => {
  await injectAndScan(page, '<article id="cd" x-carddraggable title="Notes">Drag me by the header.</article>');
  await expect(page.locator('#cd .x-card__drag-handle')).toHaveCount(1, { timeout: 15000 });
  await page.evaluate(() => {
    (window as any).__drag = [];
    for (const name of ['wb:drag:start', 'wb:drag:move', 'wb:drag:end']) {
      document.getElementById('cd')!.addEventListener(name, () => (window as any).__drag.push(name));
    }
  });
  const before = (await page.locator('#cd').boundingBox())!;
  await drag(page, '#cd .x-card__drag-handle', 60, 30);
  // Cards transition every property for 0.2s, left/top included, so the box
  // arrives a moment after the pointer stops. Only x is read off the box: a
  // hovered card also lifts 2px, which is not the drag.
  await expect.poll(async () => Math.round((await page.locator('#cd').boundingBox())!.x - before.x)).toBe(60);
  const fired: string[] = await page.evaluate(() => (window as any).__drag);
  expect(fired[0]).toBe('wb:drag:start');
  expect(fired).toContain('wb:drag:move');
  expect(fired[fired.length - 1]).toBe('wb:drag:end');
  // The card API reads the left/top x-draggable wrote: the whole drag.
  await expect.poll(() => page.evaluate(() => (document.getElementById('cd') as any).wbCardDraggable.getPosition())).toEqual({ x: 60, y: 30 });
});

test('bounds="parent" lets a box low in its parent move up to the parent edge, and no further', async ({ page }) => {
  await injectAndScan(page, `
    <div id="pa" style="position: relative; width: 400px; height: 300px; border: 1px solid">
      <div style="height: 150px"></div>
      <div id="bx" x-draggable bounds="parent" style="width: 100px; height: 50px; background: #888">box</div>
    </div>`);
  await expect(page.locator('#bx')).toHaveClass(/x-draggable/, { timeout: 15000 });
  const parent = (await page.locator('#pa').boundingBox())!;

  await drag(page, '#bx', 0, -100);
  let box = (await page.locator('#bx').boundingBox())!;
  expect(Math.round(box.y - parent.y), 'it moved up 100px; it used to be pinned where it started').toBe(51);

  await drag(page, '#bx', 0, -500);
  box = (await page.locator('#bx').boundingBox())!;
  // The parent's border box is the limit, as it was for the card's own code.
  expect(Math.round(box.y - parent.y), 'and stops at the parent edge').toBe(0);
});
