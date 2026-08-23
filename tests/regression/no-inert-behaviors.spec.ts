/**
 * ═══════════════════════════════════════════════════════════════════════════
 * No registered behavior is inert (#781)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A behavior can be registered in tag-map.js, documented, and listed in the
 * showcase while doing nothing at all. Every symptom looks healthy: the
 * attribute is recognised, the module loads, the docs describe it. Only the
 * rendered result is wrong.
 *
 * That has been found five separate times, each by a person noticing something
 * looked off in a screenshot:
 *
 *   x-demo    (#770)  registered, builds nothing — demo() reads _rawSource from
 *                     connectedCallback, which a plain <div> never fires
 *   x-glow            .wb-glow exists in CSS, no attribute routes to it
 *   x-input   (#754)  variants and sizes declared and inert
 *   x-button  (#746)  actively SUPPRESSED the button behavior for 3 releases
 *   #772              260 selectors matched only the wb-* tag, so attribute
 *                     authoring ran the behavior and rendered unstyled
 *
 * Finding these one screenshot at a time does not scale to 167 behaviors.
 *
 * WHAT "NOT INERT" MEANS HERE
 *
 * The bar is deliberately low: applying the attribute must change SOMETHING a
 * person could see, versus the identical host without it. Any one of:
 *
 *   - a class the behavior added
 *   - a child element it built
 *   - a computed style that differs
 *   - an attribute it set (role, aria-*, tabindex)
 *
 * A behavior that clears all four bars can still be wrong; one that clears none
 * is doing nothing, which is the failure this catches.
 *
 * WHY BOTH HOSTS ARE MEASURED
 *
 * Comparing against a bare <div> rendered in the same page — not against a
 * remembered snapshot — so page-level styles affecting every div cancel out and
 * only the behavior's own contribution is left.
 */

import { test, expect } from '@playwright/test';

/**
 * Behaviors that legitimately need something this harness cannot give them.
 * Each needs a REASON, not just a name — an allowlist without reasons becomes a
 * place to hide failures.
 */
const EXPECTED_INERT: Record<string, string> = {
  // Needs a live server route and a document to fetch; renders nothing without.
  'x-mdhtml': 'renders fetched markdown; nothing to render with no source',
};

/** Content that gives a behavior something to work with. */
const HOST_HTML = '<span>Example content</span>';

test.describe('Registered behaviors do something', () => {
  test('every x- attribute changes the element it is applied to', async ({ page }) => {
    test.setTimeout(900_000);
    // 106 behaviors, each lazy-loading its own module on first use. The first
    // run took >5 minutes and hit the old 300s ceiling — that was this test
    // being slow, not a finding about the code.

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto('/');
    await page.waitForFunction(() => !!(window as any).WB, { timeout: 30_000 });

    const result = await page.evaluate(async ({ hostHtml }) => {
      const WB = (window as any).WB;
      const mod = await import('/src/core/tag-map.js');
      const extensionMap: Record<string, string> = mod.extensionMap;

      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px';
      document.body.appendChild(box);

      /** Everything about an element a reader could notice. */
      const fingerprint = (el: Element) => ({
        classes: [...el.classList].sort().join(' '),
        childCount: el.children.length,
        childTags: [...el.children].map((c) => c.tagName).join(','),
        attrs: [...el.attributes]
          .map((a) => a.name)
          .filter((n) => n !== 'style' && !n.startsWith('x-'))
          .sort()
          .join(','),
        style: (() => {
          const cs = getComputedStyle(el);
          return [
            'display', 'position', 'background-color', 'color', 'border-top-width',
            'border-radius', 'padding-top', 'box-shadow', 'cursor', 'width', 'height',
          ].map((p) => cs.getPropertyValue(p)).join('|');
        })(),
      });

      const inert: string[] = [];
      const failed: string[] = [];
      let checked = 0;

      for (const attr of Object.keys(extensionMap)) {
        // Two identical hosts, same page, same styles — only one gets the attribute.
        const control = document.createElement('div');
        control.innerHTML = hostHtml;
        const subject = document.createElement('div');
        subject.innerHTML = hostHtml;
        subject.setAttribute(attr, '');
        box.append(control, subject);

        try {
          await WB.scan(subject, { eager: true });
          // Wait for the behavior to actually apply, not just for a frame.
          //
          // A previous version waited one requestAnimationFrame, on the theory
          // that the fixed 30ms delay was pure waste. It was not: behaviors
          // LAZY-LOAD their module, and the dynamic import takes longer than a
          // frame. The sweep then measured before the behavior had run and
          // reported 26 working behaviors as inert — x-fill, x-badge and
          // x-sticky among them, all three verified applying their classes when
          // probed directly.
          //
          // Poll for a change instead of guessing a duration: it returns as soon
          // as the behavior lands, so the common case stays fast, and only a
          // genuinely inert behavior pays the full timeout.
          const settled = async () => {
            for (let tick = 0; tick < 40; tick++) {
              await new Promise((r) => setTimeout(r, 25));
              if (subject.className || subject.children.length !== control.children.length
                  || subject.attributes.length > 1) return;
            }
          };
          await settled();
        } catch (err) {
          failed[failed.length] = `${attr}: threw during scan — ${(err as Error).message}`;
          control.remove();
          subject.remove();
          continue;
        }

        const a = fingerprint(control);
        const b = fingerprint(subject);
        const changed =
          a.classes !== b.classes ||
          a.childCount !== b.childCount ||
          a.childTags !== b.childTags ||
          a.attrs !== b.attrs ||
          a.style !== b.style;

        if (!changed) inert.push(attr);
        checked++;

        control.remove();
        subject.remove();
      }

      box.remove();
      return { inert, failed, checked, total: Object.keys(extensionMap).length };
    }, { hostHtml: HOST_HTML });

    expect(result.checked, 'nothing was checked — the sweep would pass vacuously')
      .toBeGreaterThan(50);

    // A behavior that throws is a separate, louder problem than one that is
    // merely inert; report it on its own so it is not read as "does nothing".
    expect(
      result.failed,
      `${result.failed.length} behavior(s) threw while being applied:\n  ` +
      result.failed.join('\n  '),
    ).toEqual([]);

    const unexpected = result.inert.filter((a) => !(a in EXPECTED_INERT));

    expect(
      unexpected,
      `${unexpected.length} of ${result.checked} registered behaviors changed NOTHING ` +
      `about the element they were applied to — no class, no child, no attribute, ` +
      `no computed style. They are listed in the showcase and documented, and a ` +
      `reader copying them gets markup that does nothing:\n  ` +
      unexpected.join('\n  '),
    ).toEqual([]);
  });
});
