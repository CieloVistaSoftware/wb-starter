import { test, expect } from '../fixtures/offline';

/**
 * demo.js's single-item width measurement (§7/#486, "--x-demo-shrink-width")
 * is a genuine race, not a flicker -- confirmed live on pages/behaviors.html's
 * standalone <div x-cardhero>: identical navigations sometimes measured a correct
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

/*
 * Retargeted: #666 moved every <div x-demo> off pages/behaviors.html (its
 * examples render one at a time in the live preview), so there is no
 * standalone cardhero demo there to measure and the test timed out waiting
 * for one. demos/site/cards.html's #demo-profile is the same case -- a single
 * card whose behavior builds its own header, avatar and cover image late -- in
 * a demo that IS shrink-to-fit (the cards.html hero is `full-width`, which
 * opts out of the measurement entirely, so it could not show this bug).
 */
test('single-item demo self-corrects width after its lazily-loaded control renders late', async ({ page }) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

  await page.goto('/demos/site/cards.html', { waitUntil: 'domcontentloaded' });

  const demo = page.locator('#demo-profile');
  await demo.scrollIntoViewIfNeeded({ timeout: 15000 });
  const card = demo.locator('.x-demo__grid > [x-cardprofile]');
  await expect(card).toBeVisible({ timeout: 15000 });
  // demo.js commits the measured width once, when it settles (#985).
  await expect(demo).toHaveClass(/x-demo--measured/, { timeout: 20000 });

  // Let everything -- including any legitimate delayed re-measure -- settle,
  // still under throttling, before removing it and reading the final state.
  await page.waitForTimeout(1000);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  // One more settle pass at normal speed so a resize triggered right at the
  // throttle boundary has a frame to actually paint before we measure.
  await page.waitForTimeout(500);

  const m = await demo.evaluate((el) => {
    const grid = el.querySelector('.x-demo__grid') as HTMLElement;
    const control = grid.firstElementChild as HTMLElement;
    return {
      control: control.getBoundingClientRect().width,
      gridScroll: grid.scrollWidth,
      gridClient: grid.clientWidth,
      demo: el.getBoundingClientRect().width,
    };
  });

  expect(
    m.control,
    `[x-cardprofile] settled at ${Math.round(m.control)}px under a slow device (6x CPU throttle) -- a ` +
    `control that renders late must not stay stuck at whatever it measured before its own rendering finished`
  ).toBeGreaterThan(250);
  expect(m.gridScroll, 'the demo box must hold its control, not clip it').toBeLessThanOrEqual(m.gridClient + 2);
  expect(m.demo, 'the demo is at least as wide as its control').toBeGreaterThanOrEqual(m.control);
});
