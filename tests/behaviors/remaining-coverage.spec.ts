/**
 * Behaviors page — remaining sections coverage (Overlays / Selection / Inputs /
 * Media / Utilities / Data). Goal, unchanged since this file was written: every
 * behavior in those groups is exercised on the behaviors page and none throws.
 *
 * #858 — HOW that goal is reached had to change completely.
 *
 * This spec used to open /?page=behaviors and immediately count `[x-drawer]`,
 * `[x-kbd]`, `input[type="checkbox"]` and so on, because the page was one
 * 13,000px document with 88 static `<div x-demo>` blocks — every behavior
 * rendered at load. Commit 96edb613, `feat(#666): examples move to a data file;
 * demo sections removed`, deleted all 88. pages/behaviors.html:173-179 records
 * it: the examples "now live in data/behavior-examples.json ... and are
 * rendered on demand by the live-preview panel".
 *
 * So 23 of these 24 assertions had been matching nothing since 2026-08-19 —
 * two of them burning a 30s hard timeout each, which is the #857 cascade
 * hazard. They were not catching a defect; they were describing a page the
 * product deliberately replaced.
 *
 * Worse were the four that "passed": `[x-fullscreen]`, `input[type="radio"]`
 * and `select` matched the page's OWN chrome (the fullscreen control and the
 * Both/Semantic/x-attribute filter radios), never a demo, and the modal test's
 * selector `'[x-modal], .x-modal, dialog[open], .modal'` matched the trigger
 * BUTTON and checked its offsetParent — it never looked at the dialog.
 *
 * The rewrite drives the page as it now is: pick the behavior out of the browse
 * list, wait for its example to be injected and scanned, then assert against
 * what rendered. Rows carry `data-browse-token` (pages/behaviors.html:523),
 * which is the exact behavior name, so — unlike a bare tag selector — the
 * locator cannot silently go vacuous. show() asserts a row EXISTS before
 * clicking, so a behavior vanishing from the registry fails loudly.
 */
import { test, expect, Page } from '@playwright/test';

// Every test here boots the behaviors page from scratch, and that page is not
// cheap: the SPA shell, then two fetches (tag-map, then the schema index) that
// between them build 157 behaviors' worth of rows, then a live example rendered
// and scanned. ~10s per test at --workers=1, and the default 30s budget starts
// losing races the moment eight workers share the box. The waits below are all
// event-driven, so a longer ceiling buys tolerance without hiding a hang — a
// genuinely stuck test still fails, just with a message about the thing it was
// waiting for instead of a bare "test timeout".
test.describe.configure({ timeout: 90_000 });

async function loadBrowse(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  // The list is filled by those two fetches, so an empty results list is a
  // normal intermediate state, not a failure.
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 0,
    { timeout: 30000 },
  );
}

/**
 * Pick `token` out of the browse list and wait until its example has been
 * injected AND scanned.
 *
 * The barrier is `#behaviors-live-code pre code.hljs`, and the choice is
 * deliberate: renderSource() (pages/behaviors.html:1626) empties
 * #behaviors-live-code, rebuilds the <pre>/<code> pair, then does
 *
 *     await WB.scan(liveStage, { eager: true });
 *     await WB.scan(liveCode,  { eager: true });
 *
 * The code block is only highlighted by that SECOND scan, which cannot start
 * until the stage scan has resolved. So `.hljs` on a freshly built <code> is a
 * signal that strictly follows behavior attachment on the example — no sleep,
 * no racing an unawaited scan.
 *
 * #771 preselects the first row on load, so the panel is already showing
 * somebody else's example when we arrive. Snapshotting the example markup and
 * requiring it to turn over is what distinguishes "the render we asked for"
 * from "the render that was already there".
 */
async function show(page: Page, token: string) {
  const rows = page.locator(`.behaviors-search-results__row[data-browse-token="${token}"]`);
  // Retrying, and no separate scrollIntoViewIfNeeded step: applyFilter()
  // rebuilds the whole list when the second fetch lands, so a row resolved a
  // moment too early is detached by the time a scroll action reaches it
  // ("Element is not attached to the DOM"). click() scrolls the row into view
  // itself AND re-resolves the locator from scratch on detachment, so folding
  // the scroll into the click is what makes this stable rather than lucky.
  await expect(rows.first(), `${token} must appear in the behaviors list`).toBeAttached();

  const before = await page.evaluate(
    () => document.getElementById('behaviors-live-example')?.innerHTML ?? '',
  );
  await rows.first().click();

  await page.waitForFunction(
    (prev) => {
      const code = document.querySelector('#behaviors-live-code pre code');
      const example = document.getElementById('behaviors-live-example');
      return !!code && code.classList.contains('hljs')
        && !!example && example.children.length > 0
        && example.innerHTML !== prev;
    },
    before,
    { timeout: 20000 },
  );
}

/** Nothing in the stage may have been marked as having thrown. */
function errored(page: Page) {
  return page.locator(
    '#behaviors-live-stage [x-error="true"], #behaviors-live-stage [x-error="legacy"]',
  );
}

// Breadth sweep: each behavior must render an example and upgrade without
// throwing. Same 24 slots as before; four of the tokens had to change because
// the vocabulary did:
//
//   input[type="checkbox"|"radio"|"range"], select
//        -> x-checkbox, x-radio, x-slider, x-select
//        The bare CSS selectors matched the page's filter radios and chrome,
//        never a demo. The x- tokens name the behaviors those controls are.
//   x-image -> x-img
//        x-image is registered nowhere in src/core/tag-map.js; it survives only
//        as a doc-comment alias in src/wb-viewmodels/semantics/img.js:5. x-img
//        is the real token, and the one the browse list offers.
const SWEEP = [
  'x-modal', 'x-drawer', 'x-audio',
  'x-tooltip', 'x-popover', 'x-confirm', 'x-prompt', 'x-lightbox',
  'x-stepper', 'x-masked', 'x-password',
  'x-gallery', 'x-img', 'x-youtube',
  'x-share', 'x-print', 'x-fullscreen', 'x-truncate', 'x-kbd', 'x-timeline',
  'x-checkbox', 'x-radio', 'x-slider', 'x-select',
];

test.describe('Behaviors page — remaining sections (sweep)', () => {
  for (const token of SWEEP) {
    test(`${token} renders its example and upgrades without error`, async ({ page }) => {
      await loadBrowse(page);
      await show(page, token);
      await expect(
        page.locator('#behaviors-live-example > *').first(),
        `${token} must render an example`,
      ).toBeAttached();
      await expect(errored(page), `${token} must not report x-error`).toHaveCount(0);
    });
  }
});

test.describe('Behaviors page — key interactions', () => {
  test('tooltip appears on hover', async ({ page }) => {
    await loadBrowse(page);
    await show(page, 'x-tooltip');
    await page.locator('#behaviors-live-example [x-tooltip]').first().hover();
    // .x-tooltip is the base class the behavior's own injected stylesheet keys
    // on for position/background/opacity — see src/wb-viewmodels/tooltip.js:21.
    // #858 found it being written as the literal string "[x-tooltip]", brackets
    // and all, so the tip rendered position:static with no styling whatsoever.
    const tip = page.locator('.x-tooltip').first();
    await expect(tip).toBeVisible();
    await expect(tip).not.toHaveText('');
  });

  test('modal opens from its trigger', async ({ page }) => {
    await loadBrowse(page);
    await show(page, 'x-modal');
    await page.locator('#behaviors-live-example [x-modal]').first().click();

    const dialog = page.locator('dialog.x-modal').first();
    await expect(dialog).toHaveAttribute('open', '');
    // NOT offsetParent: showModal() puts the dialog in the top layer, where it
    // is position:fixed and offsetParent is null for a perfectly open dialog.
    // The old test's offsetParent check is why it "passed" against the trigger
    // button while never looking at the dialog at all.
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width, 'an open modal has a real box').toBeGreaterThan(0);
    expect(box!.height, 'an open modal has a real box').toBeGreaterThan(0);
  });

  test('checkbox toggles', async ({ page }) => {
    // The x-switch example, not x-checkbox: x-switch builds a real
    // <input type="checkbox" class="x-switch__input"> inside its host, so this
    // is still exactly the original assertion — a checkbox that flips.
    // <div x-checkbox> renders an EMPTY div today; that is a genuine product
    // defect, filed separately, and not something to hide by weakening this.
    await loadBrowse(page);
    await show(page, 'x-switch');
    const host = page.locator('#behaviors-live-example [x-switch]').first();
    const box = page.locator('#behaviors-live-example input[type="checkbox"]').first();
    await expect(box).toBeAttached();
    const before = await box.isChecked();
    // Click the host: the input is the accessible state carrier and is
    // deliberately not the hit target — the track and thumb are painted over it.
    await host.click();
    await expect(box).toBeChecked({ checked: !before });
    await host.click();
    await expect(box).toBeChecked({ checked: before });
  });

  test('kbd renders key caps', async ({ page }) => {
    await loadBrowse(page);
    await show(page, 'x-kbd');
    // Auto-retrying, because the <kbd> caps are decorated by the kbd behavior
    // and the class can land a tick after the stage scan resolves.
    await expect(page.locator('#behaviors-live-example .x-kbd').first()).not.toHaveText('');
  });

  test('truncate clamps long text', async ({ page }) => {
    await loadBrowse(page);
    await show(page, 'x-truncate');
    const tr = page.locator('#behaviors-live-example [x-truncate]').first();
    await expect(tr).toBeAttached();
    // No test.skip() on count===0 any more. That skip is how this test went
    // silently dead for three days after #666 removed its target — show()
    // failing loudly is the point.
    const clamp = await tr.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.overflow}|${s.textOverflow}|${(s as any).webkitLineClamp}`;
    });
    expect(clamp).toMatch(/hidden|ellipsis|[1-9]/);
  });
});
