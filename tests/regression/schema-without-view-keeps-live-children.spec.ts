import { test, expect } from '../fixtures/offline';

/**
 * #1149 -- a behavior whose schema declares no $view must not rebuild the
 * author's children.
 *
 * sticky.schema.json and fill.schema.json are registered and declare no $view.
 * The issue's reading of schema-builder.js: such an element gets its content
 * cleared and re-parsed from a string copy, which keeps the markup but drops
 * every listener and every reference attached before the schema pass. A
 * <nav x-sticky> holding a live menu would end up with dead toggles.
 *
 * Measured on the real objects: the child must be the SAME node after the scan,
 * and a listener attached before the scan must still fire. Both engines.
 */
for (const engine of ['wb-lazy', 'wb'] as const) {
  for (const behavior of ['x-sticky', 'x-fill'] as const) {
    test(`${engine}: <nav ${behavior}> keeps the author's live children`, async ({ page }) => {
      await page.goto('/tests/fixtures/blank.html', { waitUntil: 'domcontentloaded' });
      const r = await page.evaluate(async ({ engine, behavior }) => {
        document.documentElement.setAttribute('data-x-expected-errors', '');
        const host = document.createElement('div');
        host.innerHTML = `<nav ${behavior}><button type="button" id="live">Menu</button></nav>`;
        document.body.appendChild(host);
        const before = host.querySelector('#live') as HTMLButtonElement;
        let clicks = 0;
        before.addEventListener('click', () => { clicks++; });

        if (engine === 'wb-lazy') {
          const mod: any = await import('/src/core/wb-lazy.js');
          await (mod.default || mod.WB).scan(host, { eager: true });
          await (mod.default || mod.WB).settled?.({ timeout: 10000 });
        } else {
          const mod: any = await import('/src/core/wb.js');
          const WB = mod.default || mod.WB;
          if (WB.init) await WB.init({ autoInject: true });
          await WB.scan(host);
          await WB.settled?.({ timeout: 10000 });
        }
        // Each runtime has settled above (#1516: not 800ms).

        const after = host.querySelector('#live') as HTMLButtonElement | null;
        after?.click();
        return {
          sameNode: after === before,
          clicks,
          schemaBuilt: host.querySelector('nav')!.hasAttribute('x-schema'),
        };
      }, { engine, behavior });

      expect(r.sameNode, `the author's button was replaced (schema-built: ${r.schemaBuilt})`).toBe(true);
      expect(r.clicks, 'a listener attached before the scan no longer fires').toBe(1);
    });
  }
}
