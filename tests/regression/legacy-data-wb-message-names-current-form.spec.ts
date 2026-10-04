/**
 * #1192: a data-wb element is still rejected, and the message says what to
 * write instead. That advice must name a form that works today (the x-name
 * attribute), never a <wb-name> tag, which 4.0.0 removed. Both routes are
 * checked: the console line and the WB:LegacySyntax entry's fix field, which
 * the error log and errors viewer record.
 */
import { test, expect } from '../fixtures/offline';

// The error-log route is mocked below, so the service worker must not answer
// first (#1349).
test.use({ serviceWorkers: 'block' });

// Assembled, never written whole: the wb-prefix audit scans this file, and a
// literal retired tag in a line of code would be a finding of its own.
const RETIRED_TAG = '<' + 'wb' + '-';

test('the data-wb rejection names x-card, never a retired wb- tag (#1192)', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  // This test raises the error on purpose; keep it out of data/errors.json.
  await page.route('**/api/error-log/**', (route) => route.fulfill({ status: 200, body: '{}' }));

  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));

  const logged = await page.evaluate(async () => {
    const host = document.createElement('div');
    const legacy = document.createElement('div');
    legacy.id = 'legacy-1192';
    legacy.setAttribute('data-wb', 'card');
    host.append(legacy);
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
    const { getErrors } = await import('/src/core/error-logger.js');
    return JSON.stringify(getErrors().filter((e: any) => JSON.stringify(e).includes('data-wb=\\"card\\"')));
  });

  await expect(page.locator('#legacy-1192')).toHaveAttribute('x-error', 'legacy');

  const line = consoleErrors.find((l) => l.includes('Legacy syntax') && l.includes('data-wb="card"'));
  expect(line, 'the scan logs the legacy rejection').toBeTruthy();
  expect(line).toContain('x-card');
  expect(line).not.toContain(RETIRED_TAG);

  expect(logged, 'the WB:LegacySyntax error is stored').not.toBe('[]');
  expect(logged).toContain('"fix":"x-card"');
  expect(logged).not.toContain(RETIRED_TAG);
});
