/**
 * TEMPORARY DIAGNOSTIC for #1439 -- not for merge.
 *
 * A WebKit screenshot of the home page never finishes on the Windows CI
 * runner. This spec times each step on three pages (a blank one, Behaviors,
 * Home) so the CI log says where WebKit stalls: no frames at all, a page that
 * keeps growing, running animations, the service worker, or the capture
 * itself. Every capture is capped at 20s so the run reports instead of hanging.
 */
import { test, type Page } from '../fixtures/offline';

test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

async function probe(page: Page, label: string) {
  const info = await page.evaluate(async () => {
    const rafFired = await new Promise<boolean>((r) => {
      let done = false;
      requestAnimationFrame(() => { done = true; r(true); });
      setTimeout(() => { if (!done) r(false); }, 2000);
    });
    const heights: number[] = [];
    for (let i = 0; i < 8; i++) {
      heights.push(document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 250));
    }
    const anims = document.getAnimations();
    return {
      rafFired,
      fonts: document.fonts.status,
      heights,
      animations: anims.length,
      infinite: anims.filter((a) => a.effect?.getTiming().iterations === Infinity).length,
      swControlled: !!navigator.serviceWorker?.controller,
      media: document.querySelectorAll('audio,video').length,
    };
  });
  console.log(`[#1439] ${label} probe ${JSON.stringify(info)}`);
}

async function shot(page: Page, label: string, opts: Record<string, unknown>) {
  const t0 = Date.now();
  try {
    await page.screenshot({ timeout: 20_000, ...opts });
    console.log(`[#1439] ${label} ${JSON.stringify(opts)} OK ${Date.now() - t0}ms`);
  } catch (e) {
    console.log(`[#1439] ${label} ${JSON.stringify(opts)} FAIL ${Date.now() - t0}ms ${String(e).split('\n')[0]}`);
  }
}

test('diag: where the WebKit screenshot stalls', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit only');

  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width"><p>blank</p>');
  await probe(page, 'blank');
  await shot(page, 'blank', {});
  await shot(page, 'blank', { fullPage: true });

  for (const url of ['/pages/behaviors.html', '/pages/home.html']) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await probe(page, url);
    await shot(page, url, {});
    await shot(page, url, { animations: 'disabled' });
    await shot(page, url, { fullPage: true });
    await shot(page, url, { fullPage: true, animations: 'disabled' });
  }
});

test.describe('service worker blocked', () => {
  test.use({ serviceWorkers: 'block' });
  test('diag: home with the service worker blocked', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit only');
    await page.goto('/pages/home.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    await probe(page, 'home(sw-blocked)');
    await shot(page, 'home(sw-blocked)', {});
    await shot(page, 'home(sw-blocked)', { fullPage: true, animations: 'disabled' });
  });
});
