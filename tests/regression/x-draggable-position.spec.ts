import { test, expect, Page } from '@playwright/test';

/**
 * #390: <div x-draggable> (and bare x-draggable) jumped to a wildly wrong
 * position on every drag instead of tracking the mouse 1:1. Root cause,
 * traced in src/wb-viewmodels/draggable.js: `initialLeft/Top` were read
 * from `element.offsetLeft/offsetTop` (position within the offsetParent,
 * from normal document flow), but the drag then applied deltas via
 * `element.style.left/top` -- which for a `position: relative` element
 * (draggable.js sets this on every element that starts `static`, i.e.
 * every real-world usage) are offsets FROM the element's normal flow
 * position, a completely different coordinate space than offsetLeft.
 * Confirmed live: dragging 50px right/down moved the element ~104px/336px
 * -- and it compounds worse on every subsequent drag, since offsetLeft
 * already includes the previous (wrong) left/top applied.
 *
 * Fixed: track the CURRENT applied style.left/top (defaulting to 0) as
 * the drag baseline instead of offsetLeft/offsetTop -- the coordinate
 * space `position: relative` + style.left/top actually operates in.
 */
async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'x-draggable-test-area';
    c.style.cssText = 'padding: 100px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(300);
}

test.describe('x-draggable position tracking (#390)', () => {
  test('dragging N pixels moves the element approximately N pixels, not a multiple of it', async ({ page }) => {
    await setup(page, `<div id="d1" x-draggable style="width:80px;height:80px;background:#333;">drag me</div>`);
    const el = page.locator('#d1');
    const before = await el.boundingBox();
    if (!before) throw new Error('element not found');

    await page.mouse.move(before.x + 20, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + 70, before.y + 70, { steps: 5 });
    await page.mouse.up();

    const after = await el.boundingBox();
    if (!after) throw new Error('element not found after drag');

    const dx = after.x - before.x;
    const dy = after.y - before.y;
    // Dragged the mouse 50px right and 50px down -- the element should
    // move within a few px of that, not several multiples of it.
    expect(Math.abs(dx - 50)).toBeLessThan(10);
    expect(Math.abs(dy - 50)).toBeLessThan(10);
  });

  test('two consecutive drags do not compound into an increasingly wrong offset', async ({ page }) => {
    await setup(page, `<div id="d2" x-draggable style="width:80px;height:80px;background:#333;">drag me</div>`);
    const el = page.locator('#d2');
    const start = await el.boundingBox();
    if (!start) throw new Error('element not found');

    // First drag: +30, +30
    await page.mouse.move(start.x + 20, start.y + 20);
    await page.mouse.down();
    await page.mouse.move(start.x + 50, start.y + 50, { steps: 3 });
    await page.mouse.up();
    const afterFirst = await el.boundingBox();
    if (!afterFirst) throw new Error('element not found');

    // Second drag: +30, +30 again, from the element's NEW position
    await page.mouse.move(afterFirst.x + 20, afterFirst.y + 20);
    await page.mouse.down();
    await page.mouse.move(afterFirst.x + 50, afterFirst.y + 50, { steps: 3 });
    await page.mouse.up();
    const afterSecond = await el.boundingBox();
    if (!afterSecond) throw new Error('element not found');

    const secondDx = afterSecond.x - afterFirst.x;
    const secondDy = afterSecond.y - afterFirst.y;
    // The second drag's OWN delta should also be ~30px, not compounded
    // into something much larger by the first drag's leftover error.
    expect(Math.abs(secondDx - 30)).toBeLessThan(10);
    expect(Math.abs(secondDy - 30)).toBeLessThan(10);
  });

  test('axis="x" constrains movement to horizontal only', async ({ page }) => {
    // #390: was element.dataset.axis (data-axis), which every real usage
    // (plain axis="x" attribute) never set -- axis constraints silently
    // never applied, every draggable moved on both axes regardless.
    await setup(page, `<div id="d3" x-draggable axis="x" style="width:80px;height:80px;background:#333;">drag me</div>`);
    const el = page.locator('#d3');
    const before = await el.boundingBox();
    if (!before) throw new Error('element not found');

    await page.mouse.move(before.x + 20, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + 70, before.y + 70, { steps: 5 }); // 50px right, 50px down
    await page.mouse.up();

    const after = await el.boundingBox();
    if (!after) throw new Error('element not found after drag');

    expect(Math.abs(after.x - before.x - 50)).toBeLessThan(10); // moved horizontally
    expect(Math.abs(after.y - before.y)).toBeLessThan(5); // did NOT move vertically
  });

  test('axis="y" constrains movement to vertical only', async ({ page }) => {
    await setup(page, `<div id="d4" x-draggable axis="y" style="width:80px;height:80px;background:#333;">drag me</div>`);
    const el = page.locator('#d4');
    const before = await el.boundingBox();
    if (!before) throw new Error('element not found');

    await page.mouse.move(before.x + 20, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + 70, before.y + 70, { steps: 5 });
    await page.mouse.up();

    const after = await el.boundingBox();
    if (!after) throw new Error('element not found after drag');

    expect(Math.abs(after.x - before.x)).toBeLessThan(5); // did NOT move horizontally
    expect(Math.abs(after.y - before.y - 50)).toBeLessThan(10); // moved vertically
  });
});
