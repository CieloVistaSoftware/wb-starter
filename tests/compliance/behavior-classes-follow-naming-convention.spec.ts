/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Behavior classes follow x-{behavior}[__part][--modifier] (#1096)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * John: "if we control how .js names classes then we can find them based on
 * convention." That only works when the convention holds: an author who knows
 * the behavior is `floatinglabel` has to be able to write `.x-floatinglabel`
 * without opening floatinglabel.js. The rule is in
 * docs/standards/CSS-CLASS-CONVENTION.md.
 *
 * Measured 2026-10-07 on main (3be6e8ac): 107 of the 700 x- classes the
 * behaviors apply did not conform. They are being renamed in batches, so this
 * is a ratchet, not a zero-gate:
 *
 *   1. The number that do not conform may only go down. When a batch renames
 *      some, lower NON_CONFORMING_MAX to the new count in the same change.
 *   2. A renamed class is RETIRED: no source, stylesheet, test, doc, page,
 *      demo or data file may use the old name again, so a page cannot keep
 *      styling a class nothing applies any more.
 */

import { test, expect } from '../fixtures/offline';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import {
  CONVENTION,
  registeredBehaviorNames,
  behaviorClassNames,
  classifyClassNames,
} from '../../scripts/lib/behavior-classes.mjs';

const root = process.cwd();

/**
 * Classes applied by behaviors that do not follow the convention. Shrink only.
 * 107 on 2026-10-07; batch 1 (the form-control family below) took it to 96,
 * batch 2 (the layout compounds) to 85, batch 3 (the -trigger family) to 66.
 */
const NON_CONFORMING_MAX = 66;

/**
 * Old name -> the name that replaced it. Each old name is gone for good.
 * Batch 1, 2026-10-07: the form-control family.
 */
const RETIRED: Record<string, string> = {
  'x-floating-label': 'x-floatinglabel',
  'x-floating-label--active': 'x-floatinglabel--active',
  'x-floating-label--input': 'x-floatinglabel--input',
  'x-floating-label--textarea': 'x-floatinglabel--textarea',
  'x-floating-label--select': 'x-floatinglabel--select',
  'x-floating-label__label': 'x-floatinglabel__label',
  'x-form-row': 'x-formrow',
  'x-form-row--inline': 'x-formrow--inline',
  'x-input-group': 'x-inputgroup',
  'x-input-group__prepend': 'x-inputgroup__prepend',
  'x-input-group__append': 'x-inputgroup__append',
  'x-radio-wrapper': 'x-radio__wrapper',
  'x-radio-label': 'x-radio__label',
  // Batch 2, 2026-10-07: the layout compounds (layouts.js). A handle, toggle
  // or resize overlay that drawerLayout builds is a PART of drawerlayout, not a
  // modifier of the separate `drawer` behavior that `x-drawer-*` implied.
  'x-sidebar-layout': 'x-sidebarlayout',
  'x-sidebar-layout__main': 'x-sidebarlayout__main',
  'x-sidebar-layout__side': 'x-sidebarlayout__side',
  'x-drawer-layout': 'x-drawerlayout',
  'x-drawer-layout--vertical': 'x-drawerlayout--vertical',
  'x-drawer-handle': 'x-drawerlayout__handle',
  'x-drawer-toggle': 'x-drawerlayout__toggle',
  'x-drawer-resize-overlay': 'x-drawerlayout__resize-overlay',
  // Batch 3, 2026-10-07: the -trigger family. The element carrying the
  // behavior IS the block, so "this element is the trigger" is a modifier of
  // it, x-{behavior}--trigger. The look variant of a trigger is one modifier
  // with a kebab-case value, x-{behavior}--trigger-button.
  'x-popover-trigger': 'x-popover--trigger',
  'x-drawer-trigger': 'x-drawer--trigger',
  'x-lightbox-trigger': 'x-lightbox--trigger',
  'x-offcanvas-trigger': 'x-offcanvas--trigger',
  'x-sheet-trigger': 'x-sheet--trigger',
  'x-confirm-trigger': 'x-confirm--trigger',
  'x-prompt-trigger': 'x-prompt--trigger',
  'x-confetti-trigger': 'x-confetti--trigger',
  'x-confetti-trigger--button': 'x-confetti--trigger-button',
  'x-fireworks-trigger': 'x-fireworks--trigger',
  'x-fireworks-trigger--button': 'x-fireworks--trigger-button',
  'x-snow-trigger': 'x-snow--trigger',
  'x-snow-trigger--button': 'x-snow--trigger-button',
  'x-sparkle-trigger': 'x-sparkle--trigger',
  'x-dialog-trigger': 'x-dialog--trigger',
  'x-modal-trigger': 'x-modal--trigger',
  'x-dropdown-trigger': 'x-dropdown--trigger',
  'x-toast-trigger': 'x-toast--trigger',
  'x-tooltip-trigger': 'x-tooltip--trigger',
};

/**
 * Retired CLASS names that are still live ATTRIBUTE names: `<aside
 * x-drawer-layout>` is how an author applies drawerLayout, and stays so. For
 * these the bare name is only a hit where it is used as a class: a selector
 * (`.x-drawer-layout`) or a line about classes (className, classList,
 * toHaveClass, baseClass, appliesClass, checkClasses, class=). Any suffixed
 * form (`x-drawer-layout--vertical`) is a class wherever it appears.
 */
const ALSO_ATTRIBUTES = new Set(['x-sidebar-layout', 'x-drawer-layout']);
const CLASS_CONTEXT = /class(?:Name|List|es)?\b|toHaveClass|baseClass|appliesClass|checkClasses/;

/** Is this match a use of the retired CLASS, rather than of a same-named attribute? */
function isClassUse(token: string, line: string, at: number): boolean {
  // A file name that happens to start with an old class, x-drawer-trigger-not-op.spec.ts.
  if (/^\.(?:spec\.ts|test\.ts|[cm]?js|ts|css|html|md|json)\b/.test(line.slice(at + token.length))) return false;
  if (!ALSO_ATTRIBUTES.has(token)) return true;
  const before = line[at - 1] ?? '';
  const after = line[at + token.length] ?? '';
  if (before === '.') return true;
  if (before === '<' || before === '[' || after === '=' || after === ']') return false;
  // Inside a start tag, `<aside id="a" x-drawer-layout>`, it is markup.
  if (/<[a-z][\w-]*(?:\s+[^<>]*)?\s$/i.test(line.slice(0, at))) return false;
  // Only the words next to it: one long line (a search-index entry, a table
  // row) can say "class" about something else entirely.
  return CLASS_CONTEXT.test(line.slice(Math.max(0, at - 40), at + token.length + 20));
}

/**
 * Where a retired name must not appear. History is left alone on purpose:
 * release notes, issue titles and archive/ record what the names WERE.
 */
const SCAN_DIRS = ['src', 'pages', 'demos', 'docs/behaviors', 'docs/standards', 'tests', 'data', 'packages', 'templates'];
const SKIP = [
  'tests/compliance/behavior-classes-follow-naming-convention.spec.ts',   // this file names them to forbid them
  'tests/fixtures/offline',                                              // cached third-party modules
  'data/releases.json',                                                  // release history
  'data/release-see-it.json',
  'data/issue-titles.json',
  'data/component-word-audit.json',                                      // quotes old test output verbatim
  // Generated from every doc, including history this scan leaves alone on
  // purpose (docs/schema-test-value.md quotes `x-dropdown-trigger`). The
  // version-stamp bot regenerates it on main, which put the retired name back
  // after #1719 and turned main red. Its sources are scanned where it matters.
  'data/search.json',
];
const SCANNED = /\.(js|mjs|ts|css|html|md|json)$/;

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = join(dir, name);
    const rel = relative(root, full).replace(/\\/g, '/');
    if (SKIP.some((s) => rel === s || rel.startsWith(s + '/'))) continue;
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (SCANNED.test(name)) acc.push(full);
  }
  return acc;
}

function behaviorModules(): Array<{ file: string; src: string }> {
  return walk(join(root, 'src', 'wb-viewmodels'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: relative(root, f).replace(/\\/g, '/'), src: readFileSync(f, 'utf8') }));
}

/** `x-form-row` as a whole class or the stem of a longer one, never inside another word. */
function retiredPattern(): RegExp {
  const alts = Object.keys(RETIRED).sort((a, b) => b.length - a.length).map((n) => n.replace(/[-_]/g, '\\$&'));
  return new RegExp(`(?<!(?<!\\\\)[\\w-])(?:${alts.join('|')})(?![a-z0-9])[\\w-]*`, 'g');
}

test.describe('Behavior classes follow x-{behavior}[__part][--modifier] (#1096)', () => {
  test('the detector sorts names the way the convention says', () => {
    const names = new Set(['alert', 'floatinglabel', 'radio', 'cardpricing']);
    const classes = behaviorClassNames([{
      file: 'fixture.js',
      src: [
        "el.classList.add('x-alert', 'x-alert__icon');",
        'el.classList.add(`x-alert--${config.variant.toLowerCase()}`);',
        "el.classList.toggle('x-floatinglabel--active', on);",
        "w.className = 'x-radio__wrapper x-radio-label';",
        "el.classList.add('x-pricing--featured');",
        "el.classList.add('x-floating-label__label');",
        "el.classList.add('not-ours');",
      ].join('\n'),
    }]);
    expect([...classes.keys()].sort()).toEqual([
      'x-alert', 'x-alert--v', 'x-alert__icon', 'x-floating-label__label',
      'x-floatinglabel--active', 'x-pricing--featured', 'x-radio-label', 'x-radio__wrapper',
    ]);
    const sorted = classifyClassNames(classes, names);
    expect(sorted.conform).toEqual(['x-alert', 'x-alert--v', 'x-alert__icon', 'x-floatinglabel--active', 'x-radio__wrapper']);
    expect(sorted.baseNotBehavior, 'a concept, not the behavior that applies it').toEqual(['x-pricing--featured']);
    expect(sorted.wrongShape, 'single-dash compounds the rule has no slot for').toEqual(['x-floating-label__label', 'x-radio-label']);
    expect('x-card__contact-link').toMatch(CONVENTION);
    expect('x-card-image').not.toMatch(CONVENTION);
  });

  test('a retired class that is also a live attribute is only a hit where it is used as a class', () => {
    const at = (token: string, line: string) => isClassUse(token, line, line.indexOf(token));
    expect(at('x-drawer-layout', '<aside x-drawer-layout position="left">'), 'an attribute on markup').toBe(false);
    expect(at('x-drawer-layout', "  'x-drawer-layout': 'drawerLayout',"), 'a tag-map key').toBe(false);
    expect(at('x-drawer-layout', '**A class is not an attribute.** `<aside id="n" x-drawer-layout>`'), 'an attribute in a start tag beside the word class').toBe(false);
    expect(at('x-drawer-layout', '[x-drawer].x-drawer-layout {'), 'a class selector').toBe(true);
    expect(at('x-drawer-layout', "element.classList.add('x-drawer-layout');"), 'a classList call').toBe(true);
    expect(at('x-sidebar-layout', '| Attribute | `x-sidebarlayout` or `x-sidebar-layout` | | Applies to | a container | ' + 'x'.repeat(60) + ' class'), 'class said about something else').toBe(false);
    expect(at('x-drawer-layout', '    // the wrong x-drawer-layout class.'), 'a comment about the class').toBe(true);
    expect('toHaveClass(/\\bx-tooltip-trigger\\b/)'.match(retiredPattern()), 'an old name right after a regex \\b').not.toBeNull();
    expect('preview-x-form-row'.match(retiredPattern()), 'inside another word').toBeNull();
    expect(at('x-drawer-trigger-not-op', 'covered by x-drawer-trigger-not-op.spec.ts).'), 'a spec file name').toBe(false);
    expect(at('x-drawer-layout--vertical', 'see x-drawer-layout--vertical'), 'a suffixed form is always a class').toBe(true);
  });

  test('every replacement name itself follows the convention', () => {
    const names = registeredBehaviorNames(root);
    for (const [old, now] of Object.entries(RETIRED)) {
      const m = now.match(CONVENTION);
      expect(m, `${old} -> ${now} has the wrong shape`).not.toBeNull();
      expect(names.has(m![1]), `${old} -> ${now}: "${m![1]}" is not a registered behavior`).toBe(true);
    }
  });

  test(`no more than ${NON_CONFORMING_MAX} behavior classes break the convention (ratchet: may only go down)`, () => {
    const classes = behaviorClassNames(behaviorModules());
    const { conform, baseNotBehavior, wrongShape } = classifyClassNames(classes, registeredBehaviorNames(root));
    const bad = [...baseNotBehavior, ...wrongShape];
    const list = bad.map((c) => `  ${c}  (${[...classes.get(c)!].join(', ')})`).join('\n');
    console.log(`[#1096] ${classes.size} classes: ${conform.length} conform, ${baseNotBehavior.length} base is not a behavior, ${wrongShape.length} wrong shape`);
    expect(bad.length,
      `${bad.length} behavior classes break x-{behavior}[__part][--modifier]; the ceiling is ${NON_CONFORMING_MAX}. ` +
      `A new class must be named for the behavior that applies it (docs/standards/CSS-CLASS-CONVENTION.md).\n${list}`,
    ).toBeLessThanOrEqual(NON_CONFORMING_MAX);
    expect(bad.length,
      `Only ${bad.length} classes break the convention now -- lower NON_CONFORMING_MAX to ${bad.length} so the gain cannot be lost.`,
    ).toBeGreaterThanOrEqual(NON_CONFORMING_MAX);
  });

  test('no file uses a retired class name', () => {
    const pattern = retiredPattern();
    const hits: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(root, dir))) {
        const lines = readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, i) => {
          for (const m of line.matchAll(pattern)) {
            if (!isClassUse(m[0], line, m.index!)) continue;
            const old = Object.keys(RETIRED).filter((n) => m[0].startsWith(n)).sort((a, b) => b.length - a.length)[0];
            hits.push(`${relative(root, file).replace(/\\/g, '/')}:${i + 1}  ${m[0]}  -> use ${RETIRED[old] ?? '(renamed)'}${m[0].slice(old.length)}`);
          }
        });
      }
    }
    expect(hits, `Retired class names are back -- nothing applies them, so anything styling or selecting them does nothing:\n${hits.join('\n')}`).toEqual([]);
  });
});
