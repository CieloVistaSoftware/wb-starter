/**
 * Schemas must be registered before the navigation scan runs (issue #139).
 * WB.init() (which awaits loadSchemas) must be awaited in site-engine, otherwise
 * card/cardhero/cardstats/cardnotification/audio log
 * "[WB] Schema for X not registered yet — attempting on-demand fetch".
 */
import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
for (const route of ['/?page=behaviors', '/?page=home']) {
  test(`no "schema not registered yet" warnings on ${route}`, async ({ page }) => {
    const warns: string[] = [];
    page.on('console', (m) => { if (/Schema for .* not registered yet/.test(m.text())) warns.push(m.text()); });
    await page.goto(route);
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
    await page.waitForFunction(() => (window as any).WBSite && (window as any).WBSite.currentPage, { timeout: 20000 });
    // Everything that could warn or fail has run once WB settles (#1516: no fixed sleep).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });
    expect(warns, 'unexpected schema warnings:\n' + warns.join('\n')).toHaveLength(0);
  });
}
