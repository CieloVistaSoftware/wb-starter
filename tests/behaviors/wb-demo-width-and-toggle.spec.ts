/**
 * Standard §7 (a demo is only as wide as what it renders): <wb-demo>
 * always built its grid at the configured/default column count (3)
 * regardless of how many children it actually had — a single narrow card
 * wrapped in the default 3-column grid stretched the whole demo (and its
 * code panel, a full-width sibling) to fill 3 columns' worth of width.
 * Fixed in src/wb-viewmodels/demo.js (clamp columns to actual child
 * count) + src/styles/behaviors/demo.css (size a resulting single-column
 * demo to its content).
 *
 * Separately, pre.js's "hide code" toggle rendered unconditionally on
 * every code sample, including every <wb-demo>-generated one (never sets
 * max-height, so there's nothing meaningful to collapse). Fixed in
 * src/wb-viewmodels/semantics/pre.js: gated behind config.maxHeight.
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'wb-demo-width-test-area';
    c.style.cssText = 'width: 1000px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(500);
}

test.describe('single-item <wb-demo> hugs its content width', () => {
  test('a single child gets clamped to cols-1, not the default 3', async ({ page }) => {
    await setup(page, '<wb-demo id="d1"><button>Solo</button></wb-demo>');
    const grid = page.locator('#d1 .wb-demo__grid');
    await expect(grid).toHaveClass(/wb-demo__grid--cols-1/);
  });

  test('the whole demo (including its code panel) is narrower than the 1000px container', async ({ page }) => {
    await setup(page, '<wb-demo id="d2"><button>Solo</button></wb-demo>');
    const width = await page.locator('#d2').evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThan(900); // well short of the 1000px container — proves it isn't stretched full-width
  });

  test('multiple children still fill the configured column count (unaffected)', async ({ page }) => {
    await setup(page, '<wb-demo id="d3" columns="3"><button>One</button><button>Two</button><button>Three</button></wb-demo>');
    const grid = page.locator('#d3 .wb-demo__grid');
    await expect(grid).toHaveClass(/wb-demo__grid--cols-3/);
  });
});

test.describe('<wb-demo> code panel has no "hide code" toggle (no max-height set)', () => {
  test('no .x-pre__toggle button renders on a generated code sample', async ({ page }) => {
    await setup(page, '<wb-demo id="d4"><button>Solo</button></wb-demo>');
    await expect(page.locator('#d4 .x-pre__toggle')).toHaveCount(0);
  });

  test('the copy button still renders (only the toggle was gated)', async ({ page }) => {
    await setup(page, '<wb-demo id="d5"><button>Solo</button></wb-demo>');
    await expect(page.locator('#d5 .x-pre__copy')).toHaveCount(1);
  });

  test('a pre with an explicit max-height still gets the toggle', async ({ page }) => {
    await setup(page, '<pre id="p1" x-behavior="pre" max-height="100px"><code>line1\nline2\nline3</code></pre>');
    await expect(page.locator('#p1').locator('xpath=..').locator('.x-pre__toggle')).toHaveCount(1);
  });
});
