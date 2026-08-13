# Audit: `.wb-demo__code` panels on `docs/standards/V3-STANDARDS.md` via doc-viewer

**Date:** 2026-08-13
**Trigger:** live report — "write tests for this that tests all code to show all the code,
no blank lines, no text wrapping. then put it into an audit report for me to review."
**Scope:** `http://localhost:3000/public/doc-viewer.html?file=docs%2Fstandards%2FV3-STANDARDS.md`
— every `.wb-demo__code` panel on the page (the `<pre x-behavior="pre">` block `<wb-demo>`
builds to show its "view source" sample; see `src/wb-viewmodels/demo.js`).
**This is an audit only.** Nothing was fixed. See "Recommended fix priority" at the
bottom for what to do next; do not treat this document as a changelog.

**Test:** `tests/compliance/doc-viewer-code-panel-audit.spec.ts` (new, committed alongside
this report). Reproduce with:

```
npx playwright test tests/compliance/doc-viewer-code-panel-audit.spec.ts --workers=2
```

## Summary

| # | Check | Standard | Result |
|---|-------|----------|--------|
| a | Show all the code — no horizontal cutoff (`scrollWidth <= clientWidth`) | §28 | **0 violations** (11/11 panels pass) — see caveat below |
| b | No spurious blank lines (line-number gutter matches actual text) | pre.js / #559 | **14 violations** across 4 of 11 panels |
| c | No text wrapping (`white-space: pre`, never `pre-wrap`) | §6, §28, pre.css | **11 violations — every single panel on the page (11/11)** |

The doc renders **11** `.wb-demo__code` panels total (10 authored `<wb-demo>` blocks in
the markdown source, plus 1 more — see "Incidental finding" below). All three checks were
run against every one of them.

**Important interaction between (a) and (c):** check (a) shows zero violations, but not
because the panels are healthy — it's a direct *consequence* of (c) failing. Once a panel
wraps (`white-space: pre-wrap`), long content reflows to fit the box instead of
overflowing it, so `scrollWidth` can never exceed `clientWidth`. The two failure modes are
mutually exclusive symptoms of the same root cause (whether wrap is active), not two
independent healthy signals. If (c) is fixed and wrapping is turned off, check (a) becomes
the one that actually verifies panels aren't clipped — keep it in the suite.

## Root cause (single root cause explains both (b) and (c))

**`src/styles/behaviors/mdhtml.css` lines 150-172:**

```css
/* §6: pre.js (x-behavior="pre") defaults to editor-style no-wrap
   (src/wb-viewmodels/semantics/pre.js, defaultWrap=false, #199) — the right
   call for wb-demo's live code samples elsewhere, but wrong for prose docs
   viewed through doc-viewer.html, where the project standard is now "no
   horizontal scrollbars on code" (supersedes #195). ... */
wb-mdhtml .x-pre,
.wb-mdhtml .x-pre {
  white-space: pre-wrap;
  overflow-x: auto;
  word-break: break-word;
  overflow-wrap: break-word;
  text-indent: 2ch hanging each-line;
}
```

This rule is a **documented, deliberate** decision — its own comment explains it
supersedes an older rule (#195) so that plain prose-doc code blocks viewed through
doc-viewer.html wrap instead of scrolling. The problem: its selector, `.x-pre` (any
pre.js-enhanced block), is not scoped to exclude `<wb-demo>`-generated panels — and
`docs/standards/DEMOS-AND-DOCS-STANDARDS.md` §6 explicitly carves those out as the
opposite case:

> **Carve-out for `<wb-demo>`-generated code panels specifically (#390):** these use
> horizontal scroll instead of wrapping (`demo.js` omits the `wrap` attribute, so
> `pre.css`'s default editor-style scrolling applies). Explicit override from John.

Because `.wb-demo__code` panels ARE `.x-pre` elements, and doc-viewer.html renders
markdown content inside `<wb-mdhtml>`, this later/more-specific mdhtml.css rule wins over
pre.css's own `.x-pre { white-space: pre; }` default (higher specificity: two selectors
vs. one class) **on every `<wb-demo>` viewed through the doc-viewer** — silently
overriding the #390 carve-out that §6 documents as John's explicit, still-standing
decision. This is the same *shape* of specificity bug as the padding conflict already
fixed for this exact rule family (`wb-mdhtml pre:not(.x-pre)`, see
`tests/compliance/mdhtml-pre-line-numbers-gutter.spec.ts`) — the earlier fix scoped
`:not(.x-pre)` on the un-enhanced `<pre>` rule, but the SEPARATE `.x-pre`-targeting rule
below it (added for #195) doesn't scope out `<wb-demo>` panels the same way.

Once wrapping is active, **check (b)'s violations are a direct downstream effect**: any
`<wb-demo>` source line long enough to wrap (an attribute value, mainly) spans multiple
visual rows, and pre.js's line-number gutter — whose positions ARE measured correctly
against the real (wrapped) text via `Range.getClientRects()` — shows large gaps between
consecutive numbers that don't match a single line-height. Visually this reads exactly
like the reported symptom: an apparent blank gap in the gutter next to a wrapped block of
text. This is the live mechanism behind issue #559 ("pre.js line-number gutter shows a
phantom blank line when a long attribute value word-wraps"), reproduced here on real
content rather than #559's own audio.md example.

## (c) No text wrapping — 11/11 panels violate

Every `.wb-demo__code` panel on the page has computed `white-space: pre-wrap` instead of
the required `pre`:

| Demo | Doc section | First line of source | Computed `white-space` |
|---|---|---|---|
| 0 | Component vs. Behavior → Component | `<wb-card` | `pre-wrap` |
| 1 | Component vs. Behavior → Component | `<wb-dialog title="Confirm action">` | `pre-wrap` |
| 2 | Component vs. Behavior → Behavior | `<button` (x-ripple) | `pre-wrap` |
| 3 | Component vs. Behavior → Behavior | `<a` (x-tooltip) | `pre-wrap` |
| 4 | Component vs. Behavior → Behavior | `<nav` (x-sticky) | `pre-wrap` |
| 5 | Naming and Attributes → Tags and behavior attributes | `<wb-badge variant="success">` | `pre-wrap` |
| 6 | Naming and Attributes → Tags and behavior attributes | `<button` (x-tooltip) | `pre-wrap` |
| 7 | Naming and Attributes → Configuration attributes | `<wb-card title="Hello" variant="glass" hoverable>` | `pre-wrap` |
| 8 | Examples → Component with semantic children | `<wb-article>` | `pre-wrap` |
| 9 | Examples → Native element with an explicit enhancement | `<button` (x-ripple, submit) | `pre-wrap` |
| 10 | Migration from Legacy Syntax (see incidental finding) | `<div` (x-card legacy example) | `pre-wrap` |

### Worst visual case, confirmed live: demo 3 (`<a x-tooltip="...">`)

Screenshotted live at the doc-viewer's default rendered width. The panel is only
~128px wide (it shrinks to fit the small "Release notes" link control above it, per
§7), and the `x-tooltip="Open the release notes"` attribute value wraps **character by
character** down the gutter — "x-", "toolti", "p="Ope", "n the", "releas", "e", "notes""
— seven visual rows for what should be one line of code. This is the practical impact of
the bug: not just a failed computed-style assertion, but genuinely unreadable code in the
narrower panels, and the exact "identifiers breaking mid-word" failure mode §6/§23
elsewhere in the same standards doc warn against.

## (b) No spurious blank lines — 14 violations across 4 panels

Detected by comparing the line-number gutter's rendered vertical spacing to a single
line-height (24px at the default font-size/line-height for these panels); any gap that
isn't ~1x line-height means the gutter numbers don't read as "one line each" the way an
un-wrapped panel would.

**demo 0 (`<wb-card>`, Component vs. Behavior → Component)** — 7 logical lines, 3 gaps
irregular:
- line 2→3 gap 72.0px (expected 24.0px) — line 3 is `variant="glass">`
- line 3→4 gap 72.0px — line 4 is `<p>`
- line 5→6 gap 72.0px — line 6 is `</p>`

**demo 1 (`<wb-dialog title="Confirm action">`, Component vs. Behavior → Component)** — 4
gaps irregular:
- line 1→2 gap 288.0px (12x expected) — line 2 is `<p>`
- line 2→3 gap 48.0px — line 3 is `Continue?`
- line 3→4 gap 96.0px — line 4 is `</p>`
- line 4→5 gap 72.0px — line 5 is `</wb-dialog>`

**demo 2 (`<button x-ripple type="button">Save</button>`, Component vs. Behavior →
Behavior)** — 4 gaps irregular:
- line 1→2 gap 96.0px — line 2 is `x-ripple`
- line 2→3 gap 120.0px — line 3 is `type="button">`
- line 3→4 gap 192.0px — line 4 is `Save`
- line 4→5 gap 72.0px — line 5 is `</button>`

**demo 3 (`<a x-tooltip="..." href="...">Release notes</a>`, Component vs. Behavior →
Behavior)** — 3 gaps irregular:
- line 2→3 gap 216.0px — line 3 is `href="http://localhost:3000/release-note[s]"`
- line 3→4 gap 264.0px — line 4 is `Release notes`
- line 4→5 gap 96.0px — line 5 is `</a>`

In every case above, the source line at the far side of the gap is confirmed **not
blank** (its real text is quoted in the violation) — these are exactly the "spurious
blank row that doesn't correspond to a real blank line" case the task asked this check to
isolate, not an author's intentional blank line (this doc's `formatHtml`-generated
samples never contain a real blank line — see "Methodology" below).

Demos 4-10 (7 of 11 panels) showed **no** gutter-spacing irregularities — their content
happened to be short enough per line that nothing wrapped, even though `white-space` is
still (incorrectly) `pre-wrap` on all of them per check (c).

## (a) Show all the code — 0 violations (with the caveat above)

No panel's `scrollWidth` exceeded its `clientWidth` — nothing is currently being visibly
clipped/cut off. As explained in the Summary, this is because wrapping (the (c) bug)
prevents horizontal overflow from ever occurring, not because the panels are otherwise
healthy. Re-run this check after (c) is fixed — it's the one that will catch a
reintroduction of the #560/#563 "panel sized narrower than its own content" bug family
once panels can scroll again.

## Incidental finding: an 11th panel not authored as a literal `<wb-demo>`

The doc's raw Markdown contains exactly **10** `<wb-demo>` blocks (confirmed via
`grep -c "<wb-demo" docs/standards/V3-STANDARDS.md`), but the rendered page shows 11
`.wb-demo__code` panels. The 11th (demo index 10, "Migration from Legacy Syntax" section)
comes from mdhtml.js's auto-live-render feature: a plain ` ```html ` fenced block
illustrating legacy-vs-v3 syntax —

```html
<!-- Legacy v2 -->
<div x-card title="Hello" variant="glass">Content</div>
<button x-ripple type="button">Click me</button>

<!-- v3 -->
<wb-card title="Hello" variant="glass">Content</wb-card>
<button x-ripple type="button">Click me</button>
```

— gets converted into a real, live `<wb-demo>` because it contains a genuine `<wb-card>`
tag. This is the same category of issue flagged in
`docs/_today/audit-v3-guide-doc-viewer.md` finding #1 (whole-file boilerplate examples
being live-rendered when they shouldn't be) — here it's a smaller, narrower case (an
intentionally-inert "before/after" comparison snippet, not a whole HTML document with
`<link>` tags), and it did NOT produce any console error/404 in this instance. Flagged for
awareness only; it's a `.wb-demo__code` panel like any other so it's included in all three
counts above, but diagnosing whether auto-live-render SHOULD apply to migration-comparison
snippets is a separate question from this audit's three checks and is not scored as a
violation of (a)/(b)/(c) on its own.

## Methodology notes

- **All 11 `<wb-demo>` blocks were forced into view before measuring.**
  `src/wb-viewmodels/wb-demo.js` only builds the first `EAGER_BUILD_COUNT` (5) blocks
  synchronously; blocks 6+ are deferred to an `IntersectionObserver` keyed to the site's
  real scroll container (`#siteBody`) and never build unless scrolled near. An early draft
  of this test only measured the first 5 and reported 0 wrap violations for the other 6 —
  not because they were healthy, but because their code panel didn't exist yet. The test
  now calls `scrollIntoViewIfNeeded()` on every `<wb-demo>` before reading anything.
- **Waiting is deterministic, not a fixed delay.** pre.js positions each line-number's
  `top` via a double-`requestAnimationFrame`-deferred pass. An early version of this test
  used a fixed `waitForTimeout(700)`, which was long enough in isolation (1 worker) but
  not always under the parallel load of the full 3-test file (2 workers) — a real flake:
  the same panel (demo 3) was correctly flagged with 3 gap violations when run alone, and
  silently skipped (gutter not yet built) when run alongside the other two tests. Per this
  project's standing rule that flaky tests are real defects, this was root-caused (not
  suppressed): `collectPanelReports()` now polls (`page.waitForFunction`) until every
  panel's line-number gutter is fully built (count matches its own text's line count, and
  every number has a real, non-empty `top`) before measuring anything. Confirmed stable
  across repeated runs afterward.
- **Why `.wb-demo__code` panels can never legitimately contain a blank line.**
  `formatHtml()` in `src/wb-viewmodels/demo.js` only ever pushes a line when it has
  trimmed, non-empty content (`if (t) out.push(...)` for text nodes; every element/attr
  line is always non-empty) — so a genuinely blank *rendered* row in one of these panels
  is never the author's intent, only a rendering artifact. (The sibling
  `wb-demo__events-code` panel, built by `buildEventListenerCode()`, is the one
  `.wb-demo__code`-classed panel type that CAN contain a real blank line — a `\n\n`
  separator between multiple event listeners — but V3-STANDARDS.md doesn't use the
  `events=` attribute on any of its demos, so this case didn't come up here.)

## Recommended fix priority

1. **(c), root cause — mdhtml.css's `.x-pre` wrap override needs to exclude
   `<wb-demo>`-generated panels.** This single fix should also eliminate all 14 of the
   (b) violations, since they're downstream of wrapping. Scope the `wb-mdhtml .x-pre` /
   `.wb-mdhtml .x-pre` rule (lines 159-172) to exclude `.wb-demo__code` specifically —
   mirroring how the padding rule just above it already excludes enhanced blocks via
   `:not(.x-pre)`, except here the exclusion needs to be more targeted (only wb-demo
   panels should keep scrolling; other `.x-pre` prose code blocks should keep wrapping
   per the #195 decision this rule documents). Re-run
   `tests/compliance/doc-viewer-code-panel-audit.spec.ts` after the fix — check (a)
   becomes meaningful again once wrapping is off, so don't skip re-verifying it.
2. **(b) — re-verify, should already be resolved by #1.** If any gap violations remain
   after the wrap fix, that would point at a genuine, separate #559-style positioning bug
   in pre.js itself rather than the mdhtml.css conflict.
3. **(a) — no action needed now; keep the test as a regression guard** for the
   #560/#563 "panel narrower than its content" bug family once panels can overflow again.
4. **Incidental finding (11th panel / auto-live-render of the Migration example) — low
   priority, separate investigation.** Not a violation of any of the 3 checks in this
   audit; worth a look only if John wants "Legacy v2" illustrations to stay inert the way
   `docs/_today/audit-v3-guide-doc-viewer.md` decided for whole-document boilerplate.

## Files

- New test: `tests/compliance/doc-viewer-code-panel-audit.spec.ts`
- This report: `docs/_today/audit-code-panels-v3-standards.md`
- Root cause: `src/styles/behaviors/mdhtml.css:150-172`
- Related, already-fixed sibling bug (padding, not wrap): `src/styles/behaviors/mdhtml.css:102-148`,
  `tests/compliance/mdhtml-pre-line-numbers-gutter.spec.ts`
- Standard being violated: `docs/standards/DEMOS-AND-DOCS-STANDARDS.md` §6 (lines 51-58),
  §28 (lines 333-352)
- Related open issue: #559 (`pre.js line-number gutter shows a phantom blank line when a
  long attribute value word-wraps`) — this audit's (b) findings are a concrete, reproducible
  instance of that same symptom, on different content than #559's own example.
