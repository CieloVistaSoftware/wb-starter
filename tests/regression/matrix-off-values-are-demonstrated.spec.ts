import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1525: a schema's test.matrix can hold a combination that turns an option
 * OFF -- dialog's { title: "No Close", showClose: false }. The site generator
 * dropped every false value, so that demo rendered as <button x-dialog
 * title="No Close"> and opened a dialog WITH a close button: the one attribute
 * being demonstrated was the one that did not survive.
 *
 * An option that is on by default is turned off by writing name="false"
 * (read as off since #747), in the schema's own camelCase spelling (#1125).
 * An option that is off by default needs nothing written, so those are not
 * checked here.
 */
const root = process.cwd();

function offCombinations() {
  const dir = path.join(root, 'src', 'wb-models');
  const out: Array<{ behavior: string; attr: string; combo: string }> = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.schema.json'))) {
    let schema: any;
    try { schema = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const props = schema.properties || {};
    for (const combo of schema.test?.matrix?.combinations || []) {
      for (const [k, v] of Object.entries(combo)) {
        if (v === false && props[k]?.default === true) {
          out.push({ behavior: schema.schemaFor, attr: k, combo: JSON.stringify(combo) });
        }
      }
    }
  }
  return out;
}

test('every matrix combination that turns a default-on option off is demonstrated off (#1525)', () => {
  const combos = offCombinations();
  expect(combos.length, 'no schema demonstrates turning a default-on option off -- the scan found nothing').toBeGreaterThan(0);
  const siteDir = path.join(root, 'demos', 'site');
  const pages = fs.readdirSync(siteDir).filter((n) => n.endsWith('.html'))
    .map((n) => fs.readFileSync(path.join(siteDir, n), 'utf8')).join('\n');
  const missing = combos.filter(({ behavior, attr }) =>
    !new RegExp(`<[a-z]+[^>]*\\sx-${behavior}(?=[\\s>])[^>]*\\s${attr}=\\x22false\\x22`).test(pages));
  expect(missing.map((m) => `${m.behavior} ${m.attr}="false"  (matrix ${m.combo})`),
    'these matrix combinations demonstrate an option turned off, but no demo writes it off').toEqual([]);
});

test('the "No Close" dialog demo opens with no close button (#1525)', async ({ page }) => {
  await page.goto('/demos/site/overlays.html', { waitUntil: 'domcontentloaded' });
  const trigger = page.locator('button[x-dialog][title="No Close"]');
  await expect(trigger).toHaveAttribute('x-ready', /.*/, { timeout: 20000 });
  await trigger.click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toHaveCount(1, { timeout: 5000 });
  await expect(dialog.locator('.x-dialog__close:visible'), 'show-close="false" must leave no visible close button').toHaveCount(0);
});
