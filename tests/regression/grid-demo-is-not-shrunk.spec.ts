import { test, expect } from '../fixtures/offline';

/**
 * A demo whose one child is an x-grid takes the full width, not its content's.
 *
 * #1903, found by the 2026-10-16 audit of every .md doc: grid.md's
 * "Column Count" example (<div x-grid columns="4"> with four items) rendered as
 * one 9px column with 1..4 stacked. x-grid sizes its columns from its container
 * (repeat(auto-fit, minmax(min(12.5rem, 100%), 1fr))), and a single-item demo
 * shrinks to its content's width (Standard §7), so each asked the other for a
 * width and both collapsed -- the hero problem #1387 already solved for
 * x-hero/x-cardhero with FULL_BLEED_BEHAVIORS in demo.js. x-grid joins them.
 */
test('grid.md: every x-grid demo is wide and lays its items out side by side', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/behaviors/grid.md'));
  await page.waitForSelector('#content.x-mdhtml--loaded', { state: 'attached', timeout: 20000 });
  // The examples are built after the doc renders: wait for a built one.
  await page.waitForSelector('#content .x-demo [x-grid].x-grid', { timeout: 20000 });
  await page.waitForFunction(() => !document.querySelector('.x-demo--measuring'), null, { timeout: 15000 });

  const grids = await page.evaluate(() => [...document.querySelectorAll('#content .x-demo [x-grid]')].map((g) => {
    const xs = [...g.children].map((c) => Math.round(c.getBoundingClientRect().x));
    return { width: g.getBoundingClientRect().width, items: xs.length, columns: new Set(xs).size, declared: Number(g.getAttribute('columns') || 3), demo: g.closest('.x-demo')!.className };
  }));
  expect(grids.length, 'grid.md has x-grid demos').toBeGreaterThan(3);
  for (const g of grids) {
    expect(g.width, 'an x-grid demo is not shrunk to its items').toBeGreaterThan(300);
    // #1930: columns is a maximum -- columns="1" (the altRows example) stacks.
    expect(g.columns, 'never more columns than declared').toBeLessThanOrEqual(g.declared);
    if (g.items > 1 && g.declared > 1) expect(g.columns, 'items sit side by side, not stacked').toBeGreaterThan(1);
  }
});
