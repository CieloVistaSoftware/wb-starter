import { test, expect } from '../fixtures/offline';
import * as fs from 'fs';
import * as path from 'path';

/**
 * x-codecontrol IS NOW x-codetheme, AND THE OLD NAME STILL WORKS (#668)
 * ====================================================================
 * The behavior is a highlight.js theme picker: its own header said so, its
 * sync event was already `x:codetheme:sync`, and its tests were already named
 * code-theme-*. Only the name said "code control", and the schema called it an
 * "Interactive code editor/viewer control", which it never was.
 *
 * It is renamed to codetheme everywhere (module, schema, stylesheet, doc,
 * demos). `x-codecontrol` is declared once, in BEHAVIOR_ALIASES
 * (src/core/attribute-aliases.js), so a page written against the old name
 * still gets the dropdown -- without the old name counting as a second
 * behavior in tag-map.js, the reference docs or the behaviors page.
 *
 * See it by hand: open /demos/test-harness.html and add
 * <div x-codecontrol></div> and <div x-codetheme></div>. Before: only the first
 * rendered a theme dropdown. Now: both do, and both are the same behavior.
 */

test.describe('codetheme rename keeps the codecontrol alias (#668)', () => {
  test('x-codetheme and the old x-codecontrol both render the theme dropdown', async ({ page }) => {
    await page.goto('/demos/test-harness.html', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 15_000 });

    const hosts = await page.evaluate(async () => {
      const box = document.createElement('div');
      box.innerHTML = '<div id="new" x-codetheme></div><div id="old" x-codecontrol></div>';
      document.body.appendChild(box);
      await (window as any).WB.scan(box, { eager: true });
      const read = (id: string) => {
        const el = document.getElementById(id)!;
        const select = el.querySelector('.x-codetheme__select') as HTMLSelectElement | null;
        return { options: select?.options.length ?? 0, api: typeof (el as any).wbCodeTheme };
      };
      return { now: read('new'), old: read('old') };
    });

    expect(hosts.now.options, 'x-codetheme rendered no theme dropdown').toBeGreaterThan(10);
    expect(hosts.old.options, 'the x-codecontrol alias stopped rendering the dropdown').toBe(hosts.now.options);
    expect(hosts.now.api).toBe('object');
    expect(hosts.old.api).toBe('object');
  });

  // The harness above runs wb-lazy.js, which dispatches from selector tables.
  // The site itself runs wb.js, which dispatches from the behavior registry in
  // wb-viewmodels/index.js. Both read the alias from the one table; with it in
  // only one of them, x-codecontrol rendered nothing on a wb.js page.
  test('the alias also works on a page run by wb.js', async ({ page }) => {
    await page.goto('/?page=home', { waitUntil: 'load' });
    await page.waitForFunction(() => !!(window as any).WB?.scan, null, { timeout: 20_000 });
    const counts = await page.evaluate(async () => {
      const box = document.createElement('div');
      box.innerHTML = '<div id="new" x-codetheme></div><div id="old" x-codecontrol></div>';
      document.body.appendChild(box);
      await (window as any).WB.scan(box);
      await (window as any).WB.settled?.({ timeout: 5000 });
      const count = (id: string) => document.querySelectorAll(`#${id} .x-codetheme__select`).length;
      return { now: count('new'), old: count('old') };
    });
    expect(counts, 'each host should carry exactly one theme dropdown').toEqual({ now: 1, old: 1 });
  });

  test('the schema says what it is: a code-theme picker, not an editor', () => {
    const root = process.cwd();
    const schema = JSON.parse(fs.readFileSync(path.join(root, 'src/wb-models/codetheme.schema.json'), 'utf8'));
    expect(schema.schemaFor).toBe('codetheme');
    expect(schema.description).toMatch(/highlight\.js code theme/);
    expect(schema.description).not.toMatch(/editor|viewer/i);
    for (const old of ['src/wb-viewmodels/codecontrol.js', 'src/wb-models/codecontrol.schema.json',
      'src/styles/behaviors/codecontrol.css', 'docs/behaviors/codecontrol.md']) {
      expect(fs.existsSync(path.join(root, old)), `${old} should have been renamed to codetheme`).toBe(false);
    }
  });
});
