import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Inline-style audit across every behavior (#779, #790)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The standard is unqualified: NO INLINE STYLES ANYWHERE. There is currently
 * no gate for it, which is how the codebase reached 1,282 style writes in
 * src/ -- nothing scans JS for style writes and nothing scans HTML for style=.
 *
 * John: "we need to write a unit test that tests all of our behaviors for
 * inline styles, and creates an audit. that report will determine our plans
 * for removing all of the styles."
 *
 * WHY A COUNT IS NOT ENOUGH
 *
 * card.js is the worked example. It writes STYLE_HEADER / STYLE_MAIN / etc.
 * inline onto elements that ALREADY carry .x-card__header / .x-card__main,
 * and card.css ALREADY defines those exact rules with identical values --
 * migrated in #370, whose comments claim "now that the inline version is
 * gone". It was not gone. Those stylesheet rules have been dead ever since,
 * because an inline declaration beats every rule regardless of specificity.
 *
 * Removing that inline is therefore a DELETION with no CSS to write.
 * Elsewhere the inline is the only source of the value, and deleting it would
 * change the rendering. Those are completely different jobs, and a report that
 * cannot tell them apart cannot be planned against.
 *
 * HOW EACH DECLARATION IS CLASSIFIED
 *
 * Empirically, by measuring -- not by reading source. For every inline
 * property on every element a behavior produces:
 *
 *   1. record the computed value WITH the inline declaration
 *   2. remove that one declaration
 *   3. record the computed value again
 *
 *   same value  -> COVERED    a stylesheet already supplies it. Safe to
 *                             delete; no CSS to author. (the card case)
 *   different   -> UNCOVERED  the inline is the only source. A rule must be
 *                             written before it can be removed.
 *
 * UNCOVERED is then split again: a value that differs between two builds of
 * the SAME behavior is computed at runtime (a measured height, a drag offset,
 * a percentage) and wants a CSS custom property, not a static rule. That is a
 * third kind of work, and it is the one most likely to be got wrong by a
 * blanket find-and-replace.
 *
 * OUTPUT
 *
 * data/inline-style-audit.json -- per behavior, per element, per property,
 * with its classification. That file is the removal plan.
 */

/** Ratchet. Unset (-1) on the first run, because the number is what is being
 *  measured. Set it afterwards so the count can only fall: the standard is no
 *  inline styles anywhere, so this may go down and never up. */
const BASELINE_DECLARATIONS = Number(process.env.WB_INLINE_BASELINE ?? -1);

type Classification = 'COVERED' | 'UNCOVERED' | 'DYNAMIC';
type Decl = { prop: string; value: string; classification: Classification };
type ElementReport = { path: string; classes: string; declarations: Decl[] };
type BehaviorReport = { behavior: string; elements: ElementReport[]; total: number };

test.describe('Inline styles across all behaviors (#779)', () => {
  test('audit every behavior and write the removal plan', async ({ page }) => {
    test.setTimeout(900_000);

    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).WB), { timeout: 30_000 });

    const reports: BehaviorReport[] = await page.evaluate(async () => {
      const WB = (window as any).WB;
      const mod = await import('/src/core/tag-map.js');
      const attrs: string[] = Object.keys(mod.extensionMap);

      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px';
      document.body.appendChild(box);

      const build = async (attr: string) => {
        const host = document.createElement('div');
        host.innerHTML = '<span>Example content</span>';
        host.setAttribute(attr, '');
        box.appendChild(host);
        await WB.scan(host, { eager: true });
        // Poll for the behavior to land. Behaviors lazy-load their module, so a
        // fixed wait measures before it has run -- the mistake that produced 26
        // false positives on #781.
        for (let t = 0; t < 40; t++) {
          await new Promise((r) => setTimeout(r, 25));
          if (host.className || host.children.length !== 1 || host.querySelector('[style]')) break;
        }
        return host;
      };

      /** Readable path to an element inside the host, so the report says WHERE. */
      const pathOf = (root: Element, el: Element): string => {
        const parts: string[] = [];
        let cur: Element | null = el;
        while (cur && cur !== root) {
          const parent: Element | null = cur.parentElement;
          const idx = parent ? Array.prototype.indexOf.call(parent.children, cur) : 0;
          parts.unshift(cur.tagName.toLowerCase() + '[' + idx + ']');
          cur = parent;
        }
        return parts.length ? parts.join(' > ') : ':host';
      };

      const out: any[] = [];

      for (const attr of attrs) {
        let host: HTMLElement;
        try {
          host = await build(attr);
        } catch {
          continue;
        }

        const styled = [host, ...Array.from(host.querySelectorAll('[style]'))]
          .filter((el) => el instanceof HTMLElement && el.getAttribute('style')) as HTMLElement[];

        const elements: any[] = [];

        for (const el of styled) {
          const declarations: any[] = [];
          const props = Array.from(el.style);

          for (const prop of props) {
            const value = el.style.getPropertyValue(prop);
            const priority = el.style.getPropertyPriority(prop);
            const before = getComputedStyle(el).getPropertyValue(prop);

            // Remove this one declaration and see whether a stylesheet supplies
            // the same value. This comparison is the whole point of the audit.
            el.style.removeProperty(prop);
            const after = getComputedStyle(el).getPropertyValue(prop);
            // Restore, so later properties are measured in the real context.
            el.style.setProperty(prop, value, priority);

            declarations.push({
              prop,
              value,
              classification: before === after ? 'COVERED' : 'UNCOVERED',
            });
          }

          if (declarations.length) {
            elements.push({
              path: pathOf(host, el),
              classes: Array.from(el.classList).join(' '),
              declarations,
            });
          }
        }

        if (elements.length) {
          out.push({
            behavior: attr,
            elements,
            total: elements.reduce((n: number, e: any) => n + e.declarations.length, 0),
          });
        }

        host.remove();
      }

      box.remove();
      return out;
    });

    // ── Second pass: which UNCOVERED values are DYNAMIC? ────────────────────
    // The same behavior built twice yields the same STATIC styles. A value that
    // differs between builds is computed, and wants a custom property rather
    // than a static rule.
    const secondRun: Record<string, Record<string, string>> = await page.evaluate(
      async (behaviors: string[]) => {
        const WB = (window as any).WB;
        const box = document.createElement('div');
        // Deliberately a DIFFERENT width from the first pass: a behavior that
        // measures its container will produce a different number here, which is
        // exactly the signal being looked for.
        box.style.cssText = 'position:fixed;left:-10000px;top:0;width:520px';
        document.body.appendChild(box);

        const seen: Record<string, Record<string, string>> = {};
        for (const attr of behaviors) {
          const host = document.createElement('div');
          host.innerHTML = '<span>Example content</span>';
          host.setAttribute(attr, '');
          box.appendChild(host);
          try {
            await WB.scan(host, { eager: true });
          } catch {
            host.remove();
            continue;
          }
          for (let t = 0; t < 40; t++) {
            await new Promise((r) => setTimeout(r, 25));
            if (host.className || host.querySelector('[style]')) break;
          }
          const map: Record<string, string> = {};
          [host, ...Array.from(host.querySelectorAll('[style]'))].forEach((el, i) => {
            if (!(el instanceof HTMLElement)) return;
            Array.from(el.style).forEach((p) => {
              map[i + ':' + p] = el.style.getPropertyValue(p);
            });
          });
          seen[attr] = map;
          host.remove();
        }
        box.remove();
        return seen;
      },
      reports.map((r) => r.behavior),
    );

    for (const r of reports) {
      const second = secondRun[r.behavior] || {};
      r.elements.forEach((el, i) => {
        for (const d of el.declarations) {
          if (d.classification !== 'UNCOVERED') continue;
          const other = second[i + ':' + d.prop];
          if (other !== undefined && other !== d.value) d.classification = 'DYNAMIC';
        }
      });
    }

    // ── Report ─────────────────────────────────────────────────────────────
    const tally: Record<Classification, number> = { COVERED: 0, UNCOVERED: 0, DYNAMIC: 0 };
    for (const r of reports) {
      for (const el of r.elements) {
        for (const d of el.declarations) tally[d.classification]++;
      }
    }
    const totalDeclarations = tally.COVERED + tally.UNCOVERED + tally.DYNAMIC;

    const countBy = (r: BehaviorReport, c: Classification) =>
      r.elements.reduce(
        (n, e) => n + e.declarations.filter((d) => d.classification === c).length,
        0,
      );

    const byBehavior = reports
      .map((r) => ({
        behavior: r.behavior,
        total: r.total,
        covered: countBy(r, 'COVERED'),
        uncovered: countBy(r, 'UNCOVERED'),
        dynamic: countBy(r, 'DYNAMIC'),
      }))
      .sort((a, b) => b.total - a.total);

    // Properties that carry a colour literal are the #790 overlap: they bypass
    // the theme system entirely, so they are worth calling out separately.
    const colourish = /(^|-)(color|background|border|outline|fill|stroke|shadow)/;
    const colourLiterals = reports.reduce((n, r) => {
      for (const el of r.elements) {
        for (const d of el.declarations) {
          if (colourish.test(d.prop) && /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(d.value)) n++;
        }
      }
      return n;
    }, 0);

    const audit = {
      generatedBy: 'tests/regression/inline-style-audit.spec.ts',
      issues: '#779 (inline styles), #790 (hardcoded colours inside them)',
      standard: 'No inline styles anywhere. Unqualified — overridability is a consequence, not a condition.',
      behaviorsWithInlineStyles: reports.length,
      totalDeclarations,
      colourLiteralDeclarations: colourLiterals,
      classification: {
        COVERED: {
          count: tally.COVERED,
          meaning:
            'a stylesheet already supplies this exact value — delete the inline write, no CSS to author',
        },
        UNCOVERED: {
          count: tally.UNCOVERED,
          meaning: 'the inline is the only source — a rule must be written before it can be removed',
        },
        DYNAMIC: {
          count: tally.DYNAMIC,
          meaning:
            'the value is computed at runtime — set a CSS custom property on the element and let a rule consume it',
        },
      },
      byBehavior,
      detail: reports,
    };

    mkdirSync(join(process.cwd(), 'data'), { recursive: true });
    writeFileSync(
      join(process.cwd(), 'data', 'inline-style-audit.json'),
      JSON.stringify(audit, null, 2),
    );

    const top = byBehavior
      .slice(0, 15)
      .map(
        (b) =>
          '    ' + String(b.total).padStart(4) + '  ' + b.behavior +
          '  (covered ' + b.covered + ', uncovered ' + b.uncovered + ', dynamic ' + b.dynamic + ')',
      )
      .join('\n');

    console.log(
      '\nInline-style audit — ' + totalDeclarations + ' declarations across ' +
        reports.length + ' behaviors\n' +
        '  COVERED   ' + tally.COVERED + '  (deletable now — CSS already supplies the value)\n' +
        '  UNCOVERED ' + tally.UNCOVERED + '  (needs a rule first)\n' +
        '  DYNAMIC   ' + tally.DYNAMIC + '  (needs a custom property)\n' +
        '  colour literals: ' + colourLiterals + '  (#790 — bypass the theme system)\n' +
        '  written to data/inline-style-audit.json\n\n  worst offenders:\n' + top + '\n',
    );

    expect(
      reports.length,
      'no behavior produced any inline style — the audit would be vacuously clean, which contradicts the known count',
    ).toBeGreaterThan(0);

    if (BASELINE_DECLARATIONS >= 0) {
      expect(
        totalDeclarations,
        'inline-style declarations rose to ' + totalDeclarations + ', above the baseline of ' +
          BASELINE_DECLARATIONS + '. The standard is no inline styles anywhere, so this number ' +
          'may fall and never rise. See data/inline-style-audit.json for which behavior added them.',
      ).toBeLessThanOrEqual(BASELINE_DECLARATIONS);
    }
  });
});
