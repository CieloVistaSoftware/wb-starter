import { test, expect } from '../fixtures/offline';

// #1349: /api/error-log/append is a POST and sw.js only claims GETs, so the
// counter below did see the appends. Blocked anyway: this spec counts requests,
// and a test that counts must not share the page with something that can make
// requests of its own.
test.use({ serviceWorkers: 'block' });

test('expected fixture errors stay out of the persistent error log', async ({ page }) => {
  let appendRequests = 0;
  await page.route('**/api/error-log/append', async route => {
    appendRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('/demos/legacy-syntax-check.html');
  await expect.poll(() => appendRequests).toBe(0);

  await page.goto('/demos/test-harness.html');
  // logError() decides about the POST -- and awaits it when one is due --
  // before it prints "[ErrorLogger] ...", so each such line is a moment a POST
  // would already have been answered (#1516: not 1500ms). The broken audio is
  // done once it has given up: its first load fails and is logged, audio.js
  // retries once, and the second failure is logged twice -- the throw
  // ("x-audio: failed to load src") and the resource again ("(x2)"). Waiting
  // for both last entries also proves the audio really was logged, so the 0
  // below is not a vacuous pass.
  const done = { thrown: false, relogged: false };
  page.on('console', (m) => {
    const t = m.text();
    if (!t.includes('[ErrorLogger]')) return;
    if (t.includes('x-audio: failed to load src')) done.thrown = true;
    if (t.includes('audio failed to load') && t.includes('(x2)')) done.relogged = true;
  });
  await page.evaluate(async () => {
    const container = document.createElement('div');
    container.innerHTML = '<audio src="/tests/fixtures/broken-audio-0-bytes.mp3"></audio>';
    document.body.appendChild(container);
    return await (window as any).WB.scan(container);
  });
  await expect.poll(() => done.thrown && done.relogged, { timeout: 15000, message: 'the broken audio never finished failing' }).toBe(true);
  expect(appendRequests).toBe(0);

  await page.evaluate(async () => {
    document.documentElement.removeAttribute('data-x-expected-errors');
    const { logError } = await import('/src/core/error-logger.js');
    await logError('unmarked regression error');
  });
  expect(appendRequests).toBe(1);
});