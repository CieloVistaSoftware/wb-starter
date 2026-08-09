# #268 — demos/ consolidation plan (closed 2026-07-15)

Written plan per #268's acceptance criteria ("a written plan — which pages merge/die"),
based on a real audit of all 48 top-level `demos/*.html` files (tag/behavior coverage,
line count, purpose) run 2026-07-11. Migration was incremental per the issue — see
"Recommended next steps" below for the full execution history; all 5 steps are done.

**Correction (same day):** the first pass of step 5 kept `semantics-forms.html`,
`semantics-media.html`, `semantics-structure.html`, `semantics-theme.html`, and
`sticky-demo.html` standing as separate top-level pages, reasoning from this plan's
own earlier "organized by HTML semantic category, a different axis" carve-out. Direct
instruction overrode that: "no more single links to a single demo" — no exceptions for
semantic-category pages. All 5 merged into `demos/site/*.html` as `manualSections`
(forms.html: native semantic form elements; content.html: semantic media + structure
elements; interactive.html: theme & dark mode) and deleted. Zero standalone
single-topic demo pages remain in `demos/` — every surviving top-level page is a
distinct narrative/tool page or dev/debug fixture, not a demo of one component/behavior.

## What already exists

`scripts/auto-showcase.mjs` + `scripts/generate-page.mjs` already do most of proposal
item 2 ("Generate, don't hand-write"): given a `src/wb-models/*.schema.json`, it builds
a `.page.json` showcase (matrix combos → enum variants → boolean toggles → defaults),
validates it, and generates `demos/{name}-showcase.html` wrapped in real `<wb-demo>`
blocks (live + auto-formatted source, §16 for free). **111 component schemas exist;
only 2 generated showcases exist** (`demos/*-showcase.html`) — the generator is barely
used, not missing. The gap isn't tooling, it's adoption + a registry telling the
generator what's already covered by hand-written pages vs. what still needs generating.

The generator only covers **schema-backed `wb-*` custom tags** (via `test.matrix` /
`enum` / `boolean` properties). It does NOT cover pure `x-*` attribute behaviors that
have no schema (ripple, tooltip, draggable, copy, sticky, …) — 113 total registered
behaviors in `src/wb-viewmodels/index.js`, a meaningful chunk of which are schema-less.
Extending the generator to also read behavior *usage patterns* (not schema properties)
for those would be a separate, smaller follow-up — not blocking this plan.

## Confirmed duplicate clusters (merge candidates)

### Cards — `card-examples.html` vs `pce-test.html`
Both cover the **same 18 `wb-card*` tags** (card, cardbutton, cardexpandable, cardfile,
cardhero, cardhorizontal, cardimage, cardlink, cardminimizable, cardnotification,
cardoverlay, cardportfolio, cardpricing, cardproduct, cardprofile, cardstats,
cardtestimonial, cardvideo). `pce-test.html`'s name ("pce" = no clear meaning found,
possibly a working/scratch name) plus its lack of any `<wb-demo>` usage suggests it's
older/superseded. **Recommendation: keep `card-examples.html` (already uses `<wb-demo>`
in 1 spot — needs full conversion, not zero), retire `pce-test.html`.**

### Buttons — 4 pages, 3 are the same thing
- `button-variants-demo.html` — generic "Button Variants Demo"
- `button-variants-simple.html` — "WB Button Variants (Simple)", 0 `<wb-demo>` usage,
  looks like an early/scratch version
- `button-variants-tags-demo.html` — "Button Variants (wb-* tags)", **most complete**
  (8 variants incl. `link`, which the others lack), 10 `<wb-demo>` blocks already
- `button-composition-demo.html` — **NOT a duplicate**: demonstrates `wb-button` +
  `x-*` behavior composition, a different subject entirely.

**Recommendation: keep `button-variants-tags-demo.html` as canonical for plain variant
coverage, retire `button-variants-demo.html` + `button-variants-simple.html`. Keep
`button-composition-demo.html` (different subject).**

**Superseded (2026-07-11):** John asked to merge all 4 into one page instead of
keeping variants/composition separate. Done — all 4 retired, replaced by
`demos/buttons.html` (variants + sizes + disabled states + single/composed
`x-*` behaviors, all in one). The hand-rolled `.wb-compare` before/after code
panels in the old composition/tags-demo pages (bypassing `<wb-demo>` for
content it already renders+formats live) were dropped, not carried over —
a real §1 violation on their own. `data/demos-registry.json` updated to
match: `buttons.html` is now the sole canonical entry.

### The two "everything on one page" pages

**Decided (2026-07-12):** kept `autoinject.html`, retired `kitchen-sink.html` per direct
request ("remove this and integrate any missing things in the other files"). Audited all
68 of kitchen-sink.html's mini-examples: most were already covered elsewhere (buttons →
`buttons.html`, forms → `semantics-forms.html`, cards → `card-examples.html`, etc.) or
were themselves broken/fake placeholders not worth migrating (`Dialog Trigger`/
`Toast Trigger` had no `x-dialog`/`x-toast` attribute at all — inert; the fake
button-styled `Tabs`/`Pagination` are strictly inferior to the real `tabs-demo.html`/
real pagination elsewhere). Genuinely unique content (blockquote, `<dl>`, `<address>`,
`<hr>`, `<time>`, MathML, `<sup>`/`<sub>`, `<del>`/`<ins>`, `<abbr>`, `.wb-link`) migrated
into `semantics-structure.html`, which also needed its own from-scratch rewrite
regardless — it had zero `<wb-demo>` usage, multiple malformed tags (missing `>`,
mismatched open/close pairs on invented `<wb-ul>`/`<wb-ol>`/`<wb-dl>`/`<wb-pre>`/
`<wb-code>` tags that were never real registered custom elements), and several
fictional attributes (`table`'s `pagination`/`page-size`, `dialog`'s `close-on-backdrop`/
`animation`, `details`' `accordion` grouping — none read anywhere in the real behavior
source). Along the way found and fixed a real bug matching the fictional-attribute
theme: `table.js`'s `striped`/`hover` only read `data-striped`/checked `dataset.hover`,
missing the bare-attribute fallback every demo actually uses.

## Legitimate non-duplicate pages (keep, out of scope for generation)

Narrative/non-generated pages the issue's own proposal explicitly carves out
("Hand-written demos only for narrative pages"):
- `frameworks.html`, `playground.html`, `schema-first-architecture.html`,
  `wb-views-demo.html`, `wizard.html` — narrative or interactive-tool pages, not
  component catalogs.
- `charity-food.html` — a real-world composed-page example (uses several components
  together in context), valuable as a "how components combine" reference distinct
  from a per-tag catalog.
- `semantics-*.html` (forms, media, structure, theme) — organized by HTML semantic
  category, not by component; a different, complementary axis to a tag-by-tag catalog.

## Dev/debug pages (exclude from any public "demos catalog", keep for internal use)

`test-harness.html`, `pre-debug.html`, `mdhtml-pre-debug.html`,
`legacy-syntax-check.html`, `intellisense-check.html`, `scrollalong-test.html`,
`layout-test.html` — these are testing infrastructure (used by this project's own
Playwright specs — e.g. `pre-debug.html` is a fixture for pre.js tests), not
user-facing documentation. A coverage gate should allow-list these rather than flag
them as "missing a proper demo."

## Tiny single-behavior stub pages (~20-25 lines each)

`autosize-demo.html`, `collapse-demo.html`, `copy-demo.html`, `draggable-demo.html`,
`feedback-demo.html`, `fieldset-demo.html`, `form-demo.html`, `progressbar-demo.html`,
`resizable-demo.html`, `ripple-demo.html`, `sticky-demo.html`, `toggle-demo.html` — each
is genuinely one topic, one page (matches the "one canonical demo per behavior" goal
already), just not yet using `<wb-demo>`/generated format. Not duplicates of each
other. Candidate for a **future generator pass** once the generator covers schema-less
`x-*` behaviors (see "What already exists" above) — not a merge/retire case, a
format-upgrade case.

## Recommended next steps (in order)

1. ~~Build `data/demos-registry.json`~~ — done. Maps every `wb-*` tag / `x-*` behavior
   name to its designated canonical demo file.
2. ~~Add a coverage gate (compliance test)~~ — done:
   `tests/compliance/demos-registry-coverage.spec.ts`.
3. ~~Retire `pce-test.html`, `button-variants-demo.html`, `button-variants-simple.html`~~
   — done. `button-variants-*` merged into `demos/buttons.html` (2026-07-11).
   `pce-test.html` deleted (2026-07-12): removed the file, its dedicated
   `tests/behaviors/pce-demo.spec.ts` (only tested the now-deleted page's
   legacy `data-*`-attribute markup), its `project-index.html` link card, its
   `duplicates_to_retire` registry entry, and its allowlist mentions in
   `no-observer-referror.spec.ts`/`wb-alert-attribute-correctness.spec.ts`
   (repointed the former to `card-examples.html`, its replacement).
4. ~~Diff `kitchen-sink.html` vs `autoinject.html` properly before deciding~~ — done
   (2026-07-12): kept `autoinject.html`, retired `kitchen-sink.html`.
5. ~~Extend the generator to cover schema-less `x-*` behaviors, then consolidate the
   tiny stub pages~~ — done (2026-07-15). `scripts/generate-site.mjs` gained
   `manualSections` support (hand-authored `{heading, html, script?, position?, id?}`
   entries appended — or, with `position: "start"`, pinned before — a category page's
   auto-generated schema sections; each section gets a stable `id` for test targeting,
   either explicit or slugified from `component + heading`). Used to fold in every
   schema-less behavior (`x-autosize`, `x-fieldset`, `x-form`, `x-help`, `x-label`,
   `x-progressbar`, `x-notify`, `x-toggle`) plus `x-tooltip`'s *real* trigger-element
   usage (the schema-driven `<wb-tooltip content="...">` markup doesn't match the actual
   behavior implementation — flagged separately, not fixed here) and the button
   composition showcase, into their matching `demos/site/*.html` category page.
   `card-examples.html`'s full curated gallery (18 hand-picked examples, exact IDs/text
   that `tests/cards/card-examples-demo.spec.ts`'s ~40 assertions depend on) was
   preserved wholesale as a pinned-to-top manual section (`#card-gallery`) in
   `demos/site/cards.html`, since the schema-generated matrix uses generic sample
   content and can't satisfy those assertions.

   Retired (deleted, content merged into `demos/site/*.html`): `autosize-demo.html`,
   `progressbar-demo.html`, `feedback-demo.html`, `toggle-demo.html`, `help-demo.html`,
   `label-demo.html`, `fieldset-demo.html`, `form-demo.html`, `code.html`,
   `stage-light.html`, `tabs-demo.html`, `tooltip-demo.html`, `buttons.html`,
   `card-examples.html`, `badge-showcase.html`, `progress-showcase.html`,
   `collapse-demo.html`, `copy-demo.html`, `draggable-demo.html`, `resizable-demo.html`,
   `ripple-demo.html` — 20 files. All dependent tests (`tests/darkmode-standard.spec.ts`,
   `tests/behaviors/tooltip-demo.spec.ts`, `tests/behaviors/button-variant-colors.spec.ts`,
   `tests/integration/button-composition-demo.spec.ts`,
   `tests/regression/wb-lazy-inject-detached-element.spec.ts`,
   `tests/behaviors/wb-card-link-real-anchor.spec.ts`,
   `tests/compliance/no-observer-referror.spec.ts`, `tests/demos/label-demo-schema.spec.ts`,
   `tests/cards/card-examples-demo.spec.ts`, `tests/demos/card-examples-demo.spec.ts`)
   retargeted to `demos/site/*.html`, scoped to stable section ids where the auto-generated
   content around them would otherwise break count/uniqueness assumptions.

   Also found and fixed in passing: two competing, orphaned site generators both writing
   to `demos/site/` (`src/wb-models/pages/wb-component-library.site.json`, the real one, vs.
   the abandoned `src/wb-models/sites/wb-library.site.json` — deleted, along with its 5
   orphaned output files `badges.html`/`progress.html`/`notifications.html`/
   `portfolio.html`/`all-components.html` that `demos/site/index.html` never linked to);
   and a relative-path bug in `mdhtml.schema.json`'s matrix (`../demos/code.md` broke once
   consumed from `demos/site/` instead of `demos/`, fixed to `../code.md`).

   `demos/index.html` now leads with a featured link to `demos/site/index.html` as the
   single canonical catalog; its remaining 14 links are all legitimately non-duplicate
   (semantic-category pages, narrative/tool pages, dev/debug fixtures — see
   `data/demos-registry.json`'s `canonical` bucket for what's still genuinely
   unaudited: only `sticky-demo.html` remains — `tabs-demo.html` was deleted since
   `demos/site/layout.html`'s schema-driven `tabs` section fully covers it).

Steps 1-5 are done. #268 is closed — remaining work (auditing `sticky-demo.html`
against `demos/site/layout.html`'s coverage, fixing the `x-tooltip` schema/markup
mismatch, `tests/demos/card-examples-demo.spec.ts`'s stale `.wb-demo__grid` selector)
is tracked as small independent follow-ups, not blocking.
