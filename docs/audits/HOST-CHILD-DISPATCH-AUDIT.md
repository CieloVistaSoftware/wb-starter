# Host/Child Dispatch Audit — schema-built native elements vs. their behavior JS

**Date:** 2026-07-17
**Trigger:** Found while fixing #360 (wb-select) and #361 (wb-switch) — both turned
out to be instances of the same underlying architecture bug, not one-off mistakes.
**Scope:** Every schema in `src/wb-models/*.schema.json` whose `$view` builds a real
native form/interactive element (`input`, `select`, `textarea`, `button`) as a child
of a custom `wb-*` host tag.

## The pattern

A schema-driven host tag (`<wb-select>`, `<wb-switch>`, `<wb-textarea>`, ...) has its
`$view` build a real native element inside it. `tag-map.js` dispatches behaviors two
ways: `elementMap` maps the **host tag** (`wb-select` → `select`), and `nativeMap`
maps the **native tag itself** (`select` → `select`, `input` → `input`,
`input[type="checkbox"]` → `checkbox`, ...). `wb.js`'s `scan()`/`observe()` apply
*every* matching entry additively — there is no "most specific wins" — so a
schema-built native child can get dispatched **in addition to** its host, using the
exact same or a different behavior function.

That collision breaks in three distinct ways, all seen live this session:

1. **Same-name self-collision, no host guard.** The behavior function assumes
   `element` IS the real native element. When dispatched a second time on the HOST
   (which is not that native tag), it either does something structurally wrong to the
   host, or silently no-ops and nothing ever reflects the host's own attributes onto
   the real child it built. *(wb-input, wb-textarea)*
2. **Missing type/attribute on the schema's own `$view` node** causes the built
   child to fail to match its OWN intended nativeMap entry, so it instead falls
   through to a more generic one that visually clobbers it. *(wb-switch, wb-checkbox)*
3. **Cross-behavior collision.** A DIFFERENT nativeMap behavior (not the host's own)
   matches the schema-built child too, and that unrelated behavior's CSS/JS wins the
   cascade or overwrites structure. *(wb-switch's input also matching `checkbox.js`)*

`wb-select`'s original bug (#360) was a fourth, more severe variant: the schema
never built a real `<select>` at all (a fake `<button>`/`<div>`/`<ul>` widget), so
native semantics were gone entirely. Fixed by making it build a real `<select>` and
re-invoke the native-`<select>` enhancement path on it.

## Confirmed, code-verified

| Component | Variant | Status |
|---|---|---|
| `wb-select` | fake widget, no real `<select>` | ✅ Fixed — [#360](https://github.com/CieloVistaSoftware/wb-starter/issues/360), closed |
| `wb-switch` | missing `type` on `$view` input + cross-collision with `checkbox.js`'s global style injector | ✅ Fixed — [#361](https://github.com/CieloVistaSoftware/wb-starter/issues/361), closed |
| `wb-textarea` | same-name self-collision: host never reflected `placeholder`/`rows`/`variant` onto its built `<textarea>` | ✅ Fixed — [#362](https://github.com/CieloVistaSoftware/wb-starter/issues/362), closed |
| `wb-checkbox` | missing `type="checkbox"` on `$view` input node (identical root cause to #361), plus a self-collision with checkbox.js's own visual styling, plus zero pre-existing CSS for its box/check visual | ✅ Fixed — [#366](https://github.com/CieloVistaSoftware/wb-starter/issues/366), closed |
| `wb-input` | same-name self-collision, no host guard at all — dispatching `input()` on the `<wb-input>` host wrapped/styled the whole already-built component as if it were a bare input; separately, `placeholder`/`value`/`name`/`type` never reached the real built `<input>` at all; a duplicate clear button was a third symptom of the same root cause | ✅ Fixed — [#367](https://github.com/CieloVistaSoftware/wb-starter/issues/367), closed |

## Suspected, needs live verification (not yet filed)

These are structurally exposed to the same class of bug based on reading the code,
but I have not reproduced them live the way #361/#362 were reproduced. Verify with a
Playwright regression test before filing, the same way the confirmed list above was
established — a couple of the "confirmed" bugs upstream in this same session looked
plausible on paper before the actual behavior turned out to be different, so don't
skip live verification.

- **`select.js`'s own `select()` (native-`<select>` branch, lines 22–54) has no
  idempotency guard for the `clearable` wrapper**, unlike `buildWbSelect()`'s explicit
  idempotency check (line 65). `buildWbSelect()` creates a real `<select>` and calls
  `select(sel, {clearable})` on it directly (line 127) — if a MutationObserver
  separately re-visits that newly-inserted real `<select>` via `nativeMap['select']`
  and dispatches `select()` on it a second time, `clearable: true` would build a
  second nested `.wb-select-clearable` wrapper around the first. Needs a test with
  `<wb-select clearable options='...'>` checking for exactly one `.wb-select-clearable`.
- **`wb-notes`**: `notes.schema.json` declares a `$view` with a `textarea` node, but
  `notes.js` (`src/wb-viewmodels/notes.js`) builds its entire DOM itself from
  `element.dataset.*`, the same self-sufficient pattern as the card family
  (`SCHEMA_EXCLUDED_TAGS` in `schema-builder.js`). `wb-notes` is **not** currently in
  that exclusion list. If schema-builder processes it before `notes()` runs, this may
  be the exact race `schema-builder.js`'s own comments describe for wb-card/wb-skeleton
  (schema builds first, then the behavior's own unconditional rebuild either races it
  or silently discards it) — or `notes.js` may already tolerate it. Unverified.
- **`wb-table`**: separate from this pattern, but same root cause category —
  `table.schema.json` declares `"semanticElement": {"tagName": "table"}` but its
  `$view` never actually builds a `<table>` element; `thead`/`tbody`/`nav` children
  live directly inside the `<wb-table>` host tag with no real `<table>` wrapper. This
  is the same "declares native intent, never delivers it" bug already flagged (but
  not yet fixed, pending go-ahead) for `wb-dialog`. Doesn't cause a dispatch
  collision (there's no literal `<table>` tag to collide on), but it does mean
  `<wb-table>` has none of the accessibility/semantics a real `<table>` gives for
  free (`role=table` implicit structure, table navigation in screen readers, etc.).

## Checked and ruled out

- **`wb-search`** — `search.js` already explicitly builds/wraps its own child
  `<input>` and delegates to `search()`; `input.js` has a dedicated guard
  (`element.closest('.wb-search__wrapper, .wb-password')`) specifically to skip that
  input. Already correctly architected (confirmed via #279 per existing code
  comments).
- **`wb-audio`** — `audio.js` already branches on `element.tagName !== 'AUDIO'` the
  same way `switch.js`/`select.js` do. Already correctly architected.
- **`wb-dropdown`** — self-built menu widget; its trigger `<button>` is created
  entirely by `dropdown.js` itself, not schema-driven, and a dropdown menu has no
  native semantic element to be a superset of. Not in scope for this pattern.
- **Card family, `wb-cardbutton`, `wb-cardexpandable`, `wb-cardminimizable`,
  `wb-cardnotification`, `wb-cardproduct`, `wb-chip`, `wb-confetti`, `wb-dialog`
  (close button), `wb-drawer`, `wb-drawerLayout`, `wb-navbar`, `wb-snow`,
  `wb-fireworks`, `wb-toast`** — all build a `<button>` child via schema, but their
  own `schemaFor` is a *different* name than `button` (e.g. `cardbutton`, not
  `button`), so there's no same-name self-collision. The generic `button` behavior
  (`nativeMap['button'] = 'button'`) does still get dispatched additively on these
  child buttons, which is a **different, lower-priority question** — whether the
  generic button behavior is safe to apply on top of an already-fully-styled
  component button — not audited here.

## Follow-up: the observer schema-build race (#362)

Fixing #362 (wb-textarea) surfaced a fourth, more general failure mode than the three
in the pattern above — and it's specific to *how a component was inserted*, not to
any one schema:

`WB.observe()`'s MutationObserver added-node handler calls `WB.processSchema(el)`
**without awaiting it**, then dispatches auto-inject/elementMap behaviors on that same
node a few lines later in the same synchronous pass. So a host-side "find my
schema-built child and reflect attributes onto it" branch can run *before the schema
has actually finished building the child* — confirmed live via a trace: a host
dispatch's `element.querySelector(':scope > textarea')` was `null` at the moment it
ran. `WB.scan()`'s own main loop does this correctly (`await Promise.all(schemaPromises)`
before any behavior dispatch), but `observe()` — which is what actually fires for
plain `appendChild()`-style insertion, the common case — does not.

This means any "reflect host attributes onto my schema-built child" fix (the pattern
`select.js`/`switch.js` established, and what #362's first fix attempt tried) is
inherently racy for elements inserted via `appendChild` rather than passed through
`WB.scan()` directly. The #362 fix avoided the race entirely by binding
`placeholder`/`rows`/`name`/`variant` **declaratively in the schema's own `$view`**
via `{{...}}` attribute interpolation (schema-builder.js already supports this — the
same mechanism `content: "{{label}}"` uses) instead of reflecting them from JS after
the fact. **Prefer this approach for #366 (wb-checkbox) and #367 (wb-input) too**,
wherever the value being reflected is a plain attribute the schema can template
directly — it sidesteps the observer race by construction, rather than needing to
outrun it.

## Follow-up: a `semantic-element-fidelity` regression sweep

Added `tests/regression/semantic-element-fidelity.spec.ts`, a live browser test that
renders every schema's own `test.setup[0]` markup and checks whether its declared
`semanticElement.tagName` (when it's a tag with no adequate ARIA-only substitute --
`select`/`table`/`dialog`/`details`/`textarea`) actually appears in the rendered
output. `wb-table` and `wb-dialog` are asserted to **stay** broken (so the test fails
loudly, forcing an update, the moment someone fixes either without updating the
test's `KNOWN_VIOLATIONS` map) rather than being silently skipped.

`button` and `progress` were deliberately left out of that check after investigation
showed both are false positives — see the test file's own header comment for the
full reasoning. Chasing why `wb-button` looked incomplete surfaced two more real,
separate bugs:

- **[#368](https://github.com/CieloVistaSoftware/wb-starter/issues/368) — wb-button
  never activated on Enter/Space.** `role="button"` + `tabindex="0"` is a legitimate
  ARIA-widget pattern, but the WAI-ARIA button contract also requires wiring
  keyboard activation, which `button.js` never did. **Fixed** — closed, validated by
  `tests/regression/wb-button-keyboard-activation.spec.ts`.
- **[#369](https://github.com/CieloVistaSoftware/wb-starter/issues/369) — `wb-badge`,
  `wb-button`, `wb-card` tag names are claimed by the unrelated WB Views registry.**
  `src/wb-views/views-registry.json` (a separate generic templating feature) had its
  own views literally named `badge`/`button`/`card`, and `wb-views.js` auto-registers
  `customElements.define('wb-' + name, ...)` for any non-hyphenated view name —
  silently overriding the real components' custom-element identity. Confirmed this is
  why `element.click()` silently no-op'd on `<wb-button>` (fixed by switching to
  `dispatchEvent()` in #368). **Fixed** — closed. Three-layer fix: removed the three
  colliding (and, for `button`/`card`, already-dead — see the issue for the #202
  history) entries from the registry; added a runtime guard in
  `registerViewAsElement()` that refuses to claim a tag name already in `tag-map.js`'s
  `elementMap`; added `tests/compliance/wb-views-tag-collision.spec.ts` (static, no
  browser) so any future view name that collides fails CI immediately. Verified live
  that `customElements.get('wb-button'|'wb-badge'|'wb-card')` are now all `null`.

## Recommendation

Remaining, in priority order:

1. Write a regression test for the `select.js` clearable double-wrap suspicion, and
   file only if it reproduces.
2. Decide on `wb-notes` and `wb-table` — these need a maintainer call (add to
   `SCHEMA_EXCLUDED_TAGS`, or rebuild to deliver on the declared semantic element)
   more than a mechanical fix, similar to the still-pending `wb-dialog` decision.
3. Follow-up on `wb-input`: `disabled`/`readonly`/`required` and `clearable`/
   `variant`/`size` are still not read on the real input's own dispatch path
   (deliberately left out of #367's scope — file only if reported live).

Done: #360 (wb-select), #361 (wb-switch), #362 (wb-textarea), #366 (wb-checkbox),
#367 (wb-input), #368 (wb-button keyboard), #369 (wb-views tag collision). All 7
originally-confirmed items in this audit are now fixed and closed.
