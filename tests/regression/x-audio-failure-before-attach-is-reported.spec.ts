import { test, expect } from '../fixtures/offline';

/**
 * #1136 -- an <audio> whose src failed BEFORE the behavior attached still fails loud.
 *
 * An authored <audio> starts fetching the moment it is parsed; the lazy runtime
 * only enhances it later. A src that fails fast has already fired its one
 * 'error' event by then, so a listener added at attach time never hears it --
 * error.code set, and no warning, no retry, no throw. audio.js now checks
 * audioEl.error on attach. This holds that path: the failure is complete
 * (audio.error set) before WB ever sees the element.
 */
test('an authored <audio> that already failed is reported when x-audio attaches', async ({ page }) => {
  test.setTimeout(30_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  // Fails instantly, every time: no retry can rescue it.
  await page.route('**/fails-before-attach.mp3', (r) => r.abort('failed'));

  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
  const state = await page.evaluate(async () => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const host = document.createElement('div');
    host.innerHTML = '<audio x-audio controls src="/fails-before-attach.mp3"></audio>';
    document.body.appendChild(host);
    const audio = host.querySelector('audio') as HTMLAudioElement;
    // Wait until the failure has fully happened -- BEFORE any behavior exists.
    await new Promise<void>((resolve) => {
      if (audio.error) return resolve();
      audio.addEventListener('error', () => resolve(), { once: true });
    });
    const codeBeforeAttach = audio.error ? audio.error.code : null;
    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });
    return { codeBeforeAttach };
  });

  expect(state.codeBeforeAttach, 'precondition: the src had already failed before attach').not.toBeNull();
  await expect.poll(() => pageErrors.find((m) => m.includes('x-audio:') && m.includes('fails-before-attach.mp3')),
    { timeout: 15_000, message: 'the early failure must still raise the x-audio runtime error' }).toBeTruthy();
});
