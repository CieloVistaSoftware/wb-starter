import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';

/**
 * #1320: x-typewriter's cursor is a caret that is on or off -- effects.js reads
 * `cursor !== 'false'` and the caret is a CSS border. The Behaviors catalogue
 * listed a "custom cursor" example, cursor="▌", that rendered the same caret as
 * every other row, and the schema typed cursor as a string with a placeholder
 * default. What the docs, schema and examples say must be what the code does.
 */
test('the schema and catalogue describe the cursor the code has (#1320)', () => {
  const schema = JSON.parse(fs.readFileSync('src/wb-models/typewriter.schema.json', 'utf8'));
  expect(schema.properties.cursor.type, 'cursor is on/off').toBe('boolean');
  expect(schema.properties.cursor.default).toBe(true);

  const examples = JSON.parse(fs.readFileSync('data/behavior-examples.json', 'utf8')).examples['x-typewriter'];
  const sources = JSON.stringify(examples);
  const cursorValues = [...sources.matchAll(/cursor=\\"([^"\\]*)\\"/g)].map((m) => m[1]);
  expect(cursorValues.filter((v) => v !== 'false' && v !== 'true'), 'no example promises a cursor character').toEqual([]);
});

test('cursor="false" removes the caret; the default shows it (#1320)', async ({ page }) => {
  await page.goto('/?page=behaviors');
  await page.waitForFunction(() => Boolean((window as any).WB));
  const classes = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<p id="tw-on" x-typewriter speed="10">On</p><p id="tw-off" x-typewriter speed="10" cursor="false">Off</p>';
    document.body.append(host);
    await (window as any).WB.scan(host, { eager: true });
    return { on: host.querySelector('#tw-on')!.className, off: host.querySelector('#tw-off')!.className };
  });
  expect(classes.on).toMatch(/\bx-typewriter--cursor\b/);
  expect(classes.off).not.toMatch(/\bx-typewriter--cursor\b/);
});
