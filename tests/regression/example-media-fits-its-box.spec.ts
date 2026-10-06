import { test, expect } from '../fixtures/offline';
import { revealBehavior } from '../helpers/behaviors-page';

/**
 * EXAMPLE MEDIA FITS ITS BOX, AND IS NEVER UPSCALED (#759)
 * =======================================================
 * John, on the figure example: "What are our rules on layout? this isn't
 * following them." It rendered a 480px image across the whole panel, upscaled
 * and blurry, because no rule covered normal-flow media. §15a now does, and
 * src/styles/pages/behaviors.css applies it to #behaviors-live-example:
 *
 *   max-width: 100%  -- never wider than the container
 *   width: auto      -- never wider than the media's own natural size
 *
 * The issue named the test it needed: measure a rendered example's media
 * against (a) its container and (b) its own natural width, and fail on either.
 *
 * Cards, the gallery, avatar and frame size their media on purpose (cover
 * crops, fixed squares), so only the plain media behaviors are measured.
 */

const MEDIA_TOKENS = ['x-img', 'x-figure', 'x-video'];

type Box = { tag: string; rendered: number; natural: number; container: number };

async function measure(page: any): Promise<Box[]> {
  return page.evaluate(async () => {
    const stage = document.getElementById('behaviors-live-example')!;
    type Media = HTMLImageElement | HTMLVideoElement;
    const current = () => [...stage.querySelectorAll('img, video')] as Media[];
    // Wait for intrinsic sizes: an image's naturalWidth, a video's videoWidth.
    const loaded = (list: Media[]) => Promise.all(list.map((m) => new Promise<void>((resolve) => {
      const ready = () => (m instanceof HTMLImageElement ? m.complete : m.readyState >= 1);
      if (ready()) return resolve();
      m.addEventListener(m instanceof HTMLImageElement ? 'load' : 'loadedmetadata', () => resolve(), { once: true });
      m.addEventListener('error', () => resolve(), { once: true });
      setTimeout(resolve, 5000);
    })));
    await loaded(current());
    // The example can re-render while its media load (CI, under load: a node
    // taken before the wait was detached by the time it was measured, and
    // parentElement was null). Measure what is in the example NOW.
    const media = current();
    await loaded(media);
    return media.map((m) => ({
      tag: m.tagName.toLowerCase(),
      rendered: m.getBoundingClientRect().width,
      natural: m instanceof HTMLImageElement ? m.naturalWidth : m.videoWidth,
      container: (m.parentElement as HTMLElement).clientWidth,
    }));
  });
}

test.describe('example media fits its box (#759)', () => {
  for (const token of MEDIA_TOKENS) {
    test(`${token}: no example media is wider than its container or than itself`, async ({ page }) => {
      expect(await revealBehavior(page, token), `${token} has no row on the Behaviors page`).toBe(true);
      const boxes = (await measure(page)).filter((b) => b.natural > 0);
      expect(boxes.length, `${token}'s example rendered no loaded media to measure`).toBeGreaterThan(0);

      const wrong = boxes.filter((b) => b.rendered > b.container + 0.5 || b.rendered > b.natural + 0.5);
      expect(wrong, `${token}: media wider than its container or upscaled past its natural width`).toEqual([]);
    });
  }

  test('a small image stays its own size even when a stylesheet asks for width: 100%', async ({ page }) => {
    // The half of the rule that is usually missed: max-width alone still lets
    // another rule's width:100% stretch a small image across the panel.
    expect(await revealBehavior(page, 'x-img')).toBe(true);
    const probe = await page.evaluate(async () => {
      const style = document.createElement('style');
      style.textContent = '.media-759-probe { width: 100%; }';
      document.head.appendChild(style);
      const img = new Image();
      img.className = 'media-759-probe';
      img.alt = '';
      img.src = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40"/></svg>');
      document.getElementById('behaviors-live-example')!.appendChild(img);
      await img.decode();
      return { rendered: img.getBoundingClientRect().width, natural: img.naturalWidth };
    });
    expect(probe.natural).toBe(40);
    expect(probe.rendered, 'a 40px image was stretched past its natural width').toBeLessThanOrEqual(40.5);
  });
});
