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
 *     empties by styling.
 */
const UNSTYLED: Record<string, string> = {
  'x-accordion': 'collapse.js',
  'x-articles': 'article.js',
  'x-avatar': 'feedback.js',
  'x-behavior': 'behavior.js',
  'x-behaviors-showcase': 'behaviors-showcase.js',
  'x-card--expanded': 'card.js',
  'x-cardstats--error': 'card.js',
  'x-chip': 'feedback.js',
  'x-collapse': 'collapse.js',
  'x-confetti': 'effects.js',
  'x-confirm--trigger': 'overlay.js',
  'x-control': 'x-control.js',
  'x-copy--copied': 'copy.js',
  'x-countup': 'effects.js',
  'x-darkmode': 'darkmode.js',
  'x-demo': 'demo.js',
  'x-demo--measured': 'demo.js',
  'x-demo__source--unavailable': 'demo.js',
  'x-drawer': 'layouts.js, overlay.js',
  'x-error': 'error.js',
  'x-external': 'helpers.js',
  'x-fieldset': 'fieldset.js',
  'x-file': 'file.js',
  'x-fireworks': 'effects.js',
  'x-fix-card': 'fix-card.js',
  'x-form': 'form.js',
  'x-gallery__item': 'semantics/gallery.js',
  'x-globe': 'globe.js',
  'x-help': 'help.js',
  'x-lazy--loaded': 'helpers.js',
  'x-lazy--loading': 'helpers.js',
  'x-lightbox': 'overlay.js',
  'x-masked': 'masked.js',
  'x-modal': 'semantics/dialog.js',
  'x-modal--trigger': 'semantics/dialog.js',
  'x-move': 'move.js',
  'x-offcanvas--trigger': 'overlay.js',
  'x-parallax': 'effects.js',
  'x-popover--trigger': 'overlay.js',
  'x-pre__line-number--placed': 'semantics/pre.js',
  'x-prompt--trigger': 'overlay.js',
  'x-rating--half': 'semantics/rating.js',
  'x-relativetime': 'helpers.js',
  'x-resizable--resizing': 'resizable.js',
  'x-sheet--trigger': 'overlay.js',
  'x-slider': 'slider.js',
  'x-snow': 'effects.js',
  'x-sparkle': 'effects.js',
  'x-status': 'status.js',
  'x-textarea--has-counter': 'semantics/textarea.js',
  'x-themecontrol': 'themecontrol.js',
  'x-toast--trigger': 'feedback.js',
  'x-tooltip--trigger': 'tooltip.js',
  'x-validator': 'validator.js',
};

/** Only ever lowered. 64 when this gate was written; 54 after batch 1. */
const CEILING = 54;

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
    .filter((c) => !(c in UNSTYLED))
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
});
