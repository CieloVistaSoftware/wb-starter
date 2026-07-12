# #268 — demos/ consolidation plan

Written plan per #268's acceptance criteria ("a written plan — which pages merge/die"),
based on a real audit of all 48 top-level `demos/*.html` files (tag/behavior coverage,
line count, purpose) run 2026-07-11. Not executed here — this is the plan; migration is
explicitly incremental per the issue.

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
`kitchen-sink.html` (434 lines, ~18 tags) and `autoinject.html` (1523 lines — by far the
largest file in `demos/`) both function as broad smoke-test pages. Per the issue's own
proposal #3 ("keep ONE everything-on-one-page smoke page (generated), delete the
rest") — these need a closer content diff before deciding which survives; not done in
this pass given the size of `autoinject.html`. **Flagged for the next phase, not
decided here** — this is exactly the kind of call that benefits from being made
alongside the actual migration work, not abstractly ahead of it.

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

1. Build `data/demos-registry.json` — maps every `wb-*` tag / `x-*` behavior name to
   its designated canonical demo file (this doc's decisions above, extended to the
   remaining ~100 behaviors not yet audited in this pass).
2. Add a coverage gate (compliance test): every entry in the registry must resolve to
   a real file; every `demos/*.html` file must either be in the registry, on the
   dev/debug allow-list, or on the narrative-page allow-list — no orphans.
3. Retire `pce-test.html`, `button-variants-demo.html`, `button-variants-simple.html`
   per the confirmed duplicates above (delete + registry update, one PR).
2. Diff `kitchen-sink.html` vs `autoinject.html` properly before deciding.
5. Extend `auto-showcase.mjs` to cover schema-less `x-*` behaviors, then generate
   showcases for the 12 tiny stub pages listed above, retiring the hand-written
   versions once the generated ones pass the coverage gate.

Steps 1-2 (registry + gate) are the concrete, immediately-actionable pieces — see
`data/demos-registry.json` and `tests/compliance/demos-registry-coverage.spec.ts`,
added alongside this plan.
