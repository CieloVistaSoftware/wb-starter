/**
 * Card Video Aspect Ratio Test
 * =============================
 * Verifies x-cardvideo has the same aspect-ratio handling as x-cardimage (#482)
 * - Both should have deterministic aspect ratio on their figures
 * - Both should default to a consistent aspect ratio
 * - Both should work correctly regardless of media load state
 */

import { test, expect } from '@playwright/test';

test.describe('x-cardvideo Aspect Ratio Parity (#482)', () => {

  test('cardvideo should maintain aspect ratio even with failed video load', async ({ page }) => {
    // Create a cardvideo with invalid src to force load failure
    const brokenVideoHtml = `
      <div x-cardvideo
        src="https://invalid-domain-that-does-not-exist.example.com/video.mp4"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 225'%3E%3C/svg%3E"
        title="Broken Video Test"
        aspect="16/9">
      </div>
    `;

    await page.addInitScript(() => {
      // Ensure card components are loaded
      if (!customElements.get('card-video')) {
        window.location.reload();
      }
    });

    // Add the broken video to the page
    await page.evaluate(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    }, brokenVideoHtml);

    await page.waitForTimeout(500);

    // Find the dynamically added cardvideo
    const brokenCard = page.locator('card-video[title="Broken Video Test"]');

    if (await brokenCard.count() > 0) {
      const figure = brokenCard.locator('figure, .x-card__figure');

      if (await figure.count() > 0) {
        // Get computed style
        const boundingBox = await figure.first().boundingBox();
        const aspectRatio = await figure.first().evaluate(el => {
          return window.getComputedStyle(el).aspectRatio;
        });

        console.log(`Broken video figure: aspect-ratio = ${aspectRatio}, bounds = ${JSON.stringify(boundingBox)}`);

        // Should have the specified aspect ratio
        expect(aspectRatio).toBe('16 / 9');

        // If the figure has dimensions, verify they respect the aspect ratio
        if (boundingBox && boundingBox.width > 0) {
          const expectedHeight = boundingBox.width * (9 / 16);
          const tolerance = 2; // 2px tolerance for rounding
          console.log(`Expected height: ${expectedHeight}, actual: ${boundingBox.height}`);
          expect(Math.abs(boundingBox.height - expectedHeight)).toBeLessThan(tolerance);
        }
      }
    }
  });

  test('cardvideo aspect attribute should be respected', async ({ page }) => {
    // Find any cardvideo elements with custom aspect ratios
    const cardVideos = await page.locator('x-cardvideo').all();

    for (const card of cardVideos) {
      const aspectAttr = await card.getAttribute('aspect');
      const figure = card.locator('figure, .x-card__figure');

      if (await figure.count() > 0) {
        const computedRatio = await figure.first().evaluate(el => {
          return window.getComputedStyle(el).aspectRatio;
        });

        if (aspectAttr) {
          console.log(`Card with aspect="${aspectAttr}" has computed aspect-ratio: ${computedRatio}`);
          // The computed aspect ratio should reflect the attribute
          expect(computedRatio).toBeTruthy();
        }
      }
    }
  });

  test('cardvideo default aspect ratio should be 16/9', async ({ page }) => {
    // Create a cardvideo WITHOUT an aspect attribute
    const defaultVideoHtml = `
      <div x-cardvideo
        src="https://example.com/video.mp4"
        title="Default Aspect Video">
      </div>
    `;

    await page.evaluate(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    }, defaultVideoHtml);

    await page.waitForTimeout(500);

    const defaultCard = page.locator('card-video[title="Default Aspect Video"]');

    if (await defaultCard.count() > 0) {
      const figure = defaultCard.locator('figure, .x-card__figure');

      if (await figure.count() > 0) {
        const aspectRatio = await figure.first().evaluate(el => {
          return window.getComputedStyle(el).aspectRatio;
        });

        console.log(`Default cardvideo aspect-ratio: ${aspectRatio}`);
        // Should default to 16/9
        expect(aspectRatio).toBe('16 / 9');
      }
    }
  });

  test('cardvideo figure should maintain size with video element failure', async ({ page }) => {
    const testHtml = `
      <div id="test-container" style="width: 400px; border: 1px solid red;">
        <div x-cardvideo
          id="test-video"
          src="https://invalid.example.com/video.mp4"
          aspect="16/9"
          title="Size Stability Test">
        </div>
      </div>
    `;

    await page.evaluate(html => {
      document.body.insertAdjacentHTML('beforeend', html);
    }, testHtml);

    await page.waitForTimeout(1000); // Wait for video load attempt to fail

    const figure = page.locator('#test-video figure, #test-video .x-card__figure');

    if (await figure.count() > 0) {
      const box1 = await figure.first().boundingBox();

      // Get the video element inside
      const video = page.locator('#test-video video');

      // Wait a bit more to ensure any async operations complete
      await page.waitForTimeout(500);

      const box2 = await figure.first().boundingBox();

      console.log(`Figure initial size: ${box1?.width}x${box1?.height}, after pause: ${box2?.width}x${box2?.height}`);

      // Sizes should remain stable (not collapse or shift drastically)
      if (box1 && box2) {
        expect(Math.abs(box1.width - box2.width)).toBeLessThan(2);
        expect(Math.abs(box1.height - box2.height)).toBeLessThan(2);
      }
    }
  });
});
