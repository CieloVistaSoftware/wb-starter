import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { settlePage } from '../base';

/**
 * A card's built parts carry ids derived from its host (#940).
 *
 * John: "if all elements on the page have an id then duplicate work would have
 * a run time error." #923 rendered a card twice into one host -- two headers,
 * two titles -- and nothing said so: the parts had no ids, so duplicate-ids.js
 * (#730) had nothing to catch. Now a card with an id names its parts
 * `${id}__header`, `${id}__body`, …, and a doubled part repeats its id.
 *
 * Read from every card schema's test setups, so a new card is held to it.
 */
const SETUPS: string[] = fs.readdirSync(path.join(process.cwd(), 'src/wb-models'))
  .filter((f) => /^card[a-z]*\.schema\.json$/.test(f))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/wb-models', f), 'utf8')).test?.setup || []);

async function open(page: import('@playwright/test').Page) {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB?.behaviors, null, { timeout: 20_000 });
}

test('every card part is named after its host, and no two collide', async ({ page }) => {
  expect(SETUPS.length, 'the card schemas were read, so this can fail').toBeGreaterThan(50);
  await open(page);
  await page.evaluate(async (setups) => {
    const host = document.createElement('div');
    // One id per card, so the whole set must come out free of duplicates.
    host.innerHTML = setups.map((m, i) => m.replace(/^<(\w+)/, `<$1 id="c${i}"`)).join('');
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    (window as any).__wb961Host = host;
  }, SETUPS);
  // Ids are stamped in a microtask after the build; settled() covers it.
  await settlePage(page, { timeout: 5000 });
  const result = await page.evaluate(async () => {
    const host = (window as any).__wb961Host as HTMLElement;
    const unnamed: string[] = [];
    let parts = 0;
    // A nested behavior host (a badge inside a card) owns its own parts.
    const insideNestedHost = (el: Element, card: Element) => {
      for (let n = el.parentElement; n && n !== card; n = n.parentElement) {
        if ([...n.attributes].some((a) => a.name.startsWith('x-') && a.name !== 'x-ready')) return true;
      }
      return [...el.attributes].some((a) => a.name.startsWith('x-') && a.name !== 'x-ready');
    };
    for (const card of host.children) {
      for (const el of card.querySelectorAll('*')) {
        const part = [...el.classList].find((c) => /^x-[a-z-]+__[a-z0-9-]+$/.test(c));
        if (!part || insideNestedHost(el, card)) continue;
        parts++;
        if (!el.id) unnamed.push(`${card.id} ${part}`);
      }
    }
    const { findDuplicateIds } = await import('/src/core/duplicate-ids.js');
    const dups = findDuplicateIds(host);
    host.remove();
    return { parts, unnamed: unnamed.slice(0, 10), dups };
  });
  expect(result.parts, 'cards built parts to name').toBeGreaterThan(100);
  expect(result.unnamed, 'a card part with no id').toEqual([]);
  expect(result.dups, 'a part id that repeats inside one render').toEqual([]);
});

test('an anonymous card gets no invented ids', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<article title="Plain" subtitle="No id">Body text</article>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    (window as any).__wb961Host = host;
  });
  // Ids are stamped in a microtask after the build; settled() covers it.
  await settlePage(page, { timeout: 5000 });
  const ids = await page.evaluate(() => {
    const host = (window as any).__wb961Host as HTMLElement;
    const found = [...host.querySelectorAll('[id]')].map((el) => el.id);
    host.remove();
    return found;
  });
  expect(ids).toEqual([]);
});

test('a card rendered twice into one host is reported, not silent (#923)', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<article id="twice" title="Twice" subtitle="Rendered again">Body text</article>';
    document.body.appendChild(host);
    await (window as any).WB.scan(host, { eager: true });
    (window as any).__wb961Host = host;
  });
  // Ids are stamped in a microtask after the build; settled() covers it.
  await settlePage(page, { timeout: 5000 });
  const dups = await page.evaluate(async () => {
    const host = (window as any).__wb961Host as HTMLElement;
    // #923's shape: a second render appended its parts beside the first.
    const card = host.firstElementChild!;
    for (const part of [...card.children]) card.appendChild(part.cloneNode(true));
    const { findDuplicateIds } = await import('/src/core/duplicate-ids.js');
    const found = findDuplicateIds(host).map((d: { id: string }) => d.id).sort();
    host.remove();
    return found;
  });
  expect(dups, 'the doubled header and body repeat their ids').toEqual(expect.arrayContaining(['twice__header', 'twice__body']));
});
