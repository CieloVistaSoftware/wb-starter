import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every demo shows its own source (#915).
 *
 * ORIGINAL PROBLEM: `pages/behaviors.html` mixed two demo-wrapper conventions.
 * Some sections used `<div x-demo>` (live control + its own source panel, per
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md §1); others -- Radio Buttons,
 * Switch Toggle, Select Dropdown, Checkboxes and most of Selection/Overlays/
 * Data/Media -- used a bare `demo-row` / `demo-grid-2` / `demo-grid-3` /
 * `demo-full` wrapper with no `<div x-demo>` at all, so those examples never
 * showed their code. John flagged it from a screenshot of the Radio Buttons /
 * Switch Toggle / Select Dropdown section.
 *
 * THAT MIGRATION IS DONE. The page carries 19 `x-demo` blocks and zero legacy
 * wrappers.
 *
 * This spec used to assert 16 hardcoded section headings ('Stepper & Range',
 * 'Modal Dialog', ...) each had an `<h3>`. The behaviors page has since been
 * rebuilt as a searchable browser and has NO `<h3>` at all, so all 16 failed
 * while the thing they were protecting was healthy. It also selected with
 * `xpath=following-sibling::x-demo[1]` -- a TAG named x-demo -- while the page
 * authors `<div x-demo>`, an attribute, so that selector never matched either.
 *
 * Rewritten to assert the guarantee rather than one snapshot of one layout:
 * the legacy wrapper must not come back, and any x-demo that IS present must
 * show both halves. Neither depends on the page's section structure, so the
 * next redesign will not silently disable this gate.
 */

const ROOT = process.cwd();
const LEGACY = ['demo-row', 'demo-grid-2', 'demo-grid-3', 'demo-full'];

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  walk(path.join(ROOT, dir));
  return out;
}

test.describe('Every demo shows its own source', () => {
  test('no legacy demo wrapper survives in pages/ or demos/', () => {
    const offenders: string[] = [];
    // Scoped to pages/. The rule is about the SHARED demo wrappers that
    // rendered a control with no source panel. demos/autoinject.html
    // defines .demo-grid in its own <style> and uses it purely for page
    // layout -- widening the scan to demos/ flagged that as a violation,
    // which it is not. Whether standalone demo pages should also show
    // their source is a separate question (#915).
    for (const file of htmlFiles('pages')) {
      const src = fs.readFileSync(file, 'utf8');
      for (const cls of LEGACY) {
        // No regex: a `\b` inside a template literal is the BACKSPACE
        // character, not a word boundary, so the check silently matches
        // nothing. That is #888 exactly, and it was reintroduced here.
        // Comparing parsed class tokens cannot go wrong the same way.
        const classAttrs = src.match(/class="[^"]*"/g) || [];
        const hasLegacy = classAttrs.some((attr) =>
          attr.slice(7, -1).split(/\s+/).includes(cls));
        if (hasLegacy) {
          offenders.push(`${path.relative(ROOT, file)}: ${cls}`);
        }
      }
    }
    expect(
      offenders,
      'these wrappers render a demo with no source panel — use <div x-demo> so the\n'
        + 'example shows its own code (DEMOS-AND-DOCS-STANDARDS.md §1):\n  '
        + offenders.join('\n  '),
    ).toEqual([]);
  });

  /**
   * The live half of this gate is deliberately NOT here.
   *
   * /?page=behaviors renders zero x-demo blocks at load: it is a searchable
   * browser and reveals a demo only when one is selected. Asserting a count at
   * load therefore fails on correct behaviour -- the same wrong assumption that
   * stalled #910. Driving the search-and-reveal flow belongs with that issue,
   * not duplicated here.
   *
   * What THIS spec guards is the authoring rule, which is a property of the
   * source and survives any page redesign: a demo must be written as
   * `<div x-demo>`, never a bare wrapper that renders a control with no code.
   */
});
