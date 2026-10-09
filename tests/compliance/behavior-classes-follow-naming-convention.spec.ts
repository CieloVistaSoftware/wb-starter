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
 * batch 2 (the layout compounds) to 85, batch 3 (the -trigger family) to 66,
 * batch 4 (the parts semantic elements build) to 50, batch 5 (bases that were
 * not a behavior name) to 28, batch 6 (the single-dash compounds) to 6, and
 * the final batch to 0: fix-card's classes renamed, effects.js's clickAnim
 * classes named for their behaviors, and behavior.js and behaviors-showcase.js
 * deleted as unreachable.
 */
const NON_CONFORMING_MAX = 0;

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
  // Batch 4, 2026-10-07: DOM a semantic behavior builds is a PART of it,
  // x-{behavior}__{part}. The wrapper code, pre, range, textarea and
  // copybutton build around their element is `__wrapper`. The div audio.js
  // builds around a native <audio> already carries the block class x-audio,
  // so "this x-audio is the built host" is a modifier of it, not a part.
  'x-code-wrapper': 'x-code__wrapper',
  'x-pre-wrapper': 'x-pre__wrapper',
  'x-range-wrapper': 'x-range__wrapper',
  'x-range-labels': 'x-range__labels',
  'x-range-value': 'x-range__value',
  'x-textarea-wrapper': 'x-textarea__wrapper',
  'x-copybutton-wrapper': 'x-copybutton__wrapper',
  'x-audio-host': 'x-audio--host',
  'x-label-group': 'x-label__group',
  'x-select-clearable': 'x-select__clearable',
  'x-timeline-item': 'x-timeline__item',
  'x-accordion-item': 'x-accordion__item',
  'x-accordion-head': 'x-accordion__head',
  'x-accordion-body': 'x-accordion__body',
  'x-accordion-title': 'x-accordion__title',
  'x-accordion-icon': 'x-accordion__icon',
  // Batch 5, 2026-10-09: a base that named a concept, not the behavior that
  // applies it. A card variant's classes take the variant's name, so every
  // x-portfolio* class is now x-cardportfolio* and every x-notification* class
  // x-cardnotification*: the whole family, so the stem is what is retired. A
  // state one helper puts on several behaviors is each behavior's own
  // modifier: x-glow--pressed, x-rainbow--pressed and x-particle--pressed. The
  // class sheet puts on <body> while it is dragged is the sheet's modifier,
  // and the copy-button anchor behaviors-showcase.js puts on an x-mdhtml block
  // is a modifier of that block.
  'x-portfolio': 'x-cardportfolio',
  'x-notification': 'x-cardnotification',
  'x-pricing--featured': 'x-cardpricing--featured',
  'x-stats--accent': 'x-cardstats--accent',
  'x-pressed': 'x-glow--pressed',
  'x-resizing': 'x-sheet--resizing',
  'x-showcase__copy-host': 'x-mdhtml--copy-host',
  // Batch 6, 2026-10-09: single-dash compounds. A card variant's classes take
  // the variant's name, so the whole x-card-file, x-card-horizontal and
  // x-card-image stems go, schema baseClass included. A layer, piece, buffer,
  // overlay or target a behavior builds is its part; the full-screen layer the
  // effects drop their pieces into is `__overlay`, because confetti, fireworks
  // and snow already build a `__container` of their own. A class a behavior
  // puts on <body> is its modifier. Where one helper served several behaviors
  // the class is each one's own: drawer, offcanvas and sheet lock scroll with
  // x-{behavior}--scroll-lock (site-engine.js's mobile nav, not a behavior,
  // with site--scroll-lock), the confirm and prompt dialog's parts are
  // x-confirm__* and x-prompt__*, the media fallback message is
  // x-img__load-failed or x-video__load-failed, and the glass badge is
  // x-header__badge--glass or x-card__link-badge--glass.
  'x-card-file': 'x-cardfile',
  'x-card-horizontal': 'x-cardhorizontal',
  'x-card-image': 'x-cardimage',
  'x-confetti-container': 'x-confetti__overlay',
  'x-confetti-piece': 'x-confetti__piece',
  'x-fireworks-container': 'x-fireworks__overlay',
  'x-snow-container': 'x-snow__overlay',
  'x-copy-buffer': 'x-copy__buffer',
  'x-drawer-push-target': 'x-drawer__push-target',
  'x-img-lightbox': 'x-img__lightbox',
  'x-media-load-failed': 'x-img__load-failed',
  'x-modal-definition': 'x-modal--definition',
  'x-notes-pick-target': 'x-notes__pick-target',
  'x-notes-picking': 'x-notes--picking',
  'x-overlay-dialog': 'x-confirm__dialog',
  'x-scroll-lock': 'x-drawer--scroll-lock',
  'x-tag-glass': 'x-header__badge--glass',
  'x-toast-container': 'x-toast__container',
  // Final batch, 2026-10-09. The behavior registered as `fix-card` takes its
  // function name lowercased, fixCard -> x-fixcard, as drawerLayout's classes
  // are x-drawerlayout: the convention's {behavior} is one word. The attribute
  // and the <x-fix-card> tag are unchanged. effects.js's clickAnim() put the
  // KEYFRAME's name on the element as its class (x-fade-in, x-slide-in-left);
  // the class is now the behavior's own, with the slide direction as its
  // modifier, and the keyframes keep their names.
  'x-fix-card': 'x-fixcard',
  'x-fix-card__main': 'x-fixcard__main',
  'x-fix-card-scroll-container': 'x-fixcard__scroll-container',
  'x-fade-in': 'x-fadein',
  'x-fade-out': 'x-fadeout',
  'x-zoom-in': 'x-zoomin',
  'x-zoom-out': 'x-zoomout',
  'x-slide-in-left': 'x-slidein--left',
  'x-slide-in-right': 'x-slidein--right',
  'x-slide-in-up': 'x-slidein--up',
  'x-slide-in-down': 'x-slidein--down',
  'x-slide-out-left': 'x-slideout--left',
  'x-slide-out-right': 'x-slideout--right',
  'x-slide-out-up': 'x-slideout--up',
  'x-slide-out-down': 'x-slideout--down',
};

/**
 * Retired CLASS names that are still live ATTRIBUTE names: `<aside
 * x-drawer-layout>` is how an author applies drawerLayout, and stays so. For
 * these the bare name is only a hit where it is used as a class: a selector
 * (`.x-drawer-layout`) or a line about classes (className, classList,
 * toHaveClass, baseClass, appliesClass, checkClasses, class=). Any suffixed
 * form (`x-drawer-layout--vertical`) is a class wherever it appears.
 */
const ALSO_ATTRIBUTES = new Set(['x-sidebar-layout', 'x-drawer-layout', 'x-fix-card']);

/**
 * Retired CLASS names that are still live @keyframes names. clickAnim() used
 * the keyframe's name as the class; the class was renamed and the keyframe was
 * not, so `animation: x-fade-in 0.3s` and `@keyframes x-slide-in-left` are
 * correct uses. Treated like ALSO_ATTRIBUTES: a hit only as a class.
 */
const ALSO_KEYFRAMES = new Set([
  'x-fade-in', 'x-fade-out', 'x-zoom-in', 'x-zoom-out',
  'x-slide-in-left', 'x-slide-in-right', 'x-slide-in-up', 'x-slide-in-down',
  'x-slide-out-left', 'x-slide-out-right', 'x-slide-out-up', 'x-slide-out-down',
]);
const CLASS_CONTEXT = /class(?:Name|List|es)?\b|toHaveClass|baseClass|appliesClass|checkClasses/;

/** Is this match a use of the retired CLASS, rather than of a same-named attribute? */
function isClassUse(token: string, line: string, at: number): boolean {
  // A file name that happens to start with an old class, x-drawer-trigger-not-op.spec.ts.
  if (/^\.(?:spec\.ts|test\.ts|[cm]?js|ts|css|html|md|json)\b/.test(line.slice(at + token.length))) return false;
  if (!ALSO_ATTRIBUTES.has(token) && !ALSO_KEYFRAMES.has(token)) return true;
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
    expect(at('x-fade-in', '  animation: x-fade-in 0.3s ease;'), 'a keyframe played by animation').toBe(false);
    expect(at('x-slide-in-left', '@keyframes x-slide-in-left {'), 'a keyframe defined').toBe(false);
    expect(at('x-fade-in', '.x-fade-in { opacity: 0; }'), 'a class selector on a keyframe name').toBe(true);
    expect(at('x-zoom-in', "expect(el).toHaveClass('x-zoom-in');"), 'a class assertion on a keyframe name').toBe(true);
    expect(at('x-fix-card', '<div x-fix-card id="fc"></div>'), 'the fix-card attribute').toBe(false);
    expect(at('x-fix-card', "el.classList.contains('x-fix-card')"), 'the retired fix-card class').toBe(true);
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
