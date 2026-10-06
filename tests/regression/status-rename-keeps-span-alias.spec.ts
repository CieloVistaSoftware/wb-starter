import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * x-span IS NOW x-status, AND THE OLD NAME STILL WORKS (#1105)
 * ===========================================================
 * The behavior colours inline text by status and draws window-control dots.
 * Its name was the one HTML element MDN defines as meaning nothing, and no
 * element mapped to it, so the name said nothing about the job. It is renamed
 * to status everywhere (module, schema, stylesheet, doc). `x-span` is declared
 * once, in BEHAVIOR_ALIASES, so old markup keeps rendering.
 *
 * See it by hand: open /demos/test-harness.html and add
 * <span x-span variant="red"></span> and <span x-status variant="red"></span>.
 * Both render the same red window dot.
 */

const MARKUP = '<span id="new" x-status variant="success">ok</span><span id="old" x-span variant="success">ok</span>'
  + '<span id="newDot" x-status variant="red"></span><span id="oldDot" x-span variant="red"></span>';

async function read(page: import('@playwright/test').Page) {
  return page.evaluate(() => ['new', 'old', 'newDot', 'oldDot'].map((id) => {
    const el = document.getElementById(id)!;
    const cs = getComputedStyle(el);
    return { id, classes: el.className, color: cs.color, background: cs.backgroundColor, width: Math.round(el.getBoundingClientRect().width) };
  }));
}

test.describe('status rename keeps the span alias (#1105)', () => {
  test('x-status and the old x-span render the same on a wb-lazy page', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });
    await page.evaluate(async (html) => {
      const box = document.createElement('div');
      box.innerHTML = html;
      document.body.appendChild(box);
      await (window as any).WB.scan(box, { eager: true });
    }, MARKUP);
    await expect(page.locator('#old')).toHaveClass(/x-status--success/);
    const [now, old, nowDot, oldDot] = await read(page);
    expect(now.classes).toContain('x-status--success');
    expect(old.color, 'the alias lost its status colour').toBe(now.color);
    expect(nowDot.width, 'the window dot has no size').toBeGreaterThan(5);
    expect(oldDot.background, 'the alias lost its window-dot colour').toBe(nowDot.background);
    expect(oldDot.width).toBe(nowDot.width);
  });

  test('the alias also works on a page run by wb.js', async ({ page }) => {
    await page.goto('/?page=home', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 20_000 });
    await page.evaluate(async (html) => {
      const box = document.createElement('div');
      box.innerHTML = html;
      document.body.appendChild(box);
      await (window as any).WB.scan(box);
      await (window as any).WB.settled?.({ timeout: 5000 });
    }, MARKUP);
    await expect(page.locator('#oldDot')).toHaveClass(/x-status--red/);
    const [, , nowDot, oldDot] = await read(page);
    expect(oldDot.background).toBe(nowDot.background);
  });

  test('the old files are gone', () => {
    const root = process.cwd();
    for (const old of ['src/wb-viewmodels/span.js', 'src/wb-models/span.schema.json',
      'src/styles/behaviors/span.css', 'docs/behaviors/span.md']) {
      expect(fs.existsSync(path.join(root, old)), `${old} should have been renamed to status`).toBe(false);
    }
  });
});
