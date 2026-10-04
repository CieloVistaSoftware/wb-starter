import { test, expect } from '../fixtures/offline';

/**
 * #1148 -- wb-lazy never schema-builds a behavior that builds its own DOM.
 *
 * SCHEMA_SKIP_TAGS in src/core/wb-lazy.js lists behaviors whose schema must not
 * be built, because they build their own complete DOM and a schema $view would
 * race them and wipe whichever finished first. After 4.0.0 its entries read
 * '[x-accordion]', '.x-select', ... -- selector spellings that an attribute name
 * can never equal -- so all of them were off, and x-dropdown's $view emptied the
 * author's trigger text and left a second, empty menu.
 *
 * Asserted on what the schema path leaves behind: processElement() marks what it
 * built with x-schema. None of these may carry it after a wb-lazy scan.
 */
const SELF_BUILDING = [
  '<div x-details></div>',
  '<div x-select></div>',
  '<div x-dialog></div>',
  '<div x-skeleton></div>',
  '<div x-articles></div>',
  '<div x-dropdown><button>Menu</button></div>',
  '<div x-accordion></div>',
  '<div x-audio src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg"></div>',
  '<div x-fix-card></div>',
];

test('no self-building behavior is schema-built by wb-lazy', async ({ page }) => {
  await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
  const built = await page.evaluate(async (snippets) => {
    document.documentElement.setAttribute('data-x-expected-errors', '');
    const host = document.createElement('div');
    host.innerHTML = snippets.join('\n');
    document.body.appendChild(host);
    const mod: any = await import('/src/core/wb-lazy.js');
    await (mod.default || mod.WB).scan(host, { eager: true });
    await new Promise((r) => setTimeout(r, 500));
    return Array.from(host.children)
      .filter((el) => el.hasAttribute('x-schema'))
      .map((el) => Array.from(el.attributes).map((a) => a.name).find((n) => n.startsWith('x-') && n !== 'x-schema'));
  }, SELF_BUILDING);
  expect(built, 'these were schema-built, so their $view raced the behavior that builds the same DOM').toEqual([]);
});
