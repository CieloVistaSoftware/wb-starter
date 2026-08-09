/**
 * #312 — WB.init() must not eager-load every schema.json on every page load.
 *
 * Root cause: SchemaBuilder.loadSchemas() (called unconditionally from
 * WB.init()) fetches index.json and then every schema it lists, in
 * parallel — regardless of which wb-* tags are actually on the page. A HAR
 * capture of the home page showed 81 unique schema.json requests. The home
 * page only uses a handful of wb-* tags (wb-audio, wb-card, wb-cardhero,
 * wb-cardnotification, wb-cardstats, wb-container, wb-grid, wb-row,
 * wb-stack), and a separate on-demand path (WB.scan() -> processSchema() ->
 * loadSchemaFile()) already fetches exactly what's needed per tag actually
 * present. The bulk fetch is pure duplication of that working path.
 *
 * This test counts actual schema.json network requests on a single home
 * page load and asserts it stays in the single-to-low-double digits — proof
 * the fix (removing the unconditional bulk loadSchemas() call from
 * WB.init()) actually changes network behavior, not just internal registry
 * state.
 */
import { test, expect } from '@playwright/test';

test.describe('#312 — schema.json is fetched on-demand, not eagerly for every schema', () => {
  test('home page fetches only a handful of schema.json files, not all of them', async ({ page }) => {
    const schemaRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/wb-models/') && req.url().endsWith('.schema.json')) {
        schemaRequests.push(req.url());
      }
    });

    await page.goto('http://localhost:3000/?page=home');
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });
    // Let any deferred/lazy schema fetches (scroll-triggered, MutationObserver-driven) settle.
    await page.waitForTimeout(1500);

    const uniqueSchemaRequests = new Set(schemaRequests);

    // Sanity: total schema files available in the registry, so the assertion
    // below is provably "way less than everything," not a magic number.
    const indexRes = await page.request.get('http://localhost:3000/src/wb-models/index.json');
    const index = await indexRes.json();
    const totalSchemaCount = (index.schemas || []).length;

    expect(totalSchemaCount, 'sanity check: the schema library should be non-trivially large').toBeGreaterThan(30);
    expect(
      uniqueSchemaRequests.size,
      `home page requested ${uniqueSchemaRequests.size}/${totalSchemaCount} schema.json files — expected only the ones its own wb-* tags need, not the whole library: ${[...uniqueSchemaRequests].join(', ')}`
    ).toBeLessThan(20);
  });

  // Follow-up to the on-demand fix above: the home page has several
  // instances of the same component (multiple <wb-card>-family tags), and
  // each independently discovers on scan that the shared schema isn't
  // registered yet — none of them see it as registered until their OWN
  // fetch resolves, so they each started their own redundant fetch. Live
  // HAR capture showed card.schema.json fetched 6x, cardstats.schema.json
  // and cardnotification.schema.json 4x each, on one home-page load. Fixed
  // by memoizing the in-flight fetch promise per filename in
  // loadSchemaFile() (schema-builder.js) so concurrent callers share one
  // request instead of each starting their own.
  test('no single schema.json file is fetched more than once, even with multiple same-schema instances on the page', async ({ page }) => {
    const schemaRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/wb-models/') && req.url().endsWith('.schema.json')) {
        schemaRequests.push(req.url());
      }
    });

    await page.goto('http://localhost:3000/?page=home');
    await page.waitForSelector('#mainPage-home', { timeout: 20000 });
    await page.waitForTimeout(1500);

    const counts = new Map<string, number>();
    for (const url of schemaRequests) counts.set(url, (counts.get(url) || 0) + 1);
    const duplicated = [...counts.entries()].filter(([, count]) => count > 1);

    expect(
      duplicated,
      `every schema.json file should be requested at most once per page load, but found duplicates: ${duplicated.map(([u, c]) => `${u} (${c}x)`).join(', ')}`
    ).toEqual([]);
  });
});
