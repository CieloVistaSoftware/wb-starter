import { test, expect } from '@playwright/test';

/**
 * scripts/generate-site.mjs builds demo instances for every schema's matrix
 * combinations / enum variants / boolean toggles / defaults fallback as bare
 * `{tag, attrs}` pairs with NO children -- e.g. <wb-draggable
 * axis="both"></wb-draggable>. Most custom elements have no dedicated CSS
 * file giving them a default size (only a handful of behaviors -- avatar,
 * chip, card, etc. -- have their own .css), so an empty instance collapses
 * to offsetHeight:0 and is completely invisible despite being correctly
 * "enhanced" (the behavior DID apply its class -- confirmed live on the
 * deployed interactive.html: <wb-draggable class="wb-draggable
 * wb-draggable__handle" style="cursor:grab..."> with offsetHeight:0).
 * "It has the right class" is not proof it renders -- checked here directly
 * via bounding box, on the actual generated demos/site/interactive.html
 * page. Fixed by having every generation path populate a `children`
 * placeholder so the renderer never emits a bare self-closing-in-spirit tag.
 *
 * A single STATIC placeholder ("Dialog" for every <wb-dialog> regardless of
 * attrs) defeats the whole point of a demo just as badly as being invisible
 * -- four dialog triggers with title="Basic Dialog"/"Large"/"No
 * Close"/"Centered" all said "Dialog", indistinguishable at a glance
 * (confirmed live, user-reported). Fixed by deriving each instance's
 * placeholder text from its own attrs (e.g. "title=Large, size=lg").
 */
test.describe('Generated demo instances render visibly (interactive.html)', () => {
  test('every <wb-draggable> instance has non-zero size and real content', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/interactive.html');
    await page.waitForSelector('wb-draggable.wb-draggable', { timeout: 10_000 });

    const drags = page.locator('wb-draggable');
    const count = await drags.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const el = drags.nth(i);
      const box = await el.boundingBox();
      expect(box, `wb-draggable[${i}] should have a bounding box at all`).not.toBeNull();
      expect(box!.height, `wb-draggable[${i}] must not collapse to zero height`).toBeGreaterThan(0);
      const text = await el.evaluate((e) => e.textContent?.trim() ?? '');
      expect(text, `wb-draggable[${i}] must not be empty`).not.toBe('');
    }
  });

  test('no generated custom element on interactive.html has zero size', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/interactive.html');
    await page.waitForSelector('wb-demo', { timeout: 10_000 });
    await page.waitForTimeout(1000); // let eager scan finish enhancing everything

    const invisible = await page.evaluate(() => {
      // Only check elements generated INSIDE a <wb-demo> grid -- those are
      // the schema-auto-generated instances this bug affects. Hand-authored
      // manualSections content is exempt (it's real, deliberately-authored
      // markup, not a bare {tag, attrs} instance).
      const offenders: string[] = [];
      document.querySelectorAll('wb-demo [class*="wb-"]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0 && (el.textContent ?? '').trim() === '') {
          offenders.push(el.tagName.toLowerCase() + '#' + (el.id || '(no id)'));
        }
      });
      return offenders;
    });

    expect(invisible, `Zero-size, empty generated instances found: ${invisible.join(', ')}`).toEqual([]);
  });

  test('sibling dialog demos on overlays.html have distinct, self-describing labels', async ({ page }) => {
    await page.goto('http://localhost:3000/demos/site/overlays.html');
    await page.waitForSelector('wb-dialog.wb-dialog', { timeout: 10_000 });

    const labels = await page.locator('wb-dialog').evaluateAll((els) =>
      els.slice(0, 4).map((el) => el.textContent?.trim() ?? ''),
    );
    expect(new Set(labels).size, `dialog demo labels must be distinct: ${labels.join(' | ')}`).toBe(labels.length);
    for (const label of labels) {
      expect(label, 'dialog demo label must not be empty').not.toBe('');
    }
  });

  test('<wb-dialog variant="fullscreen"> actually applies the fullscreen class and size', async ({ page }) => {
    // dialog.schema.json declares variant (default/centered/fullscreen,
    // appliesClass: wb-dialog--{{value}}), but dialog.js never read it at
    // all -- every variant produced an identical, default-sized dialog
    // (confirmed live: clicking "Centered" or "Fullscreen" opened the exact
    // same dialog as "Basic Dialog").
    await page.goto('http://localhost:3000/demos/site/overlays.html');
    await page.waitForSelector('wb-dialog.wb-dialog', { timeout: 10_000 });

    const trigger = page.locator('wb-dialog[variant="fullscreen"]').first();
    await trigger.click();

    const box = page.locator('.wb-dialog:not(.wb-dialog-trigger)');
    await expect(box).toHaveClass(/wb-dialog--fullscreen/);
    const width = await box.evaluate((el) => el.getBoundingClientRect().width);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(width).toBeGreaterThan(viewportWidth * 0.9);
  });
});
