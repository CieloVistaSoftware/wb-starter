import { test, expect } from '@playwright/test';
import { globSync } from 'glob';

/**
 * COMPLIANCE GATE: every rendered x-alert (x-alert) must keep DEMOS-AND-
 * DOCS-STANDARDS.md §13's >=1rem text-edge padding, and >=1rem vertical gap
 * between sibling alerts stacked in the same container.
 *
 * Known offender at time of writing: src/styles/behaviors/alert.css's
 * `.x-alert { padding: 0.75rem 1rem; }` -- top/bottom padding is 0.75rem
 * (12px), 4px under the 1rem (16px) minimum. Left/right (1rem) already
 * complies. This test is deliberately per-side so a partial fix (e.g. only
 * widening left/right) doesn't silently pass.
 */

const FILES = [
  ...globSync('demos/**/*.html', { cwd: process.cwd() }),
  ...globSync('pages/**/*.html', { cwd: process.cwd() }),
].sort();

const MIN_PADDING_PX = 15; // ~1rem at the default 16px root, with a little slack for rounding
const MIN_GAP_PX = 15;

test.describe('x-alert (x-alert) keeps >=1rem text-edge padding and inter-alert gap (§13)', () => {
  for (const file of FILES) {
    test(`${file}: x-alert padding and gaps`, async ({ page }) => {
      const urlPath = '/' + file.replace(/\\/g, '/');
      await page.goto(urlPath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const result = await page.evaluate(({ minPad, minGap }) => {
        const alerts = Array.from(
          document.querySelectorAll('.x-alert, x-alert, [x-alert]')
        ) as HTMLElement[];
        if (alerts.length === 0) return { skip: true, paddingViolations: [], gapViolations: [] };

        const paddingViolations: string[] = [];
        alerts.forEach((el, i) => {
          const cs = getComputedStyle(el);
          const sides: Array<[string, number]> = [
            ['top', parseFloat(cs.paddingTop)],
            ['right', parseFloat(cs.paddingRight)],
            ['bottom', parseFloat(cs.paddingBottom)],
            ['left', parseFloat(cs.paddingLeft)],
          ];
          for (const [side, val] of sides) {
            if (val < minPad) {
              paddingViolations.push(
                `alert #${i} (${el.className || el.tagName}): padding-${side} is ${val}px, needs >=${minPad}px`
              );
            }
          }
        });

        // Gap between vertically-stacked sibling alerts sharing a parent --
        // via the parent's own `gap` (flex/grid) if set, else the measured
        // visual distance between consecutive alerts' boxes.
        const gapViolations: string[] = [];
        const byParent = new Map<Element, HTMLElement[]>();
        for (const el of alerts) {
          if (!el.parentElement) continue;
          const list = byParent.get(el.parentElement) || [];
          list.push(el);
          byParent.set(el.parentElement, list);
        }
        for (const [parent, siblings] of byParent) {
          if (siblings.length < 2) continue;
          const parentCs = getComputedStyle(parent);
          const declaredGap = parseFloat(parentCs.rowGap || parentCs.gap || '0');
          siblings.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
          for (let i = 1; i < siblings.length; i++) {
            const prevRect = siblings[i - 1].getBoundingClientRect();
            const curRect = siblings[i].getBoundingClientRect();
            const visualGap = curRect.top - prevRect.bottom;
            const effectiveGap = declaredGap > 0 ? declaredGap : visualGap;
            if (effectiveGap < minGap) {
              gapViolations.push(
                `alerts #${i - 1}->#${i} under the same parent: gap is ${Math.round(effectiveGap)}px, needs >=${minGap}px`
              );
            }
          }
        }

        return { skip: false, paddingViolations, gapViolations };
      }, { minPad: MIN_PADDING_PX, minGap: MIN_GAP_PX });

      test.skip(result.skip, `${file} has no x-alert elements`);

      expect(
        result.paddingViolations,
        `${file}: x-alert padding violation(s):\n  ` + result.paddingViolations.join('\n  ')
      ).toEqual([]);
      expect(
        result.gapViolations,
        `${file}: x-alert gap violation(s):\n  ` + result.gapViolations.join('\n  ')
      ).toEqual([]);
    });
  }
});
