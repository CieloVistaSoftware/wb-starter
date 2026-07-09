/**
 * <WB-DEMO> MARKUP INTEGRITY — EXAMPLE-BACKED REGRESSION TEST
 * ============================================================
 * scripts/test-wb-demo-integrity.mjs does the real scan across every
 * pages/*.html and demos/*.html file (wired into `npm test` and
 * `npm run test:compliance`). This spec locks in ITS behavior against
 * fixed example markup, independent of what real files currently contain
 * — so a future edit to the checker's regex can't silently stop catching
 * the bug it was written for.
 *
 * The bug (pages/behaviors.html, "Special Input Types" / "Masked Inputs"):
 * a self-closed <wb-demo></wb-demo> rendered as a blank box, and an
 * orphaned closing tag left three <input> elements as bare siblings with
 * no wrapper (no spacing, no </wb-demo>/<wb-demo> match).
 */

import { test, expect } from '@playwright/test';
import { scanHtml } from '../../scripts/test-wb-demo-integrity.mjs';

test.describe('<wb-demo> markup integrity — example fixtures', () => {
  test('a single wb-demo wrapping multiple inputs is valid (the correct pattern)', () => {
    const html = `
      <h3>Special Input Types</h3>
      <wb-demo>
        <input type="password" x-password placeholder="Password with toggle">
        <input type="text" x-search placeholder="Search with icon">
        <input type="text" x-colorpicker value="#6366f1">
      </wb-demo>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('a wb-demo with attributes (e.g. a title) is still recognized', () => {
    const html = `<wb-demo title="Copy functionality"><button x-copy>Copy</button></wb-demo>`;
    expect(scanHtml(html)).toEqual([]);
  });

  test('catches an empty self-closed <wb-demo></wb-demo> — renders as a blank box', () => {
    const html = `<wb-demo></wb-demo>`;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('empty'))).toBe(true);
  });

  test('catches an orphaned closing </wb-demo> with no matching open tag', () => {
    // The exact real-world shape: <wb-demo></wb-demo> immediately followed
    // by bare <input> siblings, then a stray </wb-demo> left over from a
    // botched edit.
    const html = `
      <wb-demo></wb-demo>
      <input type="password" x-password placeholder="Password with toggle">
      <input type="text" x-search placeholder="Search with icon">
      </wb-demo>
    `;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
    expect(issues.some((i) => i.includes('empty'))).toBe(true);
  });

  test('catches a wb-demo missing its closing tag entirely', () => {
    const html = `<wb-demo><input type="text"></section>`;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
  });

  test('ignores <wb-demo> mentioned inside an HTML comment', () => {
    const html = `<!-- one <wb-demo> per element (live control + its own source) -->
      <wb-demo><button>ok</button></wb-demo>`;
    expect(scanHtml(html)).toEqual([]);
  });
});
