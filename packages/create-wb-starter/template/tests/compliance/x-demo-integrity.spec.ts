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
 * a self-closed <div x-demo></div> rendered as a blank box, and an
 * orphaned closing tag left three <input> elements as bare siblings with
 * no wrapper (no spacing, no </div>/<div x-demo> match).
 */

import { test, expect } from '@playwright/test';
import { scanHtml } from '../../scripts/test-wb-demo-integrity.mjs';

test.describe('<div x-demo> markup integrity — example fixtures', () => {
  test('a single x-demo wrapping multiple inputs is valid (the correct pattern)', () => {
    const html = `
      <h3>Special Input Types</h3>
      <div x-demo>
        <input type="password" x-password placeholder="Password with toggle">
        <input type="text" x-search placeholder="Search with icon">
        <input type="text" x-colorpicker value="#6366f1">
      </div>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('a x-demo with attributes (e.g. a title) is still recognized', () => {
    const html = `<div x-demo title="Copy functionality"><button x-copy>Copy</button></div>`;
    expect(scanHtml(html)).toEqual([]);
  });

  test('catches an empty self-closed <div x-demo></div> — renders as a blank box', () => {
    const html = `<div x-demo></div>`;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('empty'))).toBe(true);
  });

  test('catches an orphaned closing </div> with no matching open tag', () => {
    // The exact real-world shape: <div x-demo></div> immediately followed
    // by bare <input> siblings, then a stray </div> left over from a
    // botched edit.
    const html = `
      <div x-demo></div>
      <input type="password" x-password placeholder="Password with toggle">
      <input type="text" x-search placeholder="Search with icon">
      </div>
    `;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
    expect(issues.some((i) => i.includes('empty'))).toBe(true);
  });

  test('catches a x-demo missing its closing tag entirely', () => {
    const html = `<div x-demo><input type="text"></section>`;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
  });

  test('ignores <div x-demo> mentioned inside an HTML comment', () => {
    const html = `<!-- one <div x-demo> per element (live control + its own source) -->
      <div x-demo><button>ok</button></div>`;
    expect(scanHtml(html)).toEqual([]);
  });

  // #453: demos/frameworks.html false-positived "2 open vs 1 close" because
  // a JS `//` line comment inside a <script type="module"> block literally
  // said "single <div x-demo> (the HTMX section)..." -- stripComments() only
  // stripped HTML <!--...--> comments, so the bare <div x-demo> text inside the
  // JS comment matched OPEN_RE as a second, false "open" tag.
  test('ignores <div x-demo> mentioned inside a JS // comment in a <script> block', () => {
    const html = `
      <div x-demo><button>real demo</button></div>
      <script type="module">
        // This page's single <div x-demo> (the HTMX section) sits far below the fold.
        const soleDemo = document.querySelector('x-demo');
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('ignores <div x-demo> mentioned inside a JS /* */ block comment in a <script> block', () => {
    const html = `
      <div x-demo><button>real demo</button></div>
      <script type="module">
        /* only one <div x-demo> on this page, see the HTMX section below */
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('does not mistake // inside a JS string (e.g. a URL) for a comment', () => {
    const html = `
      <div x-demo><button>real demo</button></div>
      <script type="module">
        const url = 'https://example.com/x-demo/not-a-tag';
        // a real comment mentioning <div x-demo> again here
      </script>
    `;
    expect(scanHtml(html)).toEqual([]);
  });

  test('still catches a genuinely unbalanced <div x-demo> even with a script block present', () => {
    const html = `
      <div x-demo><button>one</button></div>
      <div x-demo><input type="text">
      <script type="module">
        // unrelated comment, not mentioning the tag at all
        const x = 1;
      </script>
    `;
    const issues = scanHtml(html);
    expect(issues.some((i) => i.includes('unbalanced'))).toBe(true);
  });
});
