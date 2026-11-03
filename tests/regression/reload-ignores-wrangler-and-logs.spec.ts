import { test, expect } from '@playwright/test';
import { isReloadIgnored } from '../../scripts/lib/reload-ignore.mjs';

// #1963: `npm run pro:local` reloaded the browser for the local Worker's files
// and for a captured log, none of which are part of the site.
test.describe('live reload ignores files that are not the site (#1963)', () => {
  for (const file of [
    'server\\waitlist\\.wrangler\\tmp\\dev-ZBxNLR\\index.js',
    'server\\waitlist\\.wrangler\\state\\v3\\observability\\trace.sqlite-wal',
    'pro-local.log',
    'data\\bg-health.json',
    'tests\\regression\\a.spec.ts',
  ]) {
    test(`ignores ${file}`, () => {
      expect(isReloadIgnored(file)).toBe(true);
    });
  }

  for (const file of ['src\\core\\wb.js', 'src/styles/site.css', 'pages/home.html', 'src/catalog.json']) {
    test(`still reloads for ${file}`, () => {
      expect(isReloadIgnored(file)).toBe(false);
    });
  }
});
