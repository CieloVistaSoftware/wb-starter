/**
 * x-details — summary attribute becomes the header (issue #131)
 */
import { test, expect, Page } from '../fixtures/offline';
import { openBehaviorsPanel, renderVariant, example } from '../utils/behaviors-panel';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
  // #691: NOT WBSite. /demos/test-harness.html is a standalone page, not an SPA
  // route, so window.WBSite is never created there -- waiting on it timed out at
  // 20s and these assertions never ran. WB.behaviors is the readiness signal
  // that actually applies, and setup() calls await WB.scan() itself below.
  await page.evaluate((h: string) => {
    const c = document.createElement('div');
    c.id = 'details-test-area';
    c.style.cssText = 'padding:20px; width:500px;';
    c.innerHTML = h;
    document.body.appendChild(c);
  }, html);
  await page.evaluate(async () => { if ((window as any).WB?.scan) await (window as any).WB.scan(document.body, { eager: true }); });
  await page.waitForTimeout(400);
}

test.describe('.x-details', () => {
  test('header shows the summary attribute, not the literal "Details"', async ({ page }) => {
    await setup(page, '<details summary="Question?"><p>Answer content here</p></details>');
    const label = page.locator('.x-details__label');
    await expect(label).toHaveText('Question?');
  });

  test('answer content lives in the body, not the summary', async ({ page }) => {
    await setup(page, '<details summary="What is wb-starter?"><p id="ans">Answer content here</p></details>');
    const ans = page.locator('#ans');
    await expect(ans).toHaveText('Answer content here');
    const inSummary = await ans.evaluate((el) => !!el.closest('summary'));
    expect(inSummary).toBe(false);
  });

  // <details> has both a real behavior (details(), semantics/details.js)
  // AND a registered schema (details.schema.json, kept for the doc catalog)
  // -- WB.processSchema() and the native-behavior injection loop in scan()
  // both ran independently. The schema's $view builds an EMPTY content div
  // (it has no concept of "preserve original children"), and details()'s
  // own "wrap content" logic then wrapped that already-content-less schema
  // output as if it were the real content -- confirmed live on
  // pages/behaviors.html: the summary text duplicated (once correctly
  // wrapped in the outer <summary>, once raw and unstyled nested inside the
  // content div) and the real answer text was silently discarded entirely.
  // Same fix pattern as x-demo/x-modal (#305): excluded via
  // SCHEMA_EXCLUDED_TAGS (schema-builder.js) AND WB.processSchema()'s own
  // early-return (wb.js) -- two independent detection paths both needed it.
  //
  // This is a genuine race between the schema-fetch path and the
  // native-behavior-injection path, both of which run async/on-demand --
  // test-harness.html's isolated single-element setup() above doesn't
  // reliably reproduce it (confirmed: passed even against the pre-fix
  // code). The real page, with its full WB.init() boot sequence and many
  // concurrent wb-* elements competing for schema fetches, does -- so this
  // test loads the actual page the bug was found on instead.
  test('does not get double-processed by schema + native behavior (no nested summary, no duplicate class)', async ({ page }) => {
    // The Behaviors page builds its examples on demand since #664, so there is
    // no `details.x-details` on it until a row is picked -- and the answer text
    // this used to look for belonged to the retired static section. Render the
    // x-details example in the live panel: still the real page, with its full
    // WB.init() boot and many concurrent behaviors, which is what reproduced it.
    await openBehaviorsPanel(page, 'x-details');
    await renderVariant(page, 'x-details', 'default');

    const detailsEl = example(page);
    await expect(detailsEl).toHaveAttribute('x-ready', '');
    await expect(detailsEl).toHaveJSProperty('tagName', 'DETAILS');

    // The buggy double-processed output ends up with ".x-details .x-details"
    // (both the schema path and the behavior path add the class).
    const className = await detailsEl.getAttribute('class');
    expect(className?.trim().split(/\s+/).filter(c => c === 'x-details').length).toBe(1);

    // Only one <summary> — the buggy output nests a second, raw one inside
    // the content div.
    await expect(detailsEl.locator('summary')).toHaveCount(1);

    // The real authored content must survive, not be discarded by the
    // schema's content-less $view.
    await expect(detailsEl.locator('.x-details__content')).toContainText('the summary text is authored via the');
  });
});
