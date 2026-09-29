/**
 * <div x-checkbox>Run tests</div> is a checkbox labelled "Run tests", on
 * both runtimes.
 *
 * On wb-lazy.js pages the schema build cleared the host and filled the
 * $view's {{label}} slot from the schema default, so the author's text was
 * replaced by the placeholder "this is the label". wb.js pages kept it.
 */
import { test, expect } from '../fixtures/offline';

for (const [runtime, url] of [['wb.js', '/index.html'], ['wb-lazy.js', '/demos/site/forms.html']] as const) {
  test(`${runtime}: text inside the tag is the label; a label attribute still wins`, async ({ page }) => {
    await page.goto(url);
    await page.waitForFunction(() => (window as any).WB?.scan);
    await page.evaluate(async () => {
      const h = document.createElement('div');
      h.id = 'lbl';
      h.innerHTML = '<div x-checkbox id="t">Run tests</div><div x-checkbox id="a" label="Attr label"></div>';
      document.body.prepend(h);
      await (window as any).WB.scan(h, { eager: true });
    });
    await expect(page.locator('#t .x-checkbox__label')).toHaveText('Run tests');
    await expect(page.locator('#a .x-checkbox__label')).toHaveText('Attr label');
  });
}
