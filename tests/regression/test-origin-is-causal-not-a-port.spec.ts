import { test, expect } from '../fixtures/offline';
// A namespace import, so a missing isTestServer fails the cases that need it
// instead of failing the whole file at link time -- the red run then shows the
// testOrigin cases failing on their own merits.
import * as signature from '../../src/core/error-signature.js';

const isTestOrigin = (i: object) => (signature as any).isTestOrigin(i);
const isTestServer = (i: object) => (signature as any).isTestServer?.(i);

/**
 * #1032 -- "testOrigin" means a fixture caused the error, never "a test server
 * was serving the page".
 *
 * isTestOrigin() used to return true for any localhost port >= 3100. Every
 * Playwright run serves the app from such a port, so every error in every run
 * -- a real crash in wb.js included -- was tagged "raised by a test fixture, not
 * by the app", and apply-error-remedies.mjs dropped all of them (100 of 100 in
 * the 2026-09-09 archive). John's own paste on 2026-10-02 carried the label on
 * nine errors that no fixture had caused.
 *
 * The port is still recorded, as context (testServer), so a reader can see the
 * error happened during a run without being told it is fake.
 */

const APP = 'http://localhost:3000/';
const RUN = 'http://localhost:64149/';

// Every combination of: where the page was served x what the error names.
const CASES: Array<{ name: string; message: string; url: string; src?: string; origin: boolean; server: boolean }> = [
  { name: 'real crash, dev server',          message: 'TypeError: x is undefined', url: APP, origin: false, server: false },
  { name: 'real crash, test server',         message: 'TypeError: x is undefined', url: RUN, origin: false, server: true },
  { name: 'real missing file, test server',  message: 'link failed to load: ' + RUN + 'src/styles/behaviors/effects.css', url: RUN, origin: false, server: true },
  { name: 'fixture file, test server',       message: 'img failed to load', url: RUN, src: RUN + 'definitely-missing-image.png', origin: true, server: true },
  { name: 'fixture file, dev server',        message: 'img failed to load', url: APP, src: APP + 'definitely-missing-image.png', origin: true, server: false },
  { name: '__test__ marker in message',      message: '__test__ deliberate throw', url: RUN, origin: true, server: true },
  { name: 'test-fixture marker in url',      message: 'boom', url: RUN + 'tests/test-fixture/page.html', origin: true, server: true },
  { name: 'port 3099 is not a test server',  message: 'boom', url: 'http://localhost:3099/', origin: false, server: false },
  { name: 'port 3100 is a test server',      message: 'boom', url: 'http://localhost:3100/', origin: false, server: true },
  { name: 'deployed site',                   message: 'boom', url: 'https://cielovistasoftware.github.io/wb-starter/', origin: false, server: false },
];

test.describe('#1032 testOrigin is causal; the port is only context', () => {
  for (const c of CASES) {
    test(`isTestOrigin / isTestServer: ${c.name}`, () => {
      const input = { message: c.message, url: c.url, details: c.src ? { src: c.src } : {} };
      expect(isTestOrigin(input), 'testOrigin: did a fixture cause this?').toBe(c.origin);
      expect(isTestServer(input), 'testServer: was a test server serving the page?').toBe(c.server);
    });
  }

  test('a real error logged during a test run is NOT marked as a fixture', async ({ page }) => {
    await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
    const logged = await page.evaluate(async () => {
      document.documentElement.setAttribute('data-x-expected-errors', '');
      const mod: any = await import('/src/core/error-logger.js');
      const real = await mod.logError('TypeError: cannot read properties of undefined', { module: 'wb.js' });
      const fixture = await mod.logError('img failed to load: /definitely-missing-image.png', { module: 'resource-load' });
      return {
        real: { testOrigin: real.testOrigin, testServer: real.testServer },
        fixture: { testOrigin: fixture.testOrigin, testServer: fixture.testServer },
        copyable: document.getElementById('x-error-list') !== null,
      };
    });
    // Playwright serves this page from its own port, so both carry the context...
    expect(logged.real.testServer).toBe(true);
    expect(logged.fixture.testServer).toBe(true);
    // ...but only the fixture is a fixture.
    expect(logged.real.testOrigin, 'a real crash during a run is still a real crash').toBe(false);
    expect(logged.fixture.testOrigin).toBe(true);
  });
});
