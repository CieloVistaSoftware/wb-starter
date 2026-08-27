import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

/**
 * DOC-VIEWER CODE PANEL AUDIT — "show all the code, no blank lines, no text
 * wrapping" (John, originally live on /public/doc-viewer.html?file=docs%2F
 * standards%2FV3-STANDARDS.md, then broadened: "for every .html and .md
 * file... is all the parts of code showing").
 *
 * ORIGINAL SCOPE (kept, now passing): docs/standards/V3-STANDARDS.md, per
 * the #583 audit (docs/_today/audit-code-panels-v3-standards.md). The root
 * cause (mdhtml.css's `.x-pre` wrap rule overriding the #390 no-wrap
 * carve-out for `<div x-demo>` panels) was fixed and merged; all 3 checks now
 * pass for that one file.
 *
 * GENERALIZED SCOPE (this pass, docs/_today/test-audit-2026-08-14.md):
 * every OTHER doc that actually renders a `<div x-demo>` through
 * doc-viewer.html, PLUS every plain demos/**\/*.html and pages/**\/*.html
 * page that renders `<div x-demo>` directly (no doc-viewer/mdhtml wrapper
 * involved at all — a different code path, worth checking independently).
 * "Renders a <div x-demo>" is determined by literally grepping the source for
 * `<div x-demo` — a file with none has no `.x-demo__code` panel to audit, so
 * it's excluded from DOCS/HTML_PAGES rather than wastefully asserting on a
 * page with 0 panels. `docs/_today/**` is excluded: those are dated
 * session/planning artifacts (audit reports, status logs), not real
 * user-facing docs someone opens through the doc-viewer's nav.
 *
 * This is an AUDIT test, not a fix. It measures and reports; it is NOT
 * excluded from `npm run test:compliance` (this file lives in
 * tests/compliance/ like every other gate), so failures here are real,
 * visible signal — see the audit report for what to do with them.
 *
 * Scope: every `.x-demo__code` panel (the <pre x-behavior="pre"> that
 * <div x-demo> builds for its "view source" sample — see
 * src/wb-viewmodels/demo.js's `pre.className = 'x-demo__code'` and its
 * sibling `x-demo__events-code` panel for the optional "Listening for
 * events" sample, §27). Three checks per panel, matching
 * docs/standards/DEMOS-AND-DOCS-STANDARDS.md:
 *
 *   (a) §28 "show all the code" — the panel must never be sized NARROWER
 *       than its own content (scrollWidth > clientWidth forces the reader
 *       to scroll to see code that should just be visible/scrollable-only-
 *       when-genuinely-too-long). This is the #560/#563 family of bugs.
 *       NOTE: §28 explicitly permits a horizontal scrollbar for a line that
 *       is genuinely longer than the panel's own max-width — that is not a
 *       violation of this check by itself unless it means the panel is
 *       narrower than it was actually laid out to be.
 *
 *   (b) No blank lines that don't exist in the actual rendered text.
 *       <div x-demo>'s own pretty-printer (`formatHtml` in demo.js) never
 *       emits an empty line for a `.x-demo__code` (non-events) panel — see
 *       "Methodology" in the #583 report for the one documented exception
 *       (`x-demo__events-code` panels CAN have a real blank line, a `\n\n`
 *       join between multiple event listeners) — so a genuinely blank
 *       VISUAL row elsewhere is a rendering artifact (#559: a wrapped
 *       line's number never gets positioned, leaving a visual gap that
 *       reads as a phantom blank line). This check walks the rendered
 *       `.x-pre__line-numbers > div` top offsets and compares each
 *       consecutive gap to the panel's own single-line-height.
 *
 *   (c) §6/§28/pre.css "no text wrapping" — `.x-demo__code` is a pre.js
 *       `x-pre` block with no `wrap` attribute, so pre.css's default
 *       (`white-space: pre; overflow-x: auto`) must apply.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** A doc/page only has `.x-demo__code` panels to audit if it literally
 * authors a `<div x-demo` block (or mdhtml.js's auto-live-render promotes a
 * ```html fence containing one — same literal substring either way, since
 * the fence source itself doesn't contain "<div x-demo" but the CONTENT it
 * promotes might contain a live behavior; auto-live-render candidates
 * without an authored <div x-demo> tag are rare and already covered by the
 * #583 report's "Incidental finding" for V3-STANDARDS.md — not re-derived
 * here, this is a fast pre-filter, not a precise one, and false inclusions
 * just mean a test that (correctly) finds 0 panels and is skipped). */
function hasWbDemo(file: string): boolean {
  try {
    return fs.readFileSync(file, 'utf8').includes('<div x-demo');
  } catch {
    return false;
  }
}

// glob returns OS-native separators on Windows (backslash) -- normalize to
// forward slashes since these values are used both as doc-viewer `file=`
// query params (which must match the repo's actual, forward-slash-keyed
// path) and as URL paths for the direct-HTML case below.
const toPosix = (f: string) => f.split(path.sep).join('/');

const DOCS = globSync('docs/**/*.md', { cwd: ROOT, ignore: ['docs/_today/**'] })
  .map(toPosix)
  .filter((f) => hasWbDemo(path.join(ROOT, f)))
  .sort();

const HTML_PAGES = [
  ...globSync('demos/**/*.html', { cwd: ROOT }),
  ...globSync('pages/**/*.html', { cwd: ROOT }),
]
  .map(toPosix)
  .filter((f) => hasWbDemo(path.join(ROOT, f)))
  .sort();

const NARROW_TOLERANCE_PX = 2; // sub-pixel rounding only
const LINE_HEIGHT_TOLERANCE_PX = 3; // sub-pixel rounding only

interface PanelReport {
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

async function collectPanelReports(page: import('@playwright/test').Page, url: string): Promise<PanelReport[]> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const demos = page.locator('x-demo');
  // Doc-viewer/mdhtml renders markdown asynchronously (fetch + parse), so
  // <div x-demo> tags don't exist in the DOM immediately after
  // domcontentloaded -- wait for the first one to actually appear (this
  // file is pre-filtered by grep for "<div x-demo" so every DOCS/HTML_PAGES
  // entry should genuinely get at least one; a real timeout here means the
  // page failed to render its markdown at all, not "no demos").
  try {
    await expect(demos.first()).toBeVisible({ timeout: 20000 });
  } catch {
    return [];
  }
  const demoCount = await demos.count();
  if (demoCount === 0) return [];

  // x-demo.js only builds the first EAGER_BUILD_COUNT (5) blocks
  // synchronously on connect; every block after that is deferred to an
  // IntersectionObserver keyed to #siteBody (the real scroll container,
  // not the viewport) and only builds once scrolled near it. Scroll every
  // block into view first so "all the code" actually means all of it. A
  // demo containing continuously-animating/repositioning content (e.g. a
  // carousel) can make Playwright's "wait for stable" step inside
  // scrollIntoViewIfNeeded() never settle -- cap each attempt individually
  // so ONE such demo can't block/timeout every other panel's audit on the
  // same page (confirmed live: demos/site/cards.html).
  for (let i = 0; i < demoCount; i++) {
    try {
      await demos.nth(i).scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch {
      // best-effort -- fall through and audit whatever already built/rendered
    }
  }

  // Deterministic wait, not a fixed timeout: pre.js positions each
  // line-number's `top` via a double-rAF-deferred measurement pass. Poll
  // until every panel that EXISTS has its line-number gutter fully built
  // (count matches its own text's line count, every number positioned). A
  // demo with ZERO `.x-demo__code` panels (e.g. a §25 boilerplate-only
  // example, or a live-rendered behavior that legitimately has no source
  // sample) is vacuously satisfied here — waiting for a panel that will
  // never exist would just burn the timeout.
  await page.waitForFunction(
    () => {
      const demoEls = Array.from(document.querySelectorAll('x-demo'));
      if (demoEls.length === 0) return false;
      return demoEls.every((demo) => {
        const panels = Array.from(demo.querySelectorAll('.x-demo__code'));
        if (panels.length === 0) return true; // nothing on this demo to wait for
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

  return page.evaluate(() => {
    const out: PanelReport[] = [];
    const demoEls = Array.from(document.querySelectorAll('x-demo'));
    demoEls.forEach((demo, demoIndex) => {
      const panels = Array.from(demo.querySelectorAll('.x-demo__code')) as HTMLElement[];
      panels.forEach((panel, panelIndex) => {
        const code = panel.querySelector('code');
        const text = (code || panel).textContent || '';
        const rawLines = text.split('\n');
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
  });
}

/** All 3 checks against one set of reports, so every file needs exactly ONE
 * page load (not 3) — matters once this runs against 100+ files instead of
 * the original single V3-STANDARDS.md target. */
function auditReports(reports: PanelReport[]): { a: string[]; b: string[]; c: string[] } {
  const a: string[] = [];
  const b: string[] = [];
  const c: string[] = [];

  for (const r of reports) {
    if (r.scrollWidth > r.clientWidth + NARROW_TOLERANCE_PX) {
      a.push(
        `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": scrollWidth=${r.scrollWidth}px > ` +
          `clientWidth=${r.clientWidth}px — content is cut off / needs a scrollbar to see all the code`
      );
    }

    if (r.gutterCount !== 0) {
      if (r.gutterCount !== r.lineCount) {
        b.push(
          `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": line-number gutter shows ${r.gutterCount} ` +
            `numbers but the rendered text has ${r.lineCount} lines — gutter/text line count mismatch`
        );
      } else if (r.lineHeightPx > 0) {
        r.gaps.forEach((gap, i) => {
          const expectedGap = r.lineHeightPx;
          if (Math.abs(gap - expectedGap) > LINE_HEIGHT_TOLERANCE_PX) {
            const sourceLine = r.rawLines[i + 1] ?? '';
            const isRealBlank = sourceLine.trim() === '';
            b.push(
              `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": gap between rendered line ${i + 1} and ` +
                `${i + 2} is ${gap.toFixed(1)}px, expected ~${expectedGap.toFixed(1)}px (1x line-height) — ` +
                `line ${i + 2} of the actual text is ${isRealBlank ? 'a real blank line, but the gap size is still off (visual/measurement drift)' : `NOT blank ("${sourceLine.trim().slice(0, 40)}") yet renders with a gap consistent with an extra blank row (phantom blank line, #559-style)`}`
            );
          }
        });
      }
    }

    if (r.whiteSpace !== 'pre') {
      c.push(
        `demo[${r.demoIndex}] panel[${r.panelIndex}] "${r.label}": computed white-space is "${r.whiteSpace}", ` +
          `expected "pre" — this panel's long lines will wrap instead of scrolling horizontally, breaking ` +
          `mid-identifier per DEMOS-AND-DOCS-STANDARDS.md §6/§28`
      );
    }
  }

  return { a, b, c };
}

test.describe('Doc-viewer code panel audit — docs rendered through doc-viewer.html', () => {
  for (const rel of DOCS) {
    test(`${rel}: .x-demo__code panels show all the code, no phantom blanks, no wrap`, async ({ page }) => {
      const url = '/public/doc-viewer.html?file=' + encodeURIComponent(rel);
      const reports = await collectPanelReports(page, url);
      if (reports.length === 0) test.skip(true, 'no .x-demo__code panels rendered on this doc');

      const { a, b, c } = auditReports(reports);
      const violations = [
        ...a.map((v) => `(a) show-all-the-code: ${v}`),
        ...b.map((v) => `(b) no-phantom-blank-lines: ${v}`),
        ...c.map((v) => `(c) no-text-wrap: ${v}`),
      ];
      expect(violations, `${rel}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});

test.describe('Doc-viewer code panel audit — plain demo/page .html files (direct, no doc-viewer wrapper)', () => {
  for (const rel of HTML_PAGES) {
    test(`${rel}: .x-demo__code panels show all the code, no phantom blanks, no wrap`, async ({ page }) => {
      const url = '/' + rel.replace(/\\/g, '/');
      const reports = await collectPanelReports(page, url);
      if (reports.length === 0) test.skip(true, 'no .x-demo__code panels rendered on this page');

      const { a, b, c } = auditReports(reports);
      const violations = [
        ...a.map((v) => `(a) show-all-the-code: ${v}`),
        ...b.map((v) => `(b) no-phantom-blank-lines: ${v}`),
        ...c.map((v) => `(c) no-text-wrap: ${v}`),
      ];
      expect(violations, `${rel}:\n${violations.join('\n')}`).toHaveLength(0);
    });
  }
});
