/**
 * Schemas must be registered before the navigation scan runs (issue #139).
 * WB.init() (which awaits loadSchemas) must be awaited in site-engine, otherwise
 * card/cardhero/cardstats/cardnotification/audio log
 * "[WB] Schema for X not registered yet — attempting on-demand fetch".
 */
import { test, expect } from '@playwright/test';

for (const route of ['/?page=components', '/?page=behaviors', '/?page=home']) {
  test(`no "schema not registered yet" warnings on ${route}`, async ({ page }) => {
    const warns: string[] = [];
    page.on('console', (m) => { if (/Schema for .* not registered yet/.test(m.text())) warns.push(m.text()); });
    await page.goto(route);
    await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 20000 });
    await page.waitForTimeout(2500);
    expect(warns, 'unexpected schema warnings:\n' + warns.join('\n')).toHaveLength(0);
  });
}
