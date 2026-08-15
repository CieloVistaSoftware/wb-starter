# Test audit: refs, examples, code panels, events — every .html and .md file

**Date:** 2026-08-14
**Trigger:** "create a test audit, for every .html and .md file, do all refs render
properly? do all the examples work? is all the parts of code showing and the events?
we need to have more depth in our unit tests."
**This is an audit only.** Real tests were written, committed, and RUN against the
current codebase; nothing found by them was fixed as part of this pass (per the same
precedent as `docs/_today/audit-code-panels-v3-standards.md` / issue #583 — write the
test, run it, report findings, file a tracking issue, leave fixes to follow-up work).
A few of the failures below turned out to be false positives in the FIRST draft of
these tests; those were fixed in the test itself before this report was written (see
"Test-authoring notes" at the bottom) — every number below is from the tests' final,
corrected form.

## Scope and how this maps to the 4 dimensions asked for

| # | Dimension (as asked) | New/extended test | Pre-existing coverage (not rebuilt) |
|---|---|---|---|
| 1 | Refs render properly | `tests/compliance/refs-resolve.spec.ts` (new) | `docs-live-media-assets-exist.spec.ts` (media `src` in docs), `wb-audio-has-resolvable-src.spec.ts` (audio specifically), `no-absolute-nav-links.spec.ts`/`no-absolute-asset-paths.spec.ts`/`no-absolute-resource-paths.spec.ts` (domain-absolute paths), `es-modules.spec.ts`/`critical-scripts.spec.ts` (script src) |
| 2 | Examples work | `tests/compliance/live-examples-render.spec.ts` (new) | `tests/regression/component-index-doc-coverage.spec.ts` (same check, but only for docs/components/**, driven by data/component-index.json) |
| 3 | All code is showing | `tests/compliance/doc-viewer-code-panel-audit.spec.ts` (generalized from 1 file to 118) | `demo-layout-standards.spec.ts` (padding/width/wrap, different rule set) |
| 4 | Events work | `tests/compliance/wb-demo-events-fire.spec.ts` (new — **no prior coverage of any kind**) | none |

Every new/extended test discovers its own file list by scanning the repo (glob +
grep for the relevant marker — `<wb-demo`, `events=`, etc.), not a hand-maintained
array, per this session's established convention (`docs-live-media-assets-exist.spec.ts`,
`component-index-doc-coverage.spec.ts`). Adding a new demo/doc automatically gets swept
into all 4 checks with no test-file edits required.

## Results summary

| Dimension | Checks run | Passed | Failed | Skipped |
|---|---|---|---|---|
| 1. Refs resolve | 265 (every `.html`/`.md` in demos/, pages/, public/, docs/, README, CONTRIBUTING) | 245 | **20** | 0 |
| 2. Examples work | 19 (every demos/**/*.html + pages/**/*.html that renders `<wb-demo>`) | 10 | **8** (62 individual broken/empty demo instances) | 1 |
| 3. Code fully showing | 118 (99 docs via doc-viewer + 19 plain demo/page files) | 85 | **29** (~83 individual cut-off panels; 0 wrap/blank-line violations) | 4 |
| 4. Events fire | 4 files / 7 `wb-demo[events]` instances (the only ones in the repo today) | 4 | **0** | 0 |

Reproduce any of these:
```
npx playwright test tests/compliance/refs-resolve.spec.ts --workers=2
npx playwright test tests/compliance/live-examples-render.spec.ts --workers=2
npx playwright test tests/compliance/doc-viewer-code-panel-audit.spec.ts --workers=2
npx playwright test tests/compliance/wb-demo-events-fire.spec.ts --workers=2
```

---

## Dimension 1 — Refs resolve (20 failures / 265 files)

**Test:** `tests/compliance/refs-resolve.spec.ts`. Static analysis (no browser): every
`<a href="...">` (HTML) and Markdown `[text](url)` link is resolved against its source
file's own directory and checked for existence on disk. Media `src`, script `src`, and
domain-absolute paths are deliberately OUT of scope (owned by sibling tests already —
see the coverage table above). Fragment-only same-page anchors (`#foo`) are reported as
a soft, non-failing note (ids are often built at runtime — see the test's own header
comment) — none of the 20 failures below are fragment-related; all are real path
resolution failures.

**All 20 are genuine dead links**, no false positives in the final run. Two clear
clusters:

### Cluster A — doc → source-file links pointing at files that don't exist (13 of 20)
Several `docs/behaviors/*.md` and `docs/components/**/*.readme.md` files link to a
`../../src/...` file (schema/viewmodel/CSS) that has since moved, been renamed, or
never existed under that exact path:

- `docs/behaviors/wb-audio.md` → `../../src/wb-models/wb-audio.schema.json`
- `docs/behaviors/wb-card.md` → `../../src/wb-models/wb-card.schema.json`
- `docs/behaviors/wb-column.md` → `../../src/wb-viewmodels/wb-column.js`
- `docs/behaviors/wb-row.md` → `../../src/wb-viewmodels/wb-row.js`
- `docs/behaviors/wb-search.md` → `../../src/wb-viewmodels/wb-search.js`
- `docs/behaviors/wb-stack.md` → `../../src/wb-viewmodels/wb-stack.js`
- `docs/behaviors/wb-themecontrol.md` → `../../demos/semantics-theme.html`
- `docs/behaviors/x-effects.md` → `../../demos/behaviors-showcase.html`
- `docs/behaviors/x-enhancements.md` → `../../demos/behaviors-showcase.html`
- `docs/components/cards/cards.readme.md` → 3 dead links (`card.schema.json`, `card.js`, `card.css`)
- `docs/components/feedback/feedback.readme.md` → `../../src/styles/components/feedback.css`
- `docs/components/forms/forms.readme.md` → `../../src/styles/components/forms.css`
- `docs/components/layout/layout.readme.md` → `../../src/styles/components/layout.css`
- `docs/components/navigation/navigation.readme.md` → `../../src/styles/components/navigation.css`
- `docs/components/semantic/semantic.readme.md` → `../../src/styles/components/semantic.css`
- `docs/components/tabs.md` → 4 dead links (`tabs.schema.json`, `wb-tabs.js`, `tabs.js`, `tabs.css`)
- `docs/card.md` → `../tests/behaviors/ui/card.spec.ts`
- `docs/search.md` → `../src/wb-viewmodels/wb-search.js`, `../demo-search.html`

(the `*.readme.md` cluster all share the exact same shape — every component-family
CSS file link is broken. Worth checking whether these CSS files were consolidated into
a single stylesheet, since that would explain all 5 at once with one root cause.)

### Cluster B — directory-only links with no index page (2 of 20)
- `docs/components/README.md` → `./effects/`
- `docs/components/components.md` → `./effects/` (same link, two docs)

`docs/components/effects/` exists but has no file a doc-viewer link could open (no
`index.md`/`index.html`). Works fine as a folder link when browsing the raw repo on
GitHub; dead when clicked through the doc-viewer.

Full list (message text from the actual test failures) is reproducible via the command
above; not fully duplicated here for brevity — see the 20 named failing tests.

---

## Dimension 2 — Examples work (8 failures / 19 files, 62 individual instances)

**Test:** `tests/compliance/live-examples-render.spec.ts`. For every plain
`demos/**/*.html` / `pages/**/*.html` page (not going through the doc-viewer — the
`demos/` folder's own §16 obligation to show "a working live demo AND its code"),
every `<wb-demo>`'s `.wb-demo__grid` must render at least one real, non-zero-size
child, and the page must produce zero uncaught page errors. **Zero page errors were
found anywhere** — all 8 failures are the "renders something, but it's invisible"
failure mode, not a crash.

### Confirmed root cause: `<wb-progress>` renders at 0 width (not a maybe — verified live)
Manually confirmed by inspecting computed style directly: a `<wb-progress>` upgrades
correctly (builds its 3 expected internal children — bar/label/etc., correct
`role="progressbar"`, correct HEIGHT matching its `size` variant — 12px/`xs` through
32px/`xl`) but **`width: 0`** on every single instance checked. This single bug
explains the large majority of the 62 flagged instances:

| File | Flagged instances | Pattern |
|---|---|---|
| `demos/site/feedback.html` | 29 | Every `<wb-progress>` variant/size permutation on the page |
| `demos/multi-component-demo-generated.html` | 11 | Every `<wb-progress>` variant/size permutation on the page |
| `pages/components.html` | 4 | `<wb-progress>` at 25%/50%/75%/100% |

That's 44 of the 62 flagged instances (71%) explained by one component's CSS. Worth
filing as its own high-priority fix — a progress bar that's invisible (0 width but
correct height) is one of the most visibly broken things this audit found.

### Needs human triage — may be by-design, not confirmed broken
The remaining ~18 instances are OTHER components this pass did not manually verify —
listing them honestly rather than asserting they're all bugs, since some (ripple,
skeleton) are plausibly meant to have no visible footprint until triggered/loaded:

| File | Flagged instances | Components involved |
|---|---|---|
| `demos/site/effects.html` | 7 | `<wb-ripple>` (4 variants), `<wb-stagelight>` (3) |
| `pages/behaviors.html` | 5 | plain `<div>` (x-behavior demo targets) |
| `demos/site/layout.html` | 3 | (see raw failure output) |
| `demos/site/content.html` | 2 | (see raw failure output) |
| `demos/registry-browser.html` | 1 | `<loading-skeleton>` |

`<wb-ripple>` in particular is plausibly a zero-footprint effect wrapper by design (a
ripple only becomes visible on click, from inside its target) — this test's "every
child must have non-zero rendered size" rule may be too strict for effect-only
components like this. Recommend a human (or a follow-up pass) check each of these
individually before filing bugs on all of them; only `<wb-progress>` above is
confirmed.

---

## Dimension 3 — All code is showing (29 failures / 118 files, ~83 individual panels)

**Test:** `tests/compliance/doc-viewer-code-panel-audit.spec.ts` — generalized from the
single-file V3-STANDARDS.md audit (#583) to every doc that actually renders a
`<wb-demo>` through the doc-viewer (99 docs, `docs/_today/**` excluded as session
scratch) PLUS every plain demo/page `.html` file that renders `<wb-demo>` directly (19
files, a code path the doc-viewer version never exercises). Same 3 checks as the #583
audit: (a) panel never narrower than its content, (b) no phantom blank lines in the
line-number gutter, (c) `white-space: pre` (never wraps).

**The #583 fix generalized cleanly: 0 wrap violations, 0 phantom-blank-line violations,
anywhere in the whole sweep.** Every one of the 29 failing files fails ONLY check (a) —
"show all the code" — the #560/#563 "panel sized narrower than its own content" bug
family, still open. This is good news for the standards fix (`mdhtml.css`'s `.x-pre`
wrap-exclusion for `.wb-demo__code` panels holds up site-wide, not just on the one file
originally audited) and isolates exactly which bug family is still live.

~83 individual panel-cutoff instances across the 29 files (21 doc-viewer docs + 8 plain
HTML pages). A few representative examples (full detail via the reproduce command
above):

- `docs/standards/DEMOS-AND-DOCS-STANDARDS.md`, `docs/behaviors-reference.md`,
  `docs/behavior-cross-reference.md`, `docs/V3-GUIDE.md` — the project's own biggest
  reference docs, each with several long-attribute-value demos that overflow.
- `docs/components/layout/*.md` (center, cluster, container, flex, grid, scrollable,
  sticky) — the entire layout component family, consistently affected (worth checking
  for one shared root cause, similar to the CSS-link cluster in Dimension 1).
- `pages/components.html`, `pages/behaviors.html`, `demos/site/cards.html` — plain HTML
  pages (not doc-viewer at all), confirming the cutoff bug is in `demo.js`/`pre.css`
  panel-sizing logic itself, not specific to the doc-viewer/mdhtml rendering path.

---

## Dimension 4 — Events fire (0 failures / 4 files, 7 instances)

**Test:** `tests/compliance/wb-demo-events-fire.spec.ts` — **the one dimension with
zero prior coverage of any kind** before this pass. For every `<wb-demo events="...">`
in the repo (discovered by grep, not hand-listed), the test actually interacts with the
rendered control via a generic ordered cascade (real `<button>` → `[role=switch]` →
`[role=tab]` → `<tr>` → first grid child) and asserts `.wb-demo__events-log-entry`
count increases — proof the documented event genuinely fires and the live log genuinely
catches it, not just that the markup is well-formed.

**All 7 live instances pass, across all 4 files that currently use `events=`:**

| File | Instances | Control interacted with |
|---|---|---|
| `demos/site/cards.html` | 3 (`wb:cardproduct:addtocart`) | "Add to Cart" `<button>` |
| `demos/site/interactive.html` | 1 (`wb:toggle`) | `<button x-toggle>` |
| `docs/behaviors-reference.md` | 2 (`wb:switch:change`, `wb:tabs:change`) | `[role=switch]` host click; `[role=tab]` click |
| `docs/components/semantics/table.md` | 1 (`wb:table:select`) | `<tr>` click |

One more `events=` usage exists in `docs/components/forms/switch.md` but is inside a
` ```html ` fence (illustrative code in the "## Events" section, not a live block) —
correctly excluded, not counted above.

This is a genuinely small surface today (only 5 components use `events=` at all), so
"0 failures" mostly reflects that §27's opt-in attribute is lightly adopted, not that
the whole event system is proven — but every instance that DOES exist was verified to
actually work, which is new, real coverage where there was none before.

---

## Recommended next steps (not done as part of this audit — file follow-up issues)

1. **`<wb-progress>` renders at 0 width** — highest-confidence, highest-visibility bug
   found (Dimension 2). Affects 44+ confirmed instances across 3 files. Should be its
   own issue, separate from this audit's tracking issue, given how confirmed and
   high-impact it is.
2. **Dimension 1's `*.readme.md` → CSS-file link cluster** (5 docs, all pointing at a
   per-component-family CSS file that doesn't exist at that path) — check whether these
   stylesheets were consolidated; if so, one fix (updating the link target) likely
   closes all 5 at once.
3. **Dimension 3's layout-component-family cluster** (7 `docs/components/layout/*.md`
   docs all failing the same "show all the code" check) — check for one shared cause
   before fixing each individually.
4. **Dimension 2's non-progress findings** (ripple, stagelight, loading-skeleton, plain
   divs) — need a human/follow-up pass to confirm which are real bugs vs. by-design
   zero-footprint effect wrappers, before filing anything on them.
5. Re-run all 4 tests after any of the above land — they're real, checked-in gates now
   (`tests/compliance/`), not one-off scripts.

## Test-authoring notes (false positives found and fixed while building these tests)

Documented here so a future maintainer extending these tests doesn't reintroduce the
same mistakes:

- **Dimension 1:** an early draft resolved domain-absolute (`/foo`) hrefs against the
  source file's own directory — flagged 50+ false positives in
  `docs/behavior-cross-reference.md` (illustrative placeholder routes like `/terms`,
  `/dashboard`, `/admin/users` for a routing-pattern example, never meant to resolve in
  this repo). Fixed by treating any leading-single-slash href as out of scope (already
  owned by `no-absolute-nav-links.spec.ts` / #226, which knows the real deploy-path
  rules). Also had to strip `<script>` block contents in `.html` files before matching
  `<a href>` — `pages/docs.html`/`public/errors-viewer.html` build real anchor tags at
  runtime via JS string concatenation, and the literal quoted text in the source
  (`"public/doc-viewer.html?file="`) is only the static prefix, not a real, complete
  href.
- **Dimension 3:** the original single-file version of this test used a fixed
  `waitForFunction` that assumed every `<wb-demo>` on the page has at least one code
  panel, and a plain `scrollIntoViewIfNeeded()` per demo with no timeout. Generalizing
  to 118 files surfaced both assumptions as wrong: `demos/site/cards.html` has a
  continuously-shifting layout that made one demo's `scrollIntoViewIfNeeded()` hang for
  the full 30s test timeout (fixed with a per-item 5s cap + catch, so one problem demo
  can't block the whole file's audit), and some pages legitimately have `<wb-demo>`
  blocks with zero code panels (fixed the wait condition to treat "no panels on this
  demo" as vacuously satisfied instead of waiting forever for a panel that will never
  exist).
- **Dimension 2:** confirmed the "no visible child" check finds REAL bugs, not test
  noise, by manually inspecting `<wb-progress>`'s computed style directly (separate
  throwaway Playwright script, not committed) before trusting the pattern across the
  other 7 flagged files.
