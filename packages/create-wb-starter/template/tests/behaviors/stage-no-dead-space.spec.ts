/**
 * ═══════════════════════════════════════════════════════════════════════════
 * The stage must not leave dead space around an example (#769)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John, on the fourth report of the same blank space: "having 10 lines of
 * space is stupid and proof our tests are shit."
 *
 * He is right. Three fixes shipped for this — grow-only sizing, overlay
 * handling, and finally a reset that existed on one of two render paths — and
 * every one was verified by reading code or by looking at the single example
 * it was written for. Nothing measured the box.
 *
 * The bug is a SEQUENCE bug: the stage grows for a tall example (a fullscreen
 * dialog), then a short one is selected and inherits the height. Looking at a
 * short example on its own never reproduces it, which is exactly why it
 * survived three attempts.
 *
 * So this test selects a tall example FIRST, then a short one, and measures.
 */

import { test, expect, Page } from '@playwright/test';

const TOLERANCE_PX = 140;   // stage padding + centring slack, generously

async function openPanel(page: Page) {
  await page.goto('/?page=behaviors');
  await page.waitForSelector('#behaviors-search', { timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.behaviors-search-results__row').length > 10,
    { timeout: 30000 },
  );
}

/** Click the row for a behavior/variant and wait for it to render. */
async function pick(page: Page, token: string, variant?: string) {
  const ok = await page.evaluate(({ t, v }) => {
    const rows = [...document.querySelectorAll('.behaviors-search-results__row')] as HTMLElement[];
    const row = rows.find((r) =>
      (r.dataset.browseToken || '').includes(t) &&
      (!v || (r.dataset.variant || '') === v));
    if (!row) return false;
    row.click();
    return true;
  }, { t: token, v: variant });
  expect(ok, `no row for ${token}${variant ? ' / ' + variant : ''}`).toBe(true);
  await page.waitForTimeout(700);
}

/** Height of the stage, and of what is actually rendered inside it. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const stage = document.getElementById('behaviors-live-stage');
    const example = document.getElementById('behaviors-live-example');
    const child = example?.firstElementChild as HTMLElement | null;
    return {
      stage: stage ? Math.round(stage.getBoundingClientRect().height) : 0,
      content: child ? Math.round(child.getBoundingClientRect().height) : 0,
      inlineMinHeight: stage ? stage.style.minHeight || '' : '',
    };
  });
}

test.describe('Live stage sizing', () => {
  test('a short example does not inherit a tall example\'s height', async ({ page }) => {
    await openPanel(page);

    // Tall first — this is what grows the stage.
    await pick(page, 'dialog', 'fullscreen');
    const tall = await measure(page);

    // Then short. Without the reset, this one keeps the height above.
    await pick(page, 'details');
    const short = await measure(page);

    expect(short.content, 'the short example rendered nothing to measure').toBeGreaterThan(0);
    expect(
      short.stage - short.content,
      `stage kept ${short.stage - short.content}px around a ${short.content}px example ` +
      `after a ${tall.stage}px one (inline min-height: "${short.inlineMinHeight}"). ` +
      `This is the sequence that produced four separate reports of dead space.`,
    ).toBeLessThan(TOLERANCE_PX);
  });

  test('selecting a short example directly leaves no dead space either', async ({ page }) => {
    await openPanel(page);
    await pick(page, 'details');
    const m = await measure(page);
    expect(m.content, 'nothing rendered').toBeGreaterThan(0);
    expect(
      m.stage - m.content,
      `stage is ${m.stage}px around a ${m.content}px example`,
    ).toBeLessThan(TOLERANCE_PX);
  });

  test('the panel shows an example on first load, not an empty stage', async ({ page }) => {
    // #771 -- John: "always pick the first element on the left when this page
    // is shown for the first time."
    await openPanel(page);
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => {
      const current = document.querySelector('[aria-current="true"]');
      const child = document.getElementById('behaviors-live-example')?.firstElementChild;
      return { hasSelection: !!current, hasRenderedExample: !!child };
    });
    expect(state.hasSelection, 'no row was selected on load').toBe(true);
    expect(state.hasRenderedExample, 'the stage was empty on load').toBe(true);
  });
});
