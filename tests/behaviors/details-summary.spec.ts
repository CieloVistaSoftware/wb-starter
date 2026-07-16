/**
 * wb-details — summary attribute becomes the header (issue #131)
 */
import { test, expect, Page } from '@playwright/test';

async function setup(page: Page, html: string): Promise<void> {
  await page.goto('/demos/test-harness.html');
  await page.waitForFunction(() => (window as any).WB && (window as any).WB.behaviors, { timeout: 15000 });
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

test.describe('wb-details', () => {
  test('header shows the summary attribute, not the literal "Details"', async ({ page }) => {
    await setup(page, '<wb-details summary="Question?"><p>Answer content here</p></wb-details>');
    const label = page.locator('.wb-details__label');
    await expect(label).toHaveText('Question?');
  });

  test('answer content lives in the body, not the summary', async ({ page }) => {
    await setup(page, '<wb-details summary="What is wb-starter?"><p id="ans">Answer content here</p></wb-details>');
    const ans = page.locator('#ans');
    await expect(ans).toHaveText('Answer content here');
    const inSummary = await ans.evaluate((el) => !!el.closest('summary'));
    expect(inSummary).toBe(false);
  });

  // <wb-details> has both a real behavior (details(), semantics/details.js)
  // AND a registered schema (details.schema.json, kept for the doc catalog)
  // -- WB.processSchema() and the native-behavior injection loop in scan()
  // both ran independently. The schema's $view builds an EMPTY content div
  // (it has no concept of "preserve original children"), and details()'s
  // own "wrap content" logic then wrapped that already-content-less schema
  // output as if it were the real content -- confirmed live on
  // pages/components.html: the summary text duplicated (once correctly
  // wrapped in the outer <summary>, once raw and unstyled nested inside the
  // content div) and the real answer text was silently discarded entirely.
  // Same fix pattern as wb-demo/wb-modal (#305): excluded via
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
    await page.goto('/?page=components');
    await page.waitForFunction(() => (window as any).WBSite !== undefined, { timeout: 15000 });

    const detailsEl = page.locator('details.wb-details').first();
    await detailsEl.scrollIntoViewIfNeeded();
    await expect(detailsEl).toHaveCount(1);

    // The buggy double-processed output ends up with "wb-details wb-details"
    // (both the schema path and the behavior path add the class).
    const className = await detailsEl.getAttribute('class');
    expect(className?.trim().split(/\s+/).filter(c => c === 'wb-details').length).toBe(1);

    // Only one <summary> — the buggy output nests a second, raw one inside
    // the content div.
    await expect(detailsEl.locator('summary')).toHaveCount(1);

    // The real content ("What is wb-starter?"'s answer, pages/components.html)
    // must survive, not be discarded by the schema's content-less $view.
    await expect(detailsEl.locator('.wb-details__content')).toContainText('zero-build web component library');
  });
});
