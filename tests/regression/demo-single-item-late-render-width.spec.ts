import { test, expect } from '@playwright/test';

/**
 * demo.js's single-item width measurement (§7/#486, "--wb-demo-shrink-width")
 * is a genuine race, not a flicker -- confirmed live on pages/components.html's
 * standalone <wb-cardhero>: identical navigations sometimes measured a correct
 * ~760px width and sometimes collapsed to a ~45px sliver with text wrapping
 * one letter per line, no code change between attempts.
 *
 * Root cause (traced): the FIRST width measurement runs in a single
 * requestAnimationFrame right after the grid is built (demo.js ~line 365),
 * before the control's own behavior/schema processing has necessarily
 * finished -- an unstyled custom element mid-render has ~0 width, and that
 * gets captured. A LATER pass (sizeToWidestOf(), ~line 558) re-measures the
 * control fresh each time it runs -- so it COULD self-correct -- but it is
 * only ever invoked by a ResizeObserver watching the CODE PANEL (~line 596),
 * never the control itself. When the control (not the code panel) is what
 * grows late, nothing ever triggers a re-measurement: the bad width from the
 * first pass is permanent for that page load, not transient.
 *
 * On localhost, ~90 page resources (scripts, schemas, CSS) all fire in one
 * synchronous burst -- too fast to reliably delay any ONE of them and widen
 * the race window (tried both card.js and cardhero.schema.json; neither
 * proved to be the bottleneck resource). CPU throttling via CDP instead
 * slows down JS EXECUTION broadly -- module evaluation, schema processing,
 * behavior application -- which is what actually determines whether the
 * rAF fires before or after real rendering completes, and matches how this
 * genuinely surfaces on a real slow/loaded device rather than requiring
 * localhost network jitter to get lucky.
 */

test('single-item demo self-corrects width after its lazily-loaded control renders late', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

  await page.goto('/?page=components', { waitUntil: 'domcontentloaded' });

  const hero = page.locator('wb-cardhero').first();
  await expect(hero).toBeVisible({ timeout: 15000 });

  // Let everything -- including any legitimate delayed re-measure -- settle,
  // still under throttling, before removing it and reading the final state.
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  await page.waitForTimeout(1000);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  // One more settle pass at normal speed so a resize triggered right at the
  // throttle boundary has a frame to actually paint before we measure.
  await page.waitForTimeout(500);

  const heroBox = await hero.boundingBox();
  expect(heroBox, 'wb-cardhero must have a measurable box').not.toBeNull();

  const contentBox = await page.locator('.page__hero').first().boundingBox();
  expect(contentBox, 'page content container must have a measurable box').not.toBeNull();

  const ratio = heroBox!.width / contentBox!.width;
  expect(
    ratio,
    `wb-cardhero settled at ${Math.round(heroBox!.width)}px wide against a ` +
    `${Math.round(contentBox!.width)}px content column (ratio ${ratio.toFixed(2)}) under a slow ` +
    `device (6x CPU throttle) -- a control that renders late must still end up full-width, not ` +
    `permanently stuck at whatever it measured as ~0px before its own rendering finished.`
  ).toBeGreaterThan(0.85);
});
