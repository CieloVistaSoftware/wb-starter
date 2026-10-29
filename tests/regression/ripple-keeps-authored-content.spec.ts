import { test, expect } from '../fixtures/offline';

import { settlePage } from '../base';
/**
 * #654 — `<div x-ripple>text</div>` rendered NOTHING.
 * #655 — `<div x-confetti>` lost its authored text.
 *
 * Shared root cause: `schema-builder.js`'s `processSchema()` wipes a
 * schema-built element's content before rebuilding `$view` (the mechanism
 * documented in #585). For these two tags that wipe was pure loss:
 *
 *   - ripple.schema.json's `$view` is a single `<span name="effect">` whose own
 *     description reads "created on click" -- it documents a RUNTIME element,
 *     not view content. So the author's children were destroyed and replaced by
 *     an empty, zero-size span: nothing to see, and no box to click. Meanwhile
 *     ripple() builds its own `span.x-ripple__wave` per press and never reads
 *     `.x-ripple__effect`.
 *   - confetti() substitutes its "Fire Confetti!" label only when the host is
 *     empty -- a correct guard the wipe defeated, since textContent was always
 *     empty by the time it ran.
 *
 * Both tags are now in SCHEMA_EXCLUDED_TAGS.
 *
 * The x-confetti half moved to WB Pro (#1953) with the behavior.
 */

test.describe('[x-ripple] keeps its authored content and ripples (#654)', () => {
  test('<div x-ripple> renders its text, has a real box, and produces a wave', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('[x-ripple]'), null, { timeout: 30000 });
    // The behavior is attached once WB settles (#1516: not 1500ms).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await settlePage(page, { timeout: 15000 });

    const result = await page.evaluate(async () => {
      const rp = document.querySelector('[x-ripple]') as HTMLElement;
      const r = rp.getBoundingClientRect();
      // ripple() listens on mousedown, not click (#354).
      rp.dispatchEvent(
        new MouseEvent('mousedown', { clientX: r.x + 30, clientY: r.y + 20, bubbles: true })
      );
      // The wave exists once mousedown has run its handler (#1516: not 120ms).
      const until = async (ok: () => boolean, ms = 5000) => { const end = performance.now() + ms; while (!ok() && performance.now() < end) await new Promise((r) => requestAnimationFrame(r)); };
      await until(() => !!rp.querySelector('.x-ripple__wave'));
      const wave = rp.querySelector('.x-ripple__wave') as HTMLElement | null;
      return {
        text: rp.textContent?.trim() ?? '',
        width: Math.round(r.width),
        height: Math.round(r.height),
        // The zero-size placeholder the schema used to inject.
        hasPlaceholder: !!rp.querySelector('.x-ripple__effect'),
        waveCount: rp.querySelectorAll('.x-ripple__wave').length,
        // Measure the wave's own declared size, not its animated rect --
        // CSS animations are frozen in a backgrounded tab. Computed width, not
        // wave.style: #779 moved the size into a generated stylesheet rule,
        // and the computed width ignores the scale() transform just as the
        // declared one did.
        waveWidth: wave ? Math.round(parseFloat(getComputedStyle(wave).width)) : 0,
      };
    });

    expect(result.text, 'authored text must survive the schema pass').toContain('example ripple content');
    expect(result.hasPlaceholder, 'runtime-only $view placeholder must not be injected').toBe(false);
    expect(result.width, '<div x-ripple> must have a real width, not collapse to 0').toBeGreaterThan(50);
    expect(result.height).toBeGreaterThan(0);
    expect(result.waveCount, 'a press must produce a ripple wave').toBe(1);
    expect(result.waveWidth, 'the wave must be sized to cover the host').toBeGreaterThan(50);
  });
});
