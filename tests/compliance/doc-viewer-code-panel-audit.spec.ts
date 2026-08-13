import { test, expect } from '@playwright/test';

/**
 * DOC-VIEWER CODE PANEL AUDIT — "show all the code, no blank lines, no text
 * wrapping" (John, live on /public/doc-viewer.html?file=docs%2Fstandards%2F
 * V3-STANDARDS.md).
 *
 * Written generally enough to run against ANY doc rendered through
 * doc-viewer.html — add more paths to DOCS below to widen the sweep. The
 * initial run this test exists to support is scoped to V3-STANDARDS.md per
 * the audit request; see docs/_today/audit-code-panels-v3-standards.md for
 * the write-up of whatever this test finds.
 *
 * This is an AUDIT test, not a fix. It only measures and reports; it is not
 * gated into `npm run test:compliance` behind other work in this session.
 *
 * Scope: every `.wb-demo__code` panel (the <pre x-behavior="pre"> that
 * <wb-demo> builds for its "view source" sample — see
 * src/wb-viewmodels/demo.js's `pre.className = 'wb-demo__code'` and its
 * sibling `wb-demo__events-code` panel for the optional "Listening for
 * events" sample, §27). Three checks, matching
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md:
 *
 *   (a) §28 "show all the code" — the panel must never be sized NARROWER
 *       than its own content (scrollWidth > clientWidth forces the reader
 *       to scroll to see code that should just be visible/scrollable-only-
 *       when-genuinely-too-long). This is the #560/#563 family of bugs.
 *       NOTE: §28 explicitly permits a horizontal scrollbar for a line that
 *       is genuinely longer than the panel's own max-width — that is not a
 *       violation of this check by itself unless it means the panel is
 *       narrower than it was actually laid out to be (see the audit report
 *       for how each flagged case was classified).
 *
 *   (b) No blank lines that don't exist in the actual rendered text.
 *       <wb-demo>'s own pretty-printer (`formatHtml` in demo.js) never
 *       emits an empty line — every pushed line has trimmed content — so a
 *       genuinely blank VISUAL row in one of these panels is either (i) a
 *       real blank line that exists in the rendered text content (e.g.
 *       `buildEventListenerCode`'s `\n\n` join between multiple event
 *       listeners in a `wb-demo__events-code` panel — legitimate, author-
 *       intended spacing) or (ii) a rendering artifact where the line-
 *       number gutter's positions drift out of sync with the actual text
 *       (issue #559: a wrapped line's number never gets positioned,
 *       leaving a visual gap that reads as a phantom blank line). This
 *       check flags case (ii) specifically: it walks the rendered
 *       `.x-pre__line-numbers > div` top offsets and compares each
 *       consecutive gap to the panel's own single-line-height — a gap that
 *       is not ~1x line-height does not correspond to the text, which
 *       either has exactly as many real lines as numbers (blank or not).
 *
 *   (c) §6/§28/pre.css "no text wrapping" — `.wb-demo__code` is a pre.js
 *       `x-pre` block with no `wrap` attribute, so pre.css's default
 *       (`white-space: pre; overflow-x: auto`) must apply. A line that
 *       wraps to multiple visual rows both breaks this convention and is
 *       the trigger condition for the #559 phantom-blank-line bug above.
 */

const DOCS = [
  'docs/standards/V3-STANDARDS.md',
  // Add more docs/**/*.md paths here to widen the sweep beyond V3-STANDARDS.md.
];

const NARROW_TOLERANCE_PX = 2; // sub-pixel rounding only
const LINE_HEIGHT_TOLERANCE_PX = 3; // sub-pixel rounding only

interface PanelReport {
  file: string;
  demoIndex: number;
  panelIndex: number;
  panelClass: string;
  label: string; // first non-empty line of the panel, for identifying the example
  scrollWidth: number;
  clientWidth: number;
  whiteSpace: string;
  lineCount: number;
  gutterCount: number;
  lineHeightPx: number;
  gaps: number[]; // consecutive gutter-number top deltas
  rawLines: string[];
}

async function collectPanelReports(page: import('@playwright/test').Page, file: string): Promise<PanelReport[]> {
  await page.goto('/public/doc-viewer.html?file=' + encodeURIComponent(file), {
    waitUntil: 'domcontentloaded',
  });

  const demos = page.locator('wb-demo');
  await expect(demos.first()).toBeVisible({ timeout: 20000 });

  // wb-demo.js only builds the first EAGER_BUILD_COUNT (5) blocks
  // synchronously on connect; every block after that is deferred to an
  // IntersectionObserver keyed to #siteBody (the real scroll container,
  // not the viewport) and only builds once scrolled near it. A doc with
  // more than 5 <wb-demo> blocks would otherwise silently audit only the
  // first 5 and miss real violations further down the page — scroll every
  // block into view first so "all the code" actually means all of it.
  const total = await demos.count();
  for (let i = 0; i < total; i++) {
    await demos.nth(i).scrollIntoViewIfNeeded();
  }

  // Deterministic wait, not a fixed timeout: pre.js positions each
  // line-number's `top` via a double-rAF-deferred measurement pass
  // (measureAndPosition in src/wb-viewmodels/semantics/pre.js), and under
  // worker contention (this file runs 3 tests in parallel) that can take
  // longer than any one fixed delay covers for every panel on the page. A
  // fixed `waitForTimeout` here previously caused a real flake: run in
  // isolation (1 worker) demo[3]'s gutter was fully positioned by 700ms
  // and its irregular gaps were correctly flagged; run alongside the other
  // two tests (2 workers) the SAME panel's gutter hadn't finished
  // positioning yet, "gutterCount === 0" made the code below silently skip
  // it, and a real violation went unreported. Poll until every panel's
  // line-number gutter is fully built (count matches its own text's line
  // count) AND every number has a real, non-empty `top` — i.e. pre.js's
  // measureAndPosition has actually run for it — rather than assuming a
  // fixed delay was enough.
  await page.waitForFunction(
    () => {
      const demoEls = Array.from(document.querySelectorAll('wb-demo'));
      if (demoEls.length === 0) return false;
      return demoEls.every((demo) => {
        const panels = Array.from(demo.querySelectorAll('.wb-demo__code'));
        if (panels.length === 0) return false; // this demo's code panel hasn't been built yet
        return panels.every((panel) => {
          const code = panel.querySelector('code');
          const text = (code || panel).textContent || '';
          const lines = text.split('\n');
          if (lines.length && lines[lines.length - 1] === '') lines.pop();

          const wrapper = panel.closest('.x-pre-wrapper');
          if (!wrapper) return false;
          const nums = Array.from(wrapper.querySelectorAll('.x-pre__line-numbers > div')) as HTMLElement[];
          if (nums.length !== lines.length) return false; // gutter still being built
          return nums.every((n) => n.style.top !== ''); // every number actually positioned
        });
      });
    },
    { timeout: 15000 }
  );

  return page.evaluate((fileArg) => {
    const out: PanelReport[] = [];
    const demoEls = Array.from(document.querySelectorAll('wb-demo'));
    demoEls.forEach((demo, demoIndex) => {
      const panels = Array.from(demo.querySelectorAll('.wb-demo__code')) as HTMLElement[];
      panels.forEach((panel, panelIndex) => {
        const code = panel.querySelector('code');
        const text = (code || panel).textContent || '';
        const rawLines = text.split('\n');
        // pre.js pops a single trailing empty line (common artifact of
        // <pre><code>text\n</code></pre>) before building the gutter — mirror
        // that here so line counts line up with what pre.js itself numbered.
        if (rawLines.length && rawLines[rawLines.length - 1] === '') rawLines.pop();

        const wrapper = panel.closest('.x-pre-wrapper');
        const gutterEls = wrapper
          ? (Array.from(wrapper.querySelectorAll('.x-pre__line-numbers > div')) as HTMLElement[])
          : [];
        const gaps: number[] = [];
        const tops = gutterEls.map((el) => parseFloat(el.style.top || getComputedStyle(el).top) || 0);
        for (let i = 1; i < tops.length; i++) gaps.push(tops[i] - tops[i - 1]);

        const cs = getComputedStyle(panel);
        const lineHeightPx = parseFloat(cs.lineHeight) || 0;

        const firstNonEmpty = rawLines.find((l) => l.trim() !== '') || '';
        out.push({
          file: fileArg,
          demoIndex,
          panelIndex,
          panelClass: panel.className,
          label: firstNonEmpty.trim().slice(0, 60),
          scrollWidth: panel.scrollWidth,
          clientWidth: panel.clientWidth,
          whiteSpace: cs.whiteSpace,
          lineCount: rawLines.length,
          gutterCount: gutterEls.length,
          lineHeightPx,
          gaps,
          rawLines,
        });
      });
    });
    return out;
  }, file);
}

test.describe('Doc-viewer code panel audit (a) — show all the code, no horizontal cutoff', () => {
  for (const file of DOCS) {
    test(`${file}: every .wb-demo__code panel is never narrower than its own content`, async ({ page }) => {
      const reports = await collectPanelReports(page, file);
      expect(reports.length, `${file} should render at least one .wb-demo__code panel`).toBeGreaterThan(0);

      const violations = reports
        .filter((r) => r.scrollWidth > r.clientWidth + NARROW_TOLERANCE_PX)
        .map(
          (r) =>
            `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": scrollWidth=${r.scrollWidth}px > ` +
            `clientWidth=${r.clientWidth}px — content is cut off / needs a scrollbar to see all the code`
        );

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Doc-viewer code panel audit (b) — no spurious blank lines', () => {
  for (const file of DOCS) {
    test(`${file}: line-number gutter spacing matches the actual rendered text (no phantom blank rows, #559)`, async ({ page }) => {
      const reports = await collectPanelReports(page, file);
      expect(reports.length, `${file} should render at least one .wb-demo__code panel`).toBeGreaterThan(0);

      const violations: string[] = [];
      for (const r of reports) {
        if (r.gutterCount === 0) continue; // no line-number gutter on this panel — nothing to check

        if (r.gutterCount !== r.lineCount) {
          violations.push(
            `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": line-number gutter shows ${r.gutterCount} ` +
              `numbers but the rendered text has ${r.lineCount} lines — gutter/text line count mismatch`
          );
          continue;
        }

        if (r.lineHeightPx <= 0) continue; // couldn't resolve a numeric line-height, skip spacing check

        r.gaps.forEach((gap, i) => {
          const expectedGap = r.lineHeightPx;
          if (Math.abs(gap - expectedGap) > LINE_HEIGHT_TOLERANCE_PX) {
            const sourceLine = r.rawLines[i + 1] ?? '';
            const isRealBlank = sourceLine.trim() === '';
            violations.push(
              `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": gap between rendered line ${i + 1} and ` +
                `${i + 2} is ${gap.toFixed(1)}px, expected ~${expectedGap.toFixed(1)}px (1x line-height) — ` +
                `line ${i + 2} of the actual text is ${isRealBlank ? 'a real blank line, but the gap size is still off (visual/measurement drift)' : `NOT blank ("${sourceLine.trim().slice(0, 40)}") yet renders with a gap consistent with an extra blank row (phantom blank line, #559-style)`}`
            );
          }
        });
      }

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Doc-viewer code panel audit (c) — no text wrapping', () => {
  for (const file of DOCS) {
    test(`${file}: every .wb-demo__code panel uses white-space:pre (never wraps)`, async ({ page }) => {
      const reports = await collectPanelReports(page, file);
      expect(reports.length, `${file} should render at least one .wb-demo__code panel`).toBeGreaterThan(0);

      const violations = reports
        .filter((r) => r.whiteSpace !== 'pre')
        .map(
          (r) =>
            `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": computed white-space is "${r.whiteSpace}", ` +
            `expected "pre" — this panel's long lines will wrap instead of scrolling horizontally, breaking ` +
            `mid-identifier per DEMOS-AND-DOCS-STANDARDS.md §6/§28`
        );

      expect(violations, `${file}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
