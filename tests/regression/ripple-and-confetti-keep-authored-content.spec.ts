import { test, expect } from '@playwright/test';

/**
 * #654 — `<wb-ripple>text</wb-ripple>` rendered NOTHING.
 * #655 — `<wb-confetti repeat>` never repeated, and lost its authored text.
 *
 * Shared root cause: `schema-builder.js`'s `processSchema()` wipes a
 * schema-built element's content before rebuilding `$view` (the mechanism
 * documented in #585). For these two tags that wipe was pure loss:
 *
 *   - ripple.schema.json's `$view` is a single `<span name="effect">` whose own
 *     description reads "created on click" -- it documents a RUNTIME element,
 *     not view content. So the author's children were destroyed and replaced by
 *     an empty, zero-size span: nothing to see, and no box to click. Meanwhile
 *     ripple() builds its own `span.wb-ripple__wave` per press and never reads
 *     `.wb-ripple__effect`.
 *   - confetti() substitutes its "Fire Confetti!" label only when the host is
 *     empty -- a correct guard the wipe defeated, since textContent was always
 *     empty by the time it ran.
 *
 * Both tags are now in SCHEMA_EXCLUDED_TAGS.
 *
 * Separately, #655: `repeat` was declared in confetti.schema.json and shipped
 * as an official example, but confetti() only ever read `count` and `label`.
 * The attribute was inert.
 */

test.describe('wb-ripple keeps its authored content and ripples (#654)', () => {
  test('<wb-ripple> renders its text, has a real box, and produces a wave', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('wb-ripple'), null, { timeout: 30000 });
    // Give WB.scan() time to attach the behavior.
    await page.waitForTimeout(1500);

    const result = await page.evaluate(async () => {
      const rp = document.querySelector('wb-ripple') as HTMLElement;
      const r = rp.getBoundingClientRect();
      // ripple() listens on mousedown, not click (#354).
      rp.dispatchEvent(
        new MouseEvent('mousedown', { clientX: r.x + 30, clientY: r.y + 20, bubbles: true })
      );
      await new Promise((res) => setTimeout(res, 120));
      const wave = rp.querySelector('.wb-ripple__wave') as HTMLElement | null;
      return {
        text: rp.textContent?.trim() ?? '',
        width: Math.round(r.width),
        height: Math.round(r.height),
        // The zero-size placeholder the schema used to inject.
        hasPlaceholder: !!rp.querySelector('.wb-ripple__effect'),
        waveCount: rp.querySelectorAll('.wb-ripple__wave').length,
        // Measure the wave's own declared size, not its animated rect --
        // CSS animations are frozen in a backgrounded tab.
        waveWidth: wave ? Math.round(parseFloat(wave.style.width)) : 0,
      };
    });

    expect(result.text, 'authored text must survive the schema pass').toContain('example ripple content');
    expect(result.hasPlaceholder, 'runtime-only $view placeholder must not be injected').toBe(false);
    expect(result.width, '<wb-ripple> must have a real width, not collapse to 0').toBeGreaterThan(50);
    expect(result.height).toBeGreaterThan(0);
    expect(result.waveCount, 'a press must produce a ripple wave').toBe(1);
    expect(result.waveWidth, 'the wave must be sized to cover the host').toBeGreaterThan(50);
  });
});

test.describe('wb-confetti honours repeat and keeps authored content (#655)', () => {
  test('<wb-confetti repeat> fires more than once unattended, and stops cleanly', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).WB, null, { timeout: 30000 });

    const result = await page.evaluate(async () => {
      const host = document.createElement('div');
      host.innerHTML =
        '<wb-confetti repeat duration="600ms">This is example confetti content.</wb-confetti>';
      document.body.appendChild(host);
      const el = host.querySelector('wb-confetti') as HTMLElement & { wbConfetti?: any };
      await (window as any).WB.inject(el, 'confetti');

      const count = () => document.querySelectorAll('.wb-confetti-container').length;
      const base = count();
      await new Promise((r) => setTimeout(r, 3000));
      const bursts = count() - base;

      el.wbConfetti.stopRepeat();
      const afterStop = count();
      await new Promise((r) => setTimeout(r, 1500));
      const afterWait = count();

      const text = el.textContent?.trim() ?? '';
      host.remove();
      document.querySelectorAll('.wb-confetti-container').forEach((c) => c.remove());
      return { bursts, text, afterStop, afterWait };
    });

    // Without the fix `repeat` was inert and fire() only ran on click, so this
    // count is exactly 0.
    expect(result.bursts, 'repeat must fire the burst unattended, more than once').toBeGreaterThan(1);
    expect(result.text, 'authored text must survive the schema pass').toContain('example confetti content');
    // A leaked interval here would keep appending fixed-position containers to
    // <body> for the life of the page.
    expect(result.afterWait, 'stopRepeat() must halt the loop').toBeLessThanOrEqual(result.afterStop);
  });
});
