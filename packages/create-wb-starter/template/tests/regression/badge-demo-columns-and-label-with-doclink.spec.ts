import { test, expect, Page } from '@playwright/test';

/**
 * #617/#618/#619: John, live on docs/components/feedback/badge.md's "Color
 * Variants" section (screenshot, red annotation "What is this bullshit?") --
 * 6 <span x-badge> elements, a plain fenced ```html block auto-promoted by
 * mdhtml.js into a live <div x-demo> with no way to ever declare
 * `columns="..."` in markdown source, rendered as a single stacked column
 * with a huge empty gap, no visible label text, and a stray icon glued to
 * each badge.
 *
 * Three independent, compounding bugs, all in the same section:
 *
 * #617 (src/wb-viewmodels/demo.js): `configuredCols` defaulted to the
 * literal string '1' whenever no `columns` attribute existed, and
 * `Math.min(configuredCols, childCount)` then forced cols-1 regardless of
 * childCount -- correct for §7's single-item shrink-to-fit case, wrong for
 * an auto-promoted block that legitimately has several children and no
 * markdown syntax to ever declare `columns`. Fixed: only default to the
 * strict 1 when childCount <= 1 (or `columns` was explicitly declared);
 * otherwise default to 3.
 *
 * #618 (src/wb-viewmodels/feedback.js's badge()): "children win over label"
 * was implemented as `!element.textContent.trim()` -- but demo.js's own
 * doc-link 📖 icon (.x-demo__card-doc-link) is appended as hostEl's DOM
 * CHILD *before* badge() ever runs (attachInstanceDocLink in demo.js), so
 * every x-demo'd badge saw non-empty textContent from its OWN instrumentation
 * and silently dropped its real `label` -- confirmed live: every badge
 * rendered only "📖", no label text at all. Fixed: the emptiness check now
 * excludes the doc-link element specifically.
 *
 * #619 (src/styles/behaviors/demo.css): the doc-link icon's inset
 * top-right position (top:0.5rem, 1.5rem square) works for a card-sized
 * host with a free corner, but x-badge is short enough that the icon
 * (0.5rem + 1.5rem = 2rem tall) is taller than the badge itself and has
 * nowhere to sit except directly on top of the label text. Fixed:
 * `x-badge:has(> .x-demo__card-doc-link)` reserves 2.25rem of right
 * padding and re-centers the icon vertically instead of pinning it to the
 * top.
 */

const HARNESS = '/demos/test-harness.html';

async function inject(page: Page, html: string) {
  await page.goto(HARNESS);
  await page.waitForFunction(
    () => (window as any).WB && (window as any).WB.behaviors && Object.keys((window as any).WB.behaviors).length > 0,
    { timeout: 10000 }
  );
  await page.evaluate(async (h: string) => {
    const existing = document.getElementById('test-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'test-container';
    container.innerHTML = h;
    document.body.appendChild(container);
    await (window as any).WB.scan(container);
  }, html);
  await page.waitForSelector('#test-container x-demo .x-demo__grid', { timeout: 10000 });
}

test.describe('badge.md "Color Variants": undeclared multi-child x-demo (#617/#618/#619)', () => {
  const SIX_BADGES = `<div x-demo id="d">
    <span x-badge label="Default" variant="default"></span>
    <span x-badge label="Primary" variant="primary"></span>
    <span x-badge label="Success" variant="success"></span>
    <span x-badge label="Warning" variant="warning"></span>
    <span x-badge label="Error" variant="error"></span>
    <span x-badge label="Info" variant="info"></span>
  </div>`;

  test('#617: 6 children with no columns attribute no longer collapse to cols-1', async ({ page }) => {
    await inject(page, SIX_BADGES);
    const grid = page.locator('#d .x-demo__grid');
    await expect(grid).toHaveCount(1);
    const className = await grid.getAttribute('class');
    expect(className, 'undeclared 6-child grid must not stay at cols-1').not.toContain('cols-1');
  });

  test('#618: every badge still renders its label text alongside the doc-link icon', async ({ page }) => {
    await inject(page, SIX_BADGES);
    const badges = page.locator('#d x-badge');
    await expect(badges).toHaveCount(6);
    const labels = ['Default', 'Primary', 'Success', 'Warning', 'Error', 'Info'];
    for (let i = 0; i < labels.length; i++) {
      const text = await badges.nth(i).textContent();
      expect(text, `badge ${i} ("${labels[i]}") lost its label text`).toContain(labels[i]);
      // the doc-link icon must still be there too -- this isn't a regression
      // back to "no doc-link at all", both must coexist.
      await expect(badges.nth(i).locator('.x-demo__card-doc-link')).toHaveCount(1);
    }
  });

  test('#619: the doc-link icon does not visually overlap the label text', async ({ page }) => {
    await inject(page, SIX_BADGES);
    const badge = page.locator('#d x-badge').first();
    const icon = badge.locator('.x-demo__card-doc-link');
    await expect(icon).toHaveCount(1);

    const iconBox = await icon.boundingBox();
    expect(iconBox).toBeTruthy();

    // Measure the label's own text-node extent (excluding the icon) via a
    // Range around the badge's first (text) child -- simplest reliable way
    // to get the rendered width of just the label glyphs.
    const labelBox = await badge.evaluate((el) => {
      const textNode = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
      if (!textNode) return null;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const r = range.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
    expect(labelBox, 'badge has no label text node to measure').toBeTruthy();

    const horizontallyOverlaps = labelBox!.right > iconBox!.x;
    const verticallyOverlaps = labelBox!.bottom > iconBox!.y && labelBox!.top < iconBox!.y + iconBox!.height;
    expect(
      horizontallyOverlaps && verticallyOverlaps,
      `label text (right=${labelBox!.right}) overlaps the doc-link icon (x=${iconBox!.x})`
    ).toBe(false);
  });

  test('regression guard: a genuine single-item demo still shrinks to cols-1 (§7)', async ({ page }) => {
    await inject(page, `<div x-demo id="d"><span x-badge label="Solo" variant="primary"></span></div>`);
    const grid = page.locator('#d .x-demo__grid');
    const className = await grid.getAttribute('class');
    expect(className).toContain('cols-1');
  });

  test('regression guard: an explicit columns attribute is still honored over the new default', async ({ page }) => {
    await inject(
      page,
      `<div x-demo id="d" columns="2">
        <span x-badge label="A" variant="default"></span>
        <span x-badge label="B" variant="default"></span>
        <span x-badge label="C" variant="default"></span>
        <span x-badge label="D" variant="default"></span>
      </div>`
    );
    const grid = page.locator('#d .x-demo__grid');
    const className = await grid.getAttribute('class');
    expect(className).toContain('cols-2');
  });
});
