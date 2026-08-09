/**
 * wb-audio regression tests
 * Covers bug-registry entries:
 *   BUG-2024-12-19-001 — Audio src set on a div instead of the <audio> element
 *   BUG-2025-12-26-002 — Audio EQ panel missing controls when show-eq
 * Source: src/wb-viewmodels/semantics/audio.js (+ wb-audio.js)
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
  await page.evaluate(() => (window as any).WB.scan(document.getElementById('audio-test')));
  await page.waitForTimeout(600);
}

test.describe('wb-audio', () => {
  // BUG-2024-12-19-001
  test('src is applied to the inner <audio> element (not a div)', async ({ page }) => {
    await setup(page, '<wb-audio id="a-src" src="/demos/audio.mp3"></wb-audio>');
    const host = page.locator('#a-src');
    const audio = host.locator('audio');
    await expect(audio).toHaveCount(1);
    const src = await audio.evaluate((el) => (el as HTMLAudioElement).getAttribute('src') || (el as HTMLAudioElement).src);
    expect(src).toContain('audio.mp3');
  });

  // BUG-2025-12-26-002
  test('show-eq renders the equalizer band controls', async ({ page }) => {
    await setup(page, `
      <wb-audio id="a-plain" src="/demos/audio.mp3"></wb-audio>
      <wb-audio id="a-eq" src="/demos/audio.mp3" show-eq></wb-audio>
    `);
    // EQ panel renders shortly after scan — wait for the band sliders to appear
    await page.locator('#a-eq input[type="range"]').first().waitFor({ state: 'attached', timeout: 6000 });
    const eqSliders = await page.locator('#a-eq input[type="range"]').count();
    const plainSliders = await page.locator('#a-plain input[type="range"]').count();
    // 15-band EQ -> many sliders when show-eq, and more than the plain player
    expect(eqSliders, 'show-eq should render band sliders').toBeGreaterThanOrEqual(10);
    expect(eqSliders).toBeGreaterThan(plainSliders);
  });
});
