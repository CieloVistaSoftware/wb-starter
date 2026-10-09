import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { behaviorSourceFiles, styledClasses } from '../helpers/styled-classes';

/**
 * #1095: a class a behavior adds is a contract. It is the stable, findable
 * hook a stylesheet targets and a page overrides on merit. A class that no
 * rule styles breaks that contract. The behavior believes it is
 * saying something (an input group, an inline form row, a loading
 * autocomplete) and the reader sees plain markup. A STATE class with no rule
 * is the worst case, because the state cannot be seen at all.
 *
 * Measured when the issue was filed: 130 such classes. Measured on main when
 * this gate was written (3be6e8ac, 2026-10-07): 64, scanned exactly as below.
 *
 * WHAT IS SCANNED: every string-literal `x-…` argument to classList.add() or
 * classList.toggle() in src/wb-viewmodels/. A literal that ends in `-` is a
 * prefix (`'x-code--size-' + key`) and counts as styled when any styled class
 * starts with it. Template literals (`x-card--${size}`) are not expanded here.
 * Their declared values are what applies-class-names-a-styled-class.spec.ts
 * checks.
 *
 * WHAT COUNTS AS A RULE: a class selector in a stylesheet under src/styles,
 * or in CSS a behavior injects (see tests/helpers/styled-classes.ts).
 * enhancements.css is left out, because nothing loads it (#779).
 *
 * THE RATCHET: UNSTYLED lists every class that has no rule today, with the
 * file that adds it. It may only shrink:
 *   - a class a behavior adds that is neither styled nor listed fails here.
 *     Write its rule in the behavior's stylesheet. Do not add it to the list.
 *   - a listed class that has gained a rule (or is no longer added) fails as
 *     stale. Delete its line, and lower CEILING to the new length.
 *   - CEILING may only go down. The issue's correction comment says the fix is
 *     to write the missing rules, never to delete the classes, so the list
 *     empties by styling. A class that needs no rule of its own leaves it for
 *     NEEDS_NO_RULE below, with the reason, which is a reviewed decision.
 */
const UNSTYLED: Record<string, string> = {
  // Left for the card-family batch: it composes card() and its look is card.css.
  'x-fix-card': 'fix-card.js',
};

/**
 * DECIDED: NO RULE (#1095 batch 3). Kept apart from UNSTYLED, which is debt;
 * these are decisions. Each class here needs no rule of its own, because its
 * look already comes from somewhere a reader will find it, or because it is a
 * hook for JS or tests only. The reason names where the look comes from.
 *
 * Adding a line is a reviewed decision, not a way past the gate. A class a
 * user would see differently with a rule gets the rule instead. A line whose
 * class gains a rule, or is no longer added, fails as stale.
 */
const NEEDS_NO_RULE: Record<string, string> = {
  // A marker with nothing to show: the behavior builds no DOM and sets no state.
  'x-behavior': 'the generic marker behavior.js adds and nothing more; permutation-compliance reads it as the baseClass',
  'x-behaviors-showcase': 'page wiring on the showcase container (nav highlight, smooth scroll); the page stylesheet styles that page',
  'x-control': 'control() adds its baseClass and does nothing else (control.schema.json says so); a rule would style a no-op',
  'x-globe': 'globe() adds its baseClass and builds nothing; a rule would style an empty host',
  'x-slider': 'slider() adds its baseClass and builds nothing; a rule would style an empty host',
  // The look is on a sibling class the same behavior adds to the same element.
  'x-confetti': 'confetti() also adds x-confetti--trigger (and --trigger-button), which effects.css styles',
  'x-fireworks': 'fireworks() also adds x-fireworks--trigger (and --trigger-button), which effects.css styles',
  'x-snow': 'snow() also adds x-snow--trigger (and --trigger-button), which effects.css styles',
  'x-sparkle': 'sparkle() also adds x-sparkle--trigger, which effects.css styles (position: relative for the sparks)',
  'x-lightbox': 'lightbox() also adds x-lightbox--trigger, which overlays.css styles (cursor: pointer)',
  'x-modal': 'added beside x-dialog on a <dialog>; the tag and dialog.css\'s .x-dialog rules are its look',
  'x-modal--trigger': 'added beside x-dialog--trigger, which dialog.css styles (cursor: pointer)',
  'x-drawer': 'added beside x-drawer--trigger (drawer) or x-drawerlayout (drawerLayout); layout.css styles both',
  'x-status': 'status text with no variant is plain running text by design (status.css); each look is an x-status--{variant} class',
  'x-articles': 'a plain container; its look is its parts (x-articles__header, __list with --grid/--list/--masonry, __pagination) in article.css',
  'x-form': 'the <form> tag is the look; the states form() shows are x-form__message, x-form__field--invalid and x-form--loading, styled in form.css',
  'x-validator': 'the host is the author\'s own <form> or <input>; the feedback validator() shows is x-validator__error, styled in validator.css',
  'x-move': 'a container whose children move; the motion is x-move__item--animated and x-move--offset, styled in move.css',
  'x-external': 'the host is the author\'s <a>; the mark external() adds is x-external__icon, styled in helpers.css',
  'x-darkmode': 'the host is the author\'s button (button.css); the visible effect is the data-theme it sets on the page',
  'x-accordion': 'a plain container; its look is its parts: x-accordion__item/__head/__body in accordion.css for titled panels, and x-details for the <details> form, where accordion() adds only exclusivity. Measured (#1095 batch 4): a <span> host lays its panels out exactly as a <div> host does, so a host rule would have nothing to change',
  'x-tooltip--trigger': 'the trigger is whatever element the tooltip describes, often a button or link with its own cursor; the visible feedback is the .x-tooltip panel',
  // The visible change is made another way; the class is a signal for JS or tests.
  'x-parallax': 'its look is the per-scroll transform dynamic-style.js generates; a static rule has nothing to add',
  'x-demo--measured': 'readiness signal tests wait on; the visible change at that moment is the removal of x-demo--measuring, which demo.css styles',
  'x-demo__source--unavailable': 'the panel text is an HTML comment saying the source is unavailable, which the highlighter already paints in the theme\'s comment colour',
};

/**
 * Only ever lowered. 64 when this gate was written; 54 after batch 1; 46 after
 * batch 2; 3 after batch 3, which styled 19 and recorded 24 as NEEDS_NO_RULE;
 * 1 after batch 4, which styled x-demo (demo.css host rules match the class)
 * and recorded x-accordion as NEEDS_NO_RULE.
 */
const CEILING = 1;

test('every class a behavior adds has a stylesheet rule, or is on the shrinking list (#1095)', () => {
  const root = process.cwd();
  const styled = styledClasses(root, ['enhancements.css']);
  const isStyled = (cls: string) =>
    cls.endsWith('-') ? [...styled].some((s) => s.startsWith(cls)) : styled.has(cls);

  const added = new Map<string, Set<string>>();
  for (const file of behaviorSourceFiles(root)) {
    const rel = path.relative(path.join(root, 'src', 'wb-viewmodels'), file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf8');
    for (const call of src.matchAll(/classList\.(?:add|toggle)\(([^)]*)\)/g)) {
      for (const lit of call[1].matchAll(/['"`](x-[\w-]+)['"`]/g)) {
        if (!added.has(lit[1])) added.set(lit[1], new Set());
        added.get(lit[1])!.add(rel);
      }
    }
  }
  // A scan that found nothing would report perfect compliance forever.
  expect(added.size, 'the scan found classList.add/toggle calls to check').toBeGreaterThan(100);

  const unstyled = [...added.keys()].filter((c) => !isStyled(c)).sort();
  const fresh = unstyled
    .filter((c) => !(c in UNSTYLED) && !(c in NEEDS_NO_RULE))
    .map((c) => `.${c} <- ${[...added.get(c)!].join(', ')}`);
  expect(
    fresh,
    `${fresh.length} class(es) added by a behavior that no stylesheet styles. Write the rule in that ` +
    "behavior's stylesheet under src/styles/behaviors/ (theme tokens, no !important); do not list it",
  ).toEqual([]);

  const stale = Object.keys(UNSTYLED).filter((c) => !unstyled.includes(c));
  expect(
    stale,
    'listed as unstyled but now styled or no longer added: delete these lines and lower CEILING',
  ).toEqual([]);

  expect(Object.keys(UNSTYLED).length, 'UNSTYLED may only shrink').toBeLessThanOrEqual(CEILING);

  // The decisions stay true: a decided class is still added, still has no
  // rule, is not also listed as debt, and says why.
  const decided = Object.keys(NEEDS_NO_RULE);
  expect(decided.filter((c) => c in UNSTYLED), 'listed both as debt and as decided').toEqual([]);
  expect(
    decided.filter((c) => !unstyled.includes(c)),
    'decided as needing no rule but now styled or no longer added: delete these lines',
  ).toEqual([]);
  expect(
    decided.filter((c) => NEEDS_NO_RULE[c].trim().length < 40),
    'each decision names where the look comes from, or what the hook is for',
  ).toEqual([]);
});
