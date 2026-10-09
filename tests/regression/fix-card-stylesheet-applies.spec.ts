/**
 * fix-card.css styles a rendered fix card (#1095 batch 5).
 *
 * Every rule in fix-card.css keyed on `.x-card.fix-card`. Card hosts stopped
 * carrying the x-card class when a8a7362e moved card.css to attribute
 * selectors, so none of those rules matched: the stylesheet loaded and a
 * rendered <div x-fix-card> came out with block headers and no height cap.
 * The rules now key on .x-fix-card, the class fixCard() itself adds. This
 * reads the computed values the stylesheet sets, so a selector that stops
 * matching again fails here by name.
 */
import { test, expect, Page } from '../fixtures/offline';

const HARNESS = '/demos/test-harness.html';

async function renderFixCard(page: Page, html: string, importFirst: boolean) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    undefined,
    { timeout: 10000 }
  );
  if (importFirst) {
    // The tag's definition is the shim at the bottom of fix-card.js; a page
    // that uses <x-fix-card> loads that module, and nothing else defines it.
    await page.evaluate(() => import('/src/wb-viewmodels/fix-card.js'));
  }
  await page.evaluate(async (h: string) => {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, html);
  await page.waitForFunction(
    () => typeof Object.getOwnPropertyDescriptor(document.getElementById('fc') as any, 'data')?.set === 'function',
    undefined,
    { timeout: 5000 }
  );
  await page.locator('#fc').evaluate((el: any) => {
    el.data = { errorId: 'TEST-1095', issue: 'Stylesheet check', file: 'src/a.js', status: 'fixed' };
  });
  await page.locator('#fc .header-top').waitFor({ timeout: 5000 });
}

for (const [form, html, importFirst] of [
  ['attribute form', '<div x-fix-card id="fc"></div>', false],
  ['tag form', '<x-fix-card id="fc"></x-fix-card>', true],
] as const) {
  test(`fix-card.css applies to a rendered fix card (${form})`, async ({ page }) => {
    await renderFixCard(page, html, importFirst);
    const seen = await page.locator('#fc').evaluate((host) => {
      const css = (sel: string, prop: string) => {
        const el = host.querySelector(sel);
        return el ? getComputedStyle(el).getPropertyValue(prop) : `(no ${sel})`;
      };
      return {
        hostClass: host.className,
        hostMaxHeight: getComputedStyle(host).maxHeight,
        headerTopDisplay: css('.header-top', 'display'),
        fixMetaDisplay: css('.fix-meta', 'display'),
      };
    });
    const why = `fix-card.css did not reach the card: ${JSON.stringify(seen)}`;
    expect(seen.hostClass, why).toContain('x-fix-card');
    // .x-fix-card { max-height: 46.875rem } is 750px at the default 16px root.
    expect(seen.hostMaxHeight, why).toBe('750px');
    expect(seen.headerTopDisplay, why).toBe('flex');
    expect(seen.fixMetaDisplay, why).not.toBe('block');
  });
}
