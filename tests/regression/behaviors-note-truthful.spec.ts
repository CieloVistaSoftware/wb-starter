/**
 * THE LIVE NOTE MUST DESCRIBE WHAT IS ON SCREEN
 * =============================================
 * #994 — John, on `x-avatar · shape=circle` reading "shows a indigo
 * background" over a photograph: "This is a lie."
 *
 * True of the CSS, false to the eye. The avatar's box really is rgb(38,38,217)
 * — the fallback colour behind the initials — but a child <img> filled it
 * exactly, so none of it was visible. Measured on the deployed site: box
 * 56x56, img 56x56, background-image: none.
 *
 * WHY THIS TEST IS SHAPED THIS WAY. The first version drove the page: filter,
 * click the row, read the note. It passed — and it ALSO passed with the bug
 * deliberately reintroduced, because locally the demo image is letterboxed
 * (56x35, ratio 0.63) so the occlusion branch never ran, and the page rebuilds
 * its example on every selection, resetting any geometry the test set up. A
 * guard that cannot fail is not a guard. The logic now lives in
 * src/wb-viewmodels/live-note.js and is exercised directly against DOM this
 * test controls, including the exact geometry John saw.
 */

import { test, expect } from '@playwright/test';

test.describe('live note describes what is visible (#994)', () => {
  test('a background hidden behind a covering child is not described', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await page.evaluate(async () => {
      const m = await import('/src/wb-viewmodels/live-note.js');
      const isOpaque = (v) => {
        const n = String(v).match(/[\d.]+/g)?.map(Number) ?? [];
        return n.length > 0 && (n.length < 4 || n[3] > 0.85);
      };
      const mk = (inner) => {
        const d = document.createElement('div');
        d.style.cssText =
          'position:fixed;left:-9999px;top:0;width:56px;height:56px;background:rgb(38,38,217)';
        d.innerHTML = inner;
        document.body.appendChild(d);
        return d;
      };

      const cases = {
        // Exactly what John saw: a square photo filling the box.
        squarePhotoCoversBox: mk('<img style="width:56px;height:56px;display:block">'),
        // Local geometry: letterboxed, so the indigo IS visible and describing it is correct.
        letterboxedImage: mk('<img style="width:56px;height:35px;display:block">'),
        // A child painting its own opaque colour across the box.
        opaqueChildDiv: mk('<div style="width:56px;height:56px;background:rgb(10,10,10)"></div>'),
        // Nothing on top: the background is genuinely what you see.
        bareBox: mk(''),
      };

      const out = {};
      for (const [name, el] of Object.entries(cases)) {
        const covered = m.occludingChild(el, isOpaque);
        out[name] = { covered, text: m.describeCover(covered) };
        el.remove();
      }
      return out;
    });

    // The defect: an indigo box under a covering photo must NOT be called a background.
    expect(
      results.squarePhotoCoversBox.covered,
      'a square photo filling the box must be recognised as covering it — the exact case John reported'
    ).toBe('img');
    expect(results.squarePhotoCoversBox.text).toBe('shows an image');

    // The other side: when the background really is visible, still describe it.
    expect(
      results.letterboxedImage.covered,
      'a letterboxed image leaves the background visible, so it must NOT count as covering'
    ).toBeNull();
    expect(results.bareBox.covered).toBeNull();

    expect(results.opaqueChildDiv.covered).toBe('covered');
  });

  test('a vowel-initial colour reads "an", never "a"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const phrases = await page.evaluate(async () => {
      const m = await import('/src/wb-viewmodels/live-note.js');
      return {
        indigo: m.shows('indigo', 'background'),
        orange: m.shows('orange', 'background'),
        amber: m.shows('amber', 'border'),
        grey: m.shows('grey', 'background'),
        dark: m.shows('dark', 'background'),
      };
    });

    expect(phrases.indigo).toBe('shows an indigo background');
    expect(phrases.orange).toBe('shows an orange background');
    expect(phrases.amber).toBe('shows an amber border');
    // Consonants must keep "a" — the fix must not over-correct.
    expect(phrases.grey).toBe('shows a grey background');
    expect(phrases.dark).toBe('shows a dark background');
  });

  test('the behaviors page can load the module it depends on', async ({ page }) => {
    // Guards the wiring, not the logic: if the import path breaks, the page
    // silently falls back to its stubs and this fix stops applying at all.
    await page.goto('/?page=behaviors', { waitUntil: 'domcontentloaded' });
    const loaded = await page.evaluate(async () => {
      const r = await fetch('/src/wb-viewmodels/live-note.js');
      return { ok: r.ok, status: r.status };
    });
    expect(loaded.ok, `live-note.js must be served (got ${loaded.status})`).toBe(true);
  });
});
