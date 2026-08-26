import { test, expect } from '@playwright/test';

/**
 * REGRESSION (#377 / BUG-2026-07-27-004): <div x-youtube id="..." ratio="16:9">
 * (John's own test markup, and what pages/behaviors.html + pages/newbehaviors.html
 * both actually ship) never loaded a video. youtube() (src/wb-viewmodels/
 * semantics/youtube.js) only read element.getAttribute('video-id') -- a
 * FOURTH attribute-name mismatch on top of lightbox (#374), alert (#375),
 * countdown (#376): pages/behaviors.html uses video-id (matches!),
 * pages/behaviors.html + pages/newbehaviors.html use plain id, and the
 * generator (scripts/generate-behaviors-page.js) emits data-id. With no id
 * resolved, config.id is null, youtube() logs a console.warn and returns
 * before building any iframe or click-to-play poster -- the element stays
 * a permanently empty <div>.
 */
test.describe('x-youtube reads id="..." as the video ID (#377)', () => {
  test('id="dQw4w9WgXcQ" produces a click-to-play poster that embeds the real video', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', msg => { if (msg.type() === 'warning' || msg.type() === 'error') warnings.push(msg.text()); });

    // demos/test-harness.html already boots WB (see tests/components/overlay.spec.ts's
    // injectAndScan pattern) -- inject the real page markup into it and scan eagerly.
    await page.goto('/demos/test-harness.html');
    await page.waitForFunction(
      () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
      { timeout: 10000 }
    );
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'yt-test-container';
      container.innerHTML = '<div x-youtube id="dQw4w9WgXcQ" ratio="16:9"></div>';
      document.body.appendChild(container);
    });
    await page.evaluate(async () => await (window as any).WB.scan(document.getElementById('yt-test-container'), { eager: true }));

    const host = page.locator('#yt-test-container [x-youtube]');
    await expect(host).toHaveClass(/x-youtube/, { timeout: 5000 });

    const noIdWarning = warnings.find(w => w.includes('No video ID provided'));
    expect(noIdWarning, `youtube() logged: ${noIdWarning}`).toBeFalsy();

    const poster = host.locator('.x-youtube__poster');
    await expect(poster, 'a click-to-play poster should render once an id is resolved').toBeVisible();

    await poster.click();
    const iframe = host.locator('iframe');
    await expect(iframe).toBeVisible({ timeout: 5000 });
    await expect(iframe).toHaveAttribute('src', /youtube\.com\/embed\/dQw4w9WgXcQ/);
  });
});
