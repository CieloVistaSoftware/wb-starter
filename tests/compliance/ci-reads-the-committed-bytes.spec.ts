import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1205 -- CI scans the bytes git stores, not a CRLF rewrite of them.
 *
 * windows-latest's git defaults to core.autocrlf=true, so CI's checkout had
 * CRLF in every text file while the repo stores LF. Specs that scan files with
 * \n-shaped patterns then matched nothing and passed without checking anything:
 * md-wb-demo-required found html fences in 103 of 178 behavior docs on LF and in
 * 0 on CRLF. 41 specs read files with such patterns; fixing the checkout fixes
 * all of them at once instead of normalising in 41 places.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the Windows CI job turns autocrlf off before it checks out', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/ci-tests.yml'), 'utf8').replace(/\r\n/g, '\n');
  const job = yml.slice(yml.indexOf('runs-on: windows-latest'));
  const setting = job.indexOf('git config --global core.autocrlf false');
  const checkout = job.indexOf('uses: actions/checkout@');
  expect(setting, 'core.autocrlf false is never set in the Windows job').toBeGreaterThan(-1);
  expect(setting, 'it must come BEFORE the checkout, or the files are already CRLF').toBeLessThan(checkout);
});

test('in CI, a committed text file arrives with LF line endings', () => {
  test.skip(!process.env.CI, 'a local Windows checkout may legitimately be CRLF; CI is the gate');
  const doc = fs.readFileSync(path.join(ROOT, 'docs/behaviors/img.md'), 'utf8');
  expect(doc.includes('\r'), 'CI checked out CRLF: \\n-shaped scans will match nothing').toBe(false);
});
