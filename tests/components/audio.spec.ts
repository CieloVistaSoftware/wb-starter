/**
 * x-audio regression tests
 * Covers bug-registry entries:
 *   BUG-2024-12-19-001 — Audio src set on a div instead of the <audio> element
 *   BUG-2025-12-26-002 — Audio EQ panel missing controls when show-eq
 * Source: src/wb-viewmodels/semantics/audio.js (+ x-audio.js)
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = '/demos/test-harness.html';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto(BASE_URL);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors,
    { timeout: 12000 }
  );
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'audio-test';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  // `eager: true` -- demos/test-harness.html loads wb-lazy.js, the LAZY
  // runtime. Without this, injection is deferred to an IntersectionObserver,
  // so a container appended below the fold NEVER initializes and every
  // assertion reports the behavior as broken. Confirmed live: the same markup
  // scanned without eager built 0 transports and 0 EQ containers; with eager
  // it built 1 EQ container holding 16 band sliders. permutation-compliance's
  // own harness carries this exact note for the same reason.
  await page.evaluate(async () => await (window as any).WB.scan(document.getElementById('audio-test'), { eager: true }));
  await page.waitForTimeout(600);
}

test.describe('.x-audio', () => {
  // BUG-2024-12-19-001
  test('src stays on the native <audio> host (not moved to a div)', async ({ page }) => {
    // #932-adjacent: this looked for `host.locator('audio')` -- an <audio>
    // NESTED INSIDE an <audio>, which cannot exist. #669 settled the model and
    // tests/regression/audio-flags-render-visibly.spec.ts documents it: the
    // native element IS the host and stays native; any custom UI mounts
    // OUTSIDE it, because <audio>'s children are fallback content and never
    // render. The original bug (BUG-2024-12-19-001, src landing on a div) is
    // still what this guards -- by asserting the src is on the real element.
    await setup(page, '<audio id="a-src" src="/demos/audio.mp3"></audio>');
    const host = page.locator('#a-src');
    await expect(host).toHaveCount(1);

    const info = await host.evaluate((el) => ({
      tag: el.tagName.toLowerCase(),
      src: el.getAttribute('src') || (el as HTMLAudioElement).src,
    }));
    expect(info.tag).toBe('audio');
    expect(info.src).toContain('audio.mp3');
  });

  // BUG-2025-12-26-002
  test('show-eq renders the equalizer band controls', async ({ page }) => {
    await setup(page, `
      <audio id="a-plain" src="/demos/audio.mp3"></audio>
      <audio id="a-eq" src="/demos/audio.mp3" show-eq></audio>
    `);
    // The EQ mounts OUTSIDE the <audio> (#669) as `.x-audio__eq-container`, so
    // `#a-eq input[type=range]` -- a DESCENDANT query -- could only ever count
    // zero and timed out waiting. Count the sliders in the EQ container the
    // behavior actually builds.
    await page.locator('.x-audio__eq-container input[type="range"]').first()
      .waitFor({ state: 'attached', timeout: 6000 });
    const eqSliders = await page.locator('.x-audio__eq-container input[type="range"]').count();
    // The plain player gets no custom UI at all, so it contributes none.
    const plainSliders = await page.locator('#a-plain input[type="range"]').count();
    // 15-band EQ -> many sliders when show-eq, and more than the plain player
    expect(eqSliders, 'show-eq should render band sliders').toBeGreaterThanOrEqual(10);
    expect(eqSliders).toBeGreaterThan(plainSliders);
  });
});
