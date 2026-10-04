import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';

/**
 * #1353: table.schema.json said the hoverable option applies x-table--hoverable,
 * a class that existed nowhere. table.js adds x-table--hover and data.css styles
 * only that. hoverable is visual:false, so variants-render-differently exempts
 * it, and nothing compared a boolean's appliesClass with what the behavior does.
 *
 * Every class table.schema.json says an option applies must be on a rendered
 * table with that option on.
 */
const schema = JSON.parse(fs.readFileSync('src/wb-models/table.schema.json', 'utf8'));

test('each class table.schema.json declares is the class the table gets (#1353)', async ({ page }) => {
  const booleans = Object.entries(schema.properties as Record<string, any>)
    .filter(([, d]) => d && d.type === 'boolean' && d.appliesClass)
    .map(([name, d]) => ({ name, cls: String(d.appliesClass) }));
  expect(booleans.map((b) => b.name), 'hoverable is one of them').toContain('hoverable');

  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  const rendered = await page.evaluate(async (opts) => {
    const host = document.createElement('div');
    for (const { name } of opts) {
      host.insertAdjacentHTML('beforeend',
        `<table data-case="${name}" ${name}><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`);
    }
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
    const out: Record<string, string> = {};
    host.querySelectorAll('table').forEach((t) => {
      // table.js may wrap or rebuild; read the classes of the table element
      // itself and any wrapper the behavior put around it.
      const classes = [t.className, t.parentElement && t.parentElement !== host ? t.parentElement.className : ''];
      out[t.getAttribute('data-case')!] = classes.join(' ');
    });
    return out;
  }, booleans);

  for (const { name, cls } of booleans) {
    expect(rendered[name], `${name}: schema says it applies .${cls}`).toMatch(new RegExp(`(^|\\s)${cls}(\\s|$)`));
  }
});
