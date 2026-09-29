/**
 * EVERY DIALOG SIZE OPENS AT A DIFFERENT WIDTH
 * ============================================
 * John: "none of the sizes are working on the dialog ... this is a regression."
 *
 * Measured on the behaviors page: size=sm, md, lg, xl and full all opened at the
 * same 522px. dialog.schema.json declares `size` -> `x-dialog--{{value}}`, but:
 *
 *   - an authored <dialog size="…"> (the markup the page generates since the
 *     dialog demos became button + <dialog> pairs) never read `size` at all;
 *   - dialog.css had no `x-dialog--{size}` rule for the class to hit;
 *   - only the x-dialog-on-a-trigger path sized itself, with an inline
 *     max-width that had no `full` entry.
 *
 * So both paths are measured here, plus the rows a reader actually clicks.
 */
import { test, expect, Page } from '../fixtures/offline';

const SIZES = ['sm', 'md', 'lg', 'xl', 'full'] as const;

/** Build `markup` with the lazy runtime eagerly, the way the other harness specs do. */
async function build(page: Page, markup: string) {
  await page.setContent(markup);
  await page.addScriptTag({
    type: 'module',
    content: `
      import WB from '/src/core/wb-lazy.js';
      window.WB = WB;
      await WB.init({ autoInject: true });
      await WB.scan(document.body, { eager: true });
      document.body.dataset.built = '1';
    `,
  });
  await page.waitForFunction(() => document.body.dataset.built === '1');
}

/** Open the modal `open()` shows and return its rendered width. */
async function openedWidth(page: Page, open: () => Promise<void>) {
  await open();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  // offsetWidth, not boundingBox: the open animation scales the box for 0.3s,
  // and a transform mid-flight is not the size the dialog was given.
  const width = await dialog.evaluate((d) => (d as HTMLElement).offsetWidth);
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach((d) => (d as HTMLDialogElement).close()));
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  return width;
}

function expectStrictlyWider(widths: Record<string, number>) {
  for (let i = 1; i < SIZES.length; i++) {
    const [smaller, larger] = [SIZES[i - 1], SIZES[i]];
    expect(widths[larger], `size=${larger} (${widths[larger]}px) must be wider than size=${smaller} (${widths[smaller]}px) — all: ${JSON.stringify(widths)}`)
      .toBeGreaterThan(widths[smaller] + 10);
  }
}

test.use({ viewport: { width: 1400, height: 900 } });

test('authored <dialog size="…">: every size opens at its own width', async ({ page }) => {
  await page.goto('/');
  await build(page, SIZES.map((s) => `
    <dialog id="d-${s}" x-dialog size="${s}"><h2>Delete branch?</h2><p>Short body.</p></dialog>`).join(''));
  const widths: Record<string, number> = {};
  for (const s of SIZES) {
    widths[s] = await openedWidth(page, () => page.evaluate((id) => (document.getElementById(id) as HTMLDialogElement).showModal(), `d-${s}`));
  }
  expectStrictlyWider(widths);
});

test('<button x-dialog size="…">: every size opens at its own width', async ({ page }) => {
  await page.goto('/');
  await build(page, SIZES.map((s) => `
    <button id="b-${s}" x-dialog title="Delete branch?" content="Short body." size="${s}">Open ${s}</button>`).join(''));
  const widths: Record<string, number> = {};
  for (const s of SIZES) {
    widths[s] = await openedWidth(page, () => page.locator(`#b-${s}`).click());
  }
  expectStrictlyWider(widths);
});

for (const label of ['dialog', 'x-dialog']) {
  test(`behaviors page: the ${label} size=… rows open at different widths`, async ({ page }) => {
    await page.goto('/?page=behaviors');
    const rows = page.locator(`.behaviors-search-results__row[data-label="${label}"][data-prop="size"]`);
    await expect(rows.first()).toBeAttached({ timeout: 30_000 });
    const group = page.locator('#behaviors-search-results details', { has: rows.first() });
    if (!(await group.first().evaluate((d) => (d as HTMLDetailsElement).open))) {
      await group.first().locator(':scope > summary').click();
    }

    const widths: Record<string, number> = {};
    for (const s of SIZES) {
      const before = await page.evaluate(() => document.getElementById('behaviors-live-example')?.innerHTML ?? '');
      await rows.and(page.locator(`[data-variant="${s}"]`)).first().click();
      await page.waitForFunction((prev) => {
        const ex = document.getElementById('behaviors-live-example');
        return !!ex && ex.innerHTML !== prev && !!ex.querySelector('[x-ready]');
      }, before);
      // The example is a trigger: whatever opens the dialog is the first button.
      widths[s] = await openedWidth(page, () => page.locator('#behaviors-live-example button').first().click());
    }
    expectStrictlyWider(widths);
  });
}
