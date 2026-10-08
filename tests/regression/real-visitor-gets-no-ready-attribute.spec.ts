import { test, expect } from '../fixtures/offline';
import { settlePage } from '../base';

/**
 * A REAL VISITOR'S DOM CARRIES NO x-ready (#1094)
 * ===============================================
 * John: "x-ready should only be an internal signal" and "minimally x-ready is
 * an event, or a notification; it's not meant to be at any other layer."
 *
 * Readiness is the `wb:ready` event plus WB.isReady(el), backed by a WeakSet in
 * src/core/ready-signal.js. The attribute is a migration bridge written only
 * when automation drives the page (navigator.webdriver), for the specs that
 * still wait on [x-ready]. Every Playwright page is automated, so without this
 * spec nothing would notice the attribute leaking back into a real visitor's
 * markup.
 */
const PAGES = [
  { url: '/demos/test-harness.html', runtime: 'wb-lazy.js' },
  { url: '/?page=home', runtime: 'wb.js' },
];

for (const { url, runtime } of PAGES) test(`a page run by ${runtime}, loaded by a real browser, has no x-ready yet readiness still reports`, async ({ page }) => {
  // What a visitor's browser says: not driven by automation.
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false, configurable: true });
  });
  await page.addInitScript(() => {
    (window as any).__readyEvents = 0;
    document.addEventListener('wb:ready', () => { (window as any).__readyEvents++; }, true);
  });
  await page.goto(url);
  await page.waitForFunction(() => (window as any).WB?.scan, null, { timeout: 20_000 });
  await page.evaluate(async () => {
    const box = document.createElement('div');
    box.innerHTML = '<article id="card" title="Ready?">Body</article><button id="btn" x-ripple>Tap</button>';
    document.body.appendChild(box);
    const WB = (window as any).WB;
    await WB.scan(box, { eager: true });
  });
  await settlePage(page, { timeout: 5000 });
  const result = await page.evaluate(() => {
    const WB = (window as any).WB;
    return {
      webdriver: navigator.webdriver,
      stamped: document.querySelectorAll('[x-ready]').length,
      cardReady: WB.isReady(document.getElementById('card')),
      buttonReady: WB.isReady(document.getElementById('btn')),
      events: (window as any).__readyEvents,
    };
  });
  expect(result.webdriver, 'the page believes a person is driving it').toBe(false);
  expect(result.stamped, 'no element carries x-ready').toBe(0);
  expect(result.cardReady, 'WB.isReady still answers for the card').toBe(true);
  expect(result.buttonReady, 'and for the button').toBe(true);
  expect(result.events, 'wb:ready still fires').toBeGreaterThan(1);
});
