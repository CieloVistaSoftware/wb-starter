import { test, expect } from '../fixtures/offline';
import { injectAndScan } from '../helpers/inject-and-scan';
import { wbIdle } from '../base';

/**
 * #1550: an empty element is "taught by example" -- filled from its schema --
 * and teach-by-example asked for /src/wb-models/<behavior>.schema.json by name.
 * 51 registered behaviors have no schema (x-lazy, x-datepicker, x-hotkey ...),
 * so each was a 404 and an ENOENT line in the server log. CI saw it from the
 * doc viewer rendering ATTRIBUTE-NAMING-STANDARD.md, which shows <img x-lazy>.
 *
 * Now it asks only for a schema data/schema-index.json lists. Teaching still
 * has to work where a schema exists, or this would pass by teaching nothing.
 */
const schema404s = (page: import('@playwright/test').Page) => {
  const missing: string[] = [];
  page.on('response', (r) => {
    if (/\/src\/wb-models\/[^/]+\.schema\.json/.test(r.url()) && r.status() === 404) missing.push(new URL(r.url()).pathname);
  });
  return missing;
};

test('the doc viewer asks for no schema that does not exist (#1550)', async ({ page }) => {
  const missing = schema404s(page);
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent('docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md'));
  await page.waitForFunction(() => {
    const t = document.getElementById('content')?.innerText || '';
    return t.length > 500 && !t.includes('Loading documentation');
  }, undefined, { timeout: 20_000 });
  await wbIdle(page, { timeout: 20_000 });
  expect(missing, 'schema requests that 404ed: the behavior has no schema and the index says so').toEqual([]);
});

test('an empty behavior with a schema is still taught by example (#1550)', async ({ page }) => {
  await injectAndScan(page, '<div id="taught" x-badge></div>');
  await expect.poll(() => page.evaluate(() => document.getElementById('taught')!.attributes.length),
    { message: 'an empty x-badge must still be filled in by example' }).toBeGreaterThan(2);
});
