import { test, expect } from '../fixtures/offline';

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
 * #655 also wired up confetti's `repeat`; it has since been removed (a burst
 * every 3s with no way to stop it), so the test now pins that it stays inert.
 */

test.describe('[x-ripple] keeps its authored content and ripples (#654)', () => {
  test('<div x-ripple> renders its text, has a real box, and produces a wave', async ({ page }) => {
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!document.querySelector('[x-ripple]'), null, { timeout: 30000 });
    // The behavior is attached once WB settles (#1516: not 1500ms).
    await page.waitForFunction(() => typeof (window as any).WB?.settled === 'function', null, { timeout: 15000 });
    await page.evaluate(() => (window as any).WB.settled({ timeout: 15000 }));

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

test.describe('[x-confetti] keeps authored content and never fires unattended (#655)', () => {
  test('<div x-confetti> keeps its text; a leftover repeat attribute does nothing', async ({ page }) => {
    // The removed `repeat` looped on a 3s timer; the page's clock is driven
    // from here (#1516) so "no burst on its own" covers that window exactly.
    await page.clock.install();
    await page.goto('/demos/site/effects.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!(window as any).WB, null, { timeout: 30000 });

    await page.evaluate(async () => {
      const host = document.createElement('div');
      // `repeat` was removed: it looped a burst every 3s with no way to stop
      // it from the page. Markup that still carries it must stay inert.
      host.innerHTML =
        '<div x-confetti repeat duration="600ms">This is example confetti content.</div>';
      document.body.appendChild(host);
      const el = host.querySelector('[x-confetti]') as HTMLElement & { wbConfetti?: any };
      await (window as any).WB.inject(el, 'confetti');

      (window as any).__confetti = { host, el, base: document.querySelectorAll('.x-confetti-container').length };
    });
    await page.clock.runFor(3500);
    const result = await page.evaluate(() => {
      const { host, el, base } = (window as any).__confetti;
      const count = () => document.querySelectorAll('.x-confetti-container').length;
      const unattended = count() - base;
      el.click();
      const afterClick = count() - base;

      const text = el.textContent?.trim() ?? '';
      host.remove();
      document.querySelectorAll('.x-confetti-container').forEach((c) => c.remove());
      return { unattended, afterClick, text };
    });

    expect(result.unattended, 'confetti must never fire on its own').toBe(0);
    expect(result.afterClick, 'a click still fires one burst').toBe(1);
    expect(result.text, 'authored text must survive the schema pass').toContain('example confetti content');
  });
});
