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

  // #453: demos/frameworks.html false-positived "2 open vs 1 close" because
  // a JS `//` line comment inside a <script type="module"> block literally
  // said "single <wb-demo> (the HTMX section)..." -- stripComments() only
  // stripped HTML <!--...--> comments, so the bare <wb-demo> text inside the
  // JS comment matched OPEN_RE as a second, false "open" tag.
  test('ignores <wb-demo> mentioned inside a JS // comment in a <script> block', () => {
    const html = `
      <wb-demo><button>real demo</button></wb-demo>
      <script type="module">
        // This page's single <wb-demo> (the HTMX section) sits far below the fold.
        const soleDemo = document.querySelector('wb-demo');
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('ignores <wb-demo> mentioned inside a JS /* */ block comment in a <script> block', () => {
    const html = `
      <wb-demo><button>real demo</button></wb-demo>
      <script type="module">
        /* only one <wb-demo> on this page, see the HTMX section below */
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('does not mistake // inside a JS string (e.g. a URL) for a comment', () => {
    const html = `
      <wb-demo><button>real demo</button></wb-demo>
      <script type="module">
        const url = 'https://example.com/wb-demo/not-a-tag';
        // a real comment mentioning <wb-demo> again here
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('still catches a genuinely unbalanced <wb-demo> even with a script block present', () => {
    const html = `
      <wb-demo><button>one</button></wb-demo>
      <wb-demo><input type="text">
      <script type="module">
        // unrelated comment, not mentioning the tag at all
        const x = 1;
      </script>
    `;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
  });
});
