import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROOF: there are no inline styles anywhere (#779, #790)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "there was never any qualifications other than no inline styles
 * anywhere." and "i want a unit test that proves there is no inline style for
 * all of our work."
 *
 * The rule is unqualified. Not "no inline styles that block a stylesheet", not
 * "no inline styles except computed values" -- none. Overridability is a
 * CONSEQUENCE of the rule, never a condition on it.
 *
 * THIS TEST IS RED UNTIL THE CLEANUP IS FINISHED. That is deliberate and it is
 * the point: it states the standard as an assertion, so "done" is a fact the
 * suite reports rather than a judgement someone makes. It is the
 * definition-of-done for #779.
 *
 * RELATIONSHIP TO THE AUDIT
 *
 * tests/regression/inline-style-audit.spec.ts answers "what has to happen":
 * it classifies every declaration as COVERED (a stylesheet already supplies
 * the value -- just delete the write), UNCOVERED (a rule must be written
 * first), or DYNAMIC (needs a custom property). That report is the plan.
 *
 * THIS test answers "is it finished": zero, everywhere, no allowlist.
 *
 * TWO SURFACES, BECAUSE ONE MISSES HALF
 *
 *   SOURCE  -- a JS file that writes el.style.foo / cssText / style="..."
 *              is a violation whether or not that path runs in this test.
 *              A runtime-only sweep would pass a behavior whose styling code
 *              lives behind a variant nobody exercised.
 *
 *   RUNTIME -- an element that ends up carrying a style attribute is a
 *              violation even if no source line obviously wrote it (a
 *              third-party helper, a template string, a copied fragment).
 *              A source-only scan cannot see those.
 *
 * Neither surface subsumes the other, so both are asserted.
 */

const ROOT = process.cwd();

/**
 * Writes that count as inline styling.
 *
 * CUSTOM PROPERTIES ARE FLAGGED TOO.
 *
 * An earlier draft of this file exempted `style.setProperty('--x', …)`, on the
 * reasoning that a custom property is how a computed value reaches a
 * stylesheet, so flagging it would forbid the remedy for DYNAMIC values.
 *
 * John asked why, and the exemption does not survive the question:
 *
 *   1. It writes the element's style attribute. `style="--nav-width: 240px"`
 *      is an inline style by every definition, including the DOM's.
 *   2. The rule has no qualifications. Carving one out here would make this
 *      test prove something WEAKER than the standard it exists to prove,
 *      which defeats its only purpose.
 *   3. It is not actually forced. A runtime value can be delivered by
 *      generating a rule in a stylesheet -- CSSStyleSheet.insertRule() or an
 *      adoptedStyleSheets entry keyed to a class -- which keeps every
 *      declaration in CSS and writes nothing to the element.
 *
 * AND THE DECISIVE ONE -- John: "themes are used for substitutionary reasons.
 * they are one of the reasons we don't want any inline styles."
 *
 * A theme works by SUBSTITUTING a token's value. An inline custom property is
 * not a weaker case than an inline declaration -- for a themeable token it is
 * exactly as fatal, because inline beats the theme's definition and the
 * substitution never happens. Writing `--glow-color` onto the element is
 * precisely the thing a theme exists to control.
 *
 * `effects.js:544` is the worked example:
 *
 *     const color = options.color || element.getAttribute('color')
 *                   || 'var(--primary, #6366f1)';
 *     element.style.setProperty('--glow-color', color);
 *
 * Even when the author supplies NOTHING, the default is pinned inline, so a
 * theme redefining `--glow-color` loses to an element that was never asked to
 * carry a value. The default belongs in `.x-glow { --glow-color: var(--primary) }`
 * and the JS should write nothing at all.
 *
 * It also buys almost nothing: 21 call sites across 7 files, and there are
 * ZERO non-custom setProperty calls for the narrower pattern to catch. The
 * exemption was carrying a qualification for no coverage.
 *
 * If a custom-property escape hatch is ever wanted, it should be added here
 * deliberately and visibly, not assumed by the test author.
 *
 * NOT flagged, because none of these write anything:
 *   - `getComputedStyle(el)`       reading is not writing.
 *   - `el.style.removeProperty(…)` removing an inline style is the goal.
 *   - `.style.length` / iteration  inspection, e.g. by this suite itself.
 */
const SOURCE_PATTERNS: Array<{ re: RegExp; what: string }> = [
  { re: /\.style\.cssText\s*=/g, what: 'cssText assignment' },
  { re: /\.style\.[a-zA-Z][\w]*\s*=(?!=)/g, what: 'style property assignment' },
  { re: /\.setAttribute\(\s*['"]style['"]/g, what: "setAttribute('style', …)" },
  { re: /Object\.assign\(\s*[\w.$\[\]'"]+\.style\s*,/g, what: 'Object.assign onto .style' },
  { re: /\.style\.setProperty\(/g, what: 'setProperty (custom properties included)' },
];

/** Source trees that are "our work". */
const SOURCE_DIRS = ['src', 'pages'];

/** Template carries a second copy of everything and ships it to users (#791). */
const TEMPLATE_DIRS = [join('packages', 'create-wb-starter', 'template', 'src')];

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'data', 'test-results', '.playwright-artifacts',
  'coverage', 'dist', 'out', '.claude', 'lib',
]);

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let s;
    try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

/** Strip comments and template/string literals so a documented example or a
 *  regex in this very file is not counted as a violation. Crude but one-way:
 *  it can only UNDER-report, never invent a violation that is not there. */
function stripNonCode(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1'); // line comments (not http://)
}

type Violation = { file: string; line: number; what: string; text: string };

function scanSources(dirs: string[]): Violation[] {
  const violations: Violation[] = [];
  for (const dir of dirs) {
    for (const file of walk(join(ROOT, dir), ['.js', '.mjs'])) {
      const raw = readFileSync(file, 'utf8');
      const code = stripNonCode(raw);
      const lines = code.split('\n');
      lines.forEach((line, i) => {
        for (const { re, what } of SOURCE_PATTERNS) {
          re.lastIndex = 0;
          if (re.test(line)) {
            violations.push({
              file: relative(ROOT, file).replace(/\\/g, '/'),
              line: i + 1,
              what,
              text: line.trim().slice(0, 100),
            });
            break;
          }
        }
      });
    }
  }
  return violations;
}

function scanMarkup(dirs: string[]): Violation[] {
  const violations: Violation[] = [];
  for (const dir of dirs) {
    for (const file of walk(join(ROOT, dir), ['.html'])) {
      const raw = readFileSync(file, 'utf8');
      raw.split('\n').forEach((line, i) => {
        // `[\x22\x27]` is `["']` written without literal quote characters, and
        // the escapes are load-bearing (#872). tests-must-assert.spec.ts finds
        // each test body by scanning characters and brace-matching; it has no
        // concept of a regex literal, so a `"` inside a character class opened
        // a phantom string that ran to the NEXT `"` in this file, 135 lines
        // away. Everything between stopped being comment-blanked, the
        // apostrophe in a `//` comment further down opened a second phantom
        // string, the brace matcher lost a level, and the `runtime:` test's
        // body was computed as ending 21 lines early -- just short of its
        // expect(). The gate then reported a test that was running and failing
        // correctly as asserting nothing. Same bytes, no scanner to desync.
        if (/\sstyle\s*=\s*[\x22\x27]/.test(line)) {
          violations.push({
            file: relative(ROOT, file).replace(/\\/g, '/'),
            line: i + 1,
            what: 'style= attribute in markup',
            text: line.trim().slice(0, 100),
          });
        }
      });
    }
  }
  return violations;
}

function summarise(violations: Violation[], limit = 40): string {
  const byFile: Record<string, number> = {};
  for (const v of violations) byFile[v.file] = (byFile[v.file] || 0) + 1;
  const worst = Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([f, n]) => `    ${String(n).padStart(5)}  ${f}`)
    .join('\n');
  const sample = violations
    .slice(0, limit)
    .map((v) => `    ${v.file}:${v.line}  [${v.what}]  ${v.text}`)
    .join('\n');
  return `  by file:\n${worst}\n\n  first ${Math.min(limit, violations.length)}:\n${sample}`;
}

test.describe('No inline styles anywhere (#779)', () => {
  test('source: no file writes an inline style', () => {
    const violations = scanSources(SOURCE_DIRS);
    expect(
      violations.length,
      `${violations.length} inline-style writes in ${SOURCE_DIRS.join(', ')}.\n` +
      `The standard is no inline styles anywhere — a static value belongs in a stylesheet ` +
      `rule keyed to the class the element already carries, and a COMPUTED value belongs ` +
      `in a generated stylesheet rule (CSSStyleSheet.insertRule / adoptedStyleSheets) ` +
      `rather than on the element. Writing a custom property to element.style is still ` +
      `writing the style attribute and is counted here.\n` +
      `See data/inline-style-audit.json for which of these are already COVERED by an ` +
      `existing rule and therefore deletable outright, with no CSS to author.\n\n` +
      `${summarise(violations)}\n`,
    ).toBe(0);
  });

  test('markup: no authored page carries a style attribute', () => {
    const violations = scanMarkup(SOURCE_DIRS);
    expect(
      violations.length,
      `${violations.length} style= attributes in authored markup.\n\n${summarise(violations)}\n`,
    ).toBe(0);
  });

  test('template: the copy shipped to new projects is clean too', () => {
    // #791: packages/create-wb-starter/template duplicates every behavior and
    // nothing walks it, which is how the canonical verbs (#782) landed in src/
    // only. A gate that skips the template lets the defect ship to every new
    // project while reporting green here.
    const violations = [...scanSources(TEMPLATE_DIRS), ...scanMarkup(TEMPLATE_DIRS)];
    expect(
      violations.length,
      `${violations.length} inline-style writes in the scaffolding template. ` +
      `This is what every new project receives.\n\n${summarise(violations)}\n`,
    ).toBe(0);
  });

  test('runtime: no behavior produces an element carrying a style attribute', async ({ page }) => {
    test.setTimeout(900_000);

    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).WB), { timeout: 30_000 });

    const offenders: Array<{ behavior: string; tag: string; classes: string; style: string }> =
      await page.evaluate(async () => {
        const WB = (window as any).WB;
        const mod = await import('/src/core/tag-map.js');
        const attrs: string[] = Object.keys(mod.extensionMap);

        const box = document.createElement('div');
        // The harness itself must not contribute a style attribute to the
        // elements under test, so it is positioned via a class-free wrapper
        // that is never inspected -- only the behavior's own host subtree is.
        box.setAttribute('data-audit-harness', '');
        document.body.appendChild(box);

        const found: any[] = [];

        for (const attr of attrs) {
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
          // Poll for the behavior to land: behaviors lazy-load their module, so
          // a fixed wait measures before it has run (#781's 26 false positives).
          for (let t = 0; t < 40; t++) {
            await new Promise((r) => setTimeout(r, 25));
            if (host.className || host.children.length !== 1 || host.querySelector('[style]')) break;
          }

          const styled = [host, ...Array.from(host.querySelectorAll('[style]'))].filter(
            (el) => el instanceof HTMLElement && (el.getAttribute('style') || '').trim(),
          ) as HTMLElement[];

          for (const el of styled) {
            found.push({
              behavior: attr,
              tag: el.tagName.toLowerCase(),
              classes: Array.from(el.classList).join(' '),
              style: (el.getAttribute('style') || '').slice(0, 120),
            });
          }

          host.remove();
        }

        box.remove();
        return found;
      });

    const byBehavior: Record<string, number> = {};
    for (const o of offenders) byBehavior[o.behavior] = (byBehavior[o.behavior] || 0) + 1;
    const worst = Object.entries(byBehavior)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([b, n]) => `    ${String(n).padStart(4)}  ${b}`)
      .join('\n');
    const sample = offenders
      .slice(0, 30)
      .map((o) => `    ${o.behavior} → <${o.tag} class="${o.classes}"> style="${o.style}"`)
      .join('\n');

    expect(
      offenders.length,
      `${offenders.length} elements carry a style attribute after their behavior ran, ` +
      `across ${Object.keys(byBehavior).length} behaviors.\n` +
      `Every one of these is a value a theme cannot reach: an inline declaration beats ` +
      `every stylesheet rule regardless of specificity.\n\n  by behavior:\n${worst}\n\n  sample:\n${sample}\n`,
    ).toBe(0);
  });
});
