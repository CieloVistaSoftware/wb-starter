import { test, expect } from '../fixtures/offline';

/**
 * SHOW LESS KEEPS ITS OWN BUTTON WHILE THE CARD COLLAPSES
 * =======================================================
 * x-cardexpandable hides its toggle when the collapsed content already fits
 * (#1598, x-card--nothing-to-expand). It re-measured one frame after a click,
 * while the collapse transition was still running: the box was still tall
 * enough to hold everything, so the card decided there was nothing to expand
 * and hid the button it had just been clicked through. It came back only once
 * the box shrank below the content -- on a loaded runner in the very frame the
 * transition ended, after a test (or a user) had already looked
 * (x-cardexpandable-examples-reveal-content.spec.ts, PR #1726 CI).
 *
 * See it by hand: open an `expanded` x-cardexpandable with long content and
 * click Show Less. Before: the button vanishes as the card starts to close and
 * reappears at the end. Now: it stays.
 */

const LONG = 'An expandable card shows the start of its content and keeps the rest behind Show More. '.repeat(8);

test('the toggle stays visible through every frame of a collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, { timeout: 20000 });

  const result = await page.evaluate(async (text) => {
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const host = document.createElement('div');
    host.style.width = '1100px';
    host.innerHTML = `<article x-cardexpandable title="Expanded" expanded>${text}</article>`;
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    await frame(); await frame();
    const card = host.firstElementChild as HTMLElement;
    const btn = card.querySelector('.x-card__expand-btn') as HTMLElement;
    btn.click();
    const hiddenFrames: number[] = [];
    // Sample every frame until the collapse has finished and two more frames.
    for (let i = 0; i < 120; i++) {
      await frame();
      if (btn.offsetParent === null) hiddenFrames.push(i);
      const running = card.getAnimations({ subtree: true }).length;
      if (!running && i > 2) { await frame(); await frame(); if (btn.offsetParent === null) hiddenFrames.push(i + 2); break; }
    }
    const content = card.querySelector('.x-card__expandable-content') as HTMLElement;
    return { hiddenFrames, scroll: content.scrollHeight, client: content.clientHeight };
  }, LONG);

  // The collapsed card really hides content, so the button has a job to do.
  expect(result.scroll, 'collapsed content hides something').toBeGreaterThan(result.client + 1);
  expect(result.hiddenFrames, 'frames (after the click) in which Show More/Less was hidden').toEqual([]);
});
