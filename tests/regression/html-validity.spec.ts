/**
 * HTML Validity Regression Test
 * =============================
 * Catches structural HTML defects — a closing tag for a void element, a close
 * that matches nothing open, a mis-nested close, an unclosed container — the
 * things that actually break rendering.
 *
 * WHAT THIS USED TO DO
 *
 * It ran four regex heuristics, the first of which was `/>\s*$/gm`: "a line
 * ending in `>`". That matches nearly every line of well-formed HTML, so this
 * spec called all ten of its files malformed and had been failing on correct
 * markup — 10 of the regression project's failures were this one check crying
 * wolf.
 *
 * Its tag-balance check was worse than useless: it compared raw open/close
 * COUNTS with a `- 5` fudge factor, so five mismatched tags passed silently,
 * and `</input>` closing three `<div>`s — the real defect that once hung the
 * renderer (fa954d5c) — balances perfectly by count and sailed straight
 * through.
 *
 * A checker that fires on valid input teaches people to ignore it, which is
 * how a real defect gets to ship past a green-looking gate. The parse now
 * lives in scripts/lib/html-structure.mjs and reports only unambiguous
 * defects; an omitted `</li>` or `</td>` is valid HTML and is not one.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { findStructuralErrors } from '../../scripts/lib/html-structure.mjs';

// Full documents — these own a DOCTYPE, <html> and <body>.
const DOCUMENTS = [
  'demos/site/index.html',
  'demos/site/content.html',
  'demos/site/cards.html',
  'demos/site/feedback.html',
  'demos/site/forms.html',
  'demos/site/overlays.html',
  'demos/site/layout.html',
];

// FRAGMENTS. pages/*.html are injected into the SPA shell -- home.html's own
// header says `fragment=true`. Requiring a DOCTYPE of them was a category
// error: a fragment that HAD one would be the defect. They still get the
// structural check, which is what actually matters for them.
const FRAGMENTS = [
  'pages/home.html',
  'pages/behaviors.html',
];

const DEMO_FILES = [...DOCUMENTS, ...FRAGMENTS];

test.describe('HTML Validity', () => {
  test('the sweep actually ran', () => {
    const present = DEMO_FILES.filter((f) => fs.existsSync(path.join(process.cwd(), f)));
    expect(present.length, 'none of the listed demo files exist').toBe(DEMO_FILES.length);
  });

  for (const filePath of DEMO_FILES) {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) continue;

    test(`${filePath} has valid HTML structure`, () => {
      const errors = findStructuralErrors(fs.readFileSync(fullPath, 'utf-8'));
      expect(
        errors.map((e) => `line ${e.line}: ${e.message}`),
        `structural HTML defects in ${filePath}`,
      ).toEqual([]);
    });
  }

  test('the checker detects the defects it claims to', () => {
    // Pinned because the previous version of this spec detected NONE of them
    // while reporting every file as broken. A checker has to be checked.
    expect(findStructuralErrors('<div></div>'), 'flagged valid markup').toEqual([]);
    expect(findStructuralErrors('<ul><li>one<li>two</ul>'), 'flagged an omitted </li>').toEqual([]);
    expect(findStructuralErrors('<div><script>if (a > b) f = () => 1;</script></div>'),
      'flagged > inside a script').toEqual([]);

    expect(findStructuralErrors('<div></input></div>').length, 'missed </input>').toBeGreaterThan(0);
    expect(findStructuralErrors('<div></div></section>').length, 'missed an orphan close').toBeGreaterThan(0);
    expect(findStructuralErrors('<div><section></div>').length, 'missed a mis-nested close').toBeGreaterThan(0);
    expect(findStructuralErrors('<div><section>x</div>').length, 'missed an unclosed container').toBeGreaterThan(0);
  });

  test('every full document has a DOCTYPE and html/body tags', () => {
    for (const filePath of DOCUMENTS) {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.toLowerCase(), `${filePath} has no DOCTYPE`).toContain('<!doctype html');
      expect(content, `${filePath} has no <html>`).toMatch(/<html[^>]*>/i);
      expect(content, `${filePath} has no </html>`).toMatch(/<\/html>/i);
      expect(content, `${filePath} has no <body>`).toMatch(/<body[^>]*>/i);
      expect(content, `${filePath} has no </body>`).toMatch(/<\/body>/i);
    }
  });

  test('every fragment stays a fragment', () => {
    // The other half of the same rule: a fragment carrying <html>/<body> would
    // nest a whole document inside the SPA shell.
    for (const filePath of FRAGMENTS) {
      const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
      expect(content.toLowerCase(), `${filePath} is a fragment but declares a DOCTYPE`)
        .not.toContain('<!doctype');
      expect(content, `${filePath} is a fragment but has an <html> tag`).not.toMatch(/<html[^>]*>/i);
      expect(content, `${filePath} is a fragment but has a <body> tag`).not.toMatch(/<body[^>]*>/i);
    }
  });

  test('[x-demo] code panels contain valid HTML markup', async ({ page }) => {
    await page.goto('/demos/site/content.html');

    const codePanels = page.locator('.x-demo__code');
    const count = await codePanels.count();
    expect(count, 'no x-demo code panels rendered').toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const codeText = await codePanels.nth(i).textContent();
      if (codeText && codeText.length > 50) {
        expect(/<[a-z][^>]*>/i.test(codeText), `code panel ${i} lacks HTML tags`).toBe(true);
        if (codeText.includes('<tr>')) {
          expect(codeText.split('\n').length, `table code panel ${i} should be multi-line`).toBeGreaterThan(3);
        }
      }
    }
  });
});
