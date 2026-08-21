# Proposal: Drop the `wb-` Tag Prefix from the Authoring Surface

**Status:** Draft, for discussion
**Author:** Claude (research + draft), for John Peters
**Scope:** Author-facing HTML only. Does not touch internal CSS class naming (`.wb-card__header` etc. stays as-is).

## TL;DR

Today, writing a card means `<wb-card>`. This proposal makes it `<article>` (or any
semantic tag the author already reached for) — plain HTML plus one attribute, no invented
tag names to memorize. The `wb-` prefix survives internally (schema registry keys, generated
BEM classes) but disappears from what an author types. Opt-out reuses an attribute
(`x-ignore`) that already exists for a *different* code path today and currently does nothing
for `wb-*` tags — extending it closes a real inconsistency, not just enables this proposal.

**Estimated surface:** ~48 pseudo-elements convert cleanly (mechanical). 6 tags are real
`customElements.define()`-registered classes and need individual migration decisions
(see §5). ~50 test files and 66 doc pages reference `wb-*` tags directly and need updates.
None of this is close to a weekend job — see §7 for a phased estimate.

## Why

You said it directly: *"for every tag that attaches behavior to a semantic element we don't
want to expose wb- prefixes, rather the concept of autoinjection"* and *"because we have opt
out ability, getting rid of wb-prefixes keeps the customer focused on plain old html."*
The autoInject system already proves this works for the 32 native-tag components (`<button>`,
`<table>`, `<address>`, …) — `config/site.json`'s `autoInjectComponents: true` wires behavior
onto bare semantic tags today with zero custom tags. The 52 composite components (card, modal,
cardhero, …) are the exception, not because they need something HTML can't express, but
because the system that builds their internal DOM (`schema-builder.js`) happens to key its
detection off a tag-name string prefix instead of an attribute. That's an implementation
detail, not a design requirement.

## Relationship to `proposed-custom-elements.md`

**This proposal is a reversal of [`proposed-custom-elements.md`](proposed-custom-elements.md)**,
which asks for *more* `wb-*` tags (`wb-grid`, `wb-flex`, `wb-stack`, …) under the "Pseudo-Custom
Elements (PCE)" architecture. Both documents can't be the target state. If this proposal moves
forward, `proposed-custom-elements.md` should be either withdrawn or reframed as "attribute
names to add to the schema registry" (`x-grid`, `x-flex`, `x-stack`, …) rather than new tags —
the underlying behavior implementations it lists are unaffected either way, only the
tag-vs-attribute authoring decision changes. Flagging this explicitly so it doesn't sit as a
silent contradiction in the repo.

## Current state (verified against `.claude/worktrees/reconcile`)

wb-starter runs **two parallel detection systems** today:

| | Native-tag autoInject | Schema-builder (`wb-*` tags) |
|---|---|---|
| Trigger | `nativeMap` lookup on real HTML tags (`button`, `table`, …) | `tagName.startsWith('wb-')` |
| Gate | Requires `getConfig('autoInject')` **or** a `variant` attribute (`src/core/wb.js:223`) | Unconditional — no gate at all |
| Opt-out | `x-ignore` attribute (`src/core/wb.js:204`, mirrored in `wb-lazy.js:285,700`) | **None.** `x-ignore` is never checked in `schema-builder.js` — confirmed by reading `detectSchema()`, `scan()`, `processElement()`, and `WB.inject()`. `<wb-card x-ignore>` is fully built and injected today; the attribute is silently ignored. |
| Registration | `nativeMap` (`tag-map.js`) | `registerSchema()`, `src/core/mvvm/schema-builder.js:118-130` — derives `` `wb-${name}` `` as the tag key (line 126) |
| Count | 32 of 84 catalogued components | 52 of 84 (81 distinct tags total; `wb-card` appears twice in the catalog under two categories) |

Of the 52 `wb-*` tags, **only 3 are real registered Custom Elements**: `wb-card`
(`src/wb-viewmodels/wb-card.js:51`), `wb-demo` (`wb-demo.js:137`), `wb-grid` (`wb-grid.js:36`).
The other ~48 are plain elements the schema builder detects and constructs purely by string
prefix — nothing in the platform's Custom Elements registry knows they exist. Three more real
Custom Elements (`wb-audio`, `wb-control`, `wb-fix-card`) exist in the codebase but sit outside
the 52-tag catalog scope (`wb-audio` is the enhanced-EQ wrapper around the native
`<audio x-behavior="audio">` component, not a catalog entry itself).

`SCHEMA_EXCLUDED_TAGS` (`schema-builder.js:872-880`, 22 entries, all of `wb-card*`'s 13-tag
family plus `wb-demo`, `wb-dialog`, `wb-search`, others) is hand-maintained tribal knowledge —
its own comment (lines 801-871) warns *"do not widen this to 'every tag with a behavior'
again."* This set exists to stop the schema builder racing a component's own DOM-building code;
its job survives this proposal unchanged, it just gets rekeyed by behavior name instead of tag
name.

Also found in passing, unrelated to this proposal but worth its own issue: `detectSchema()`'s
"Data attribute" fallback branch (`schema-builder.js:899-906`) calls `.split()` on a boolean —
dead/broken code, never reachable. And `docs/escape-hatches.md`'s documented `skip` /
`skip-children` attributes (lines 35-44) don't exist anywhere in `src/` — stale docs, not a
working mechanism.

## Proposed design

### 1. One detection rule, one attribute convention

Replace `tagName.startsWith('wb-')` with: *does this element carry an `x-{behaviorName}`
attribute matching a registered schema?* This is the same convention native-tag components
already use (`x-ripple`, `x-password`, etc.) — composite components stop being a separate
authoring mental model.

```html
<!-- Today -->
<wb-card elevated title="...">...</wb-card>

<!-- Proposed -->
<article elevated title="...">...</article>
```

Consistent with the existing native-tag philosophy (`wb.js`'s own comment: *"a plain
`<button variant="primary">` is never accidental... triggers its mapped native behavior
regardless of the global autoInject setting"*), an explicit `x-card` attribute is itself
unambiguous author intent — it should fire **unconditionally**, independent of the global
`autoInject` config flag, exactly like `wb-*` tags do today. No new gating semantics needed.

### 2. Opt-out: extend `x-ignore`, don't invent a new attribute

`x-ignore` already exists, is documented (`docs/escape-hatches.md:37-38`), and already means
"WB, leave this element alone." It just isn't wired into the schema-builder path. Add the same
one-line check already present in `wb.js:204` to `detectSchema()`, `scan()`, and
`processElement()` in `schema-builder.js` (three call sites, per the research — they
independently re-implement the tag test today and would need the same guard added to each).
This closes an existing inconsistency as a side effect, not just an accommodation for this
proposal.

### 3. Registration: additive during the transition, not a replacement

**Decided (see Migration plan): dual maintenance, not a flag day.** `registerSchema()` keeps
deriving the `wb-${name}` tag key (`schema-builder.js:126`) and `tagToSchema` stays exactly as
it is — old `<wb-card>` markup keeps resolving through the existing path, untouched.
`detectSchema()` gains a *second*, independent check: does the element carry an `x-{name}`
attribute matching a registered schema? If either check matches, build it. No existing
call site's behavior changes; a new one is added alongside. This is what makes step 3 in the
migration plan safe to land before steps 4-6 (docs/tests/demos) are finished — both authoring
forms work simultaneously for as long as needed, and `wb-*` tags are only removed once nothing
in the repo (or, more importantly, nothing in a consumer's project) still depends on them.

### 4. CSS: mechanical augmentation, not a redesign

`src/styles/behaviors/data.css` already proves the pattern (`wb-table, .wb-table { ... }`
dual-selects both). ~69 bare-tag selector lines across ~29 files in
`src/styles/behaviors/` need the same treatment: `wb-foo {` → `wb-foo, .wb-foo {`. Since
`schema-builder.js`'s `getBaseClass()`/`getPartClass()` already generate `wb-`-prefixed BEM
classes (`wb-card`, `wb-card__header`, …) regardless of tag identity, **every schema-built
element already gets its `.wb-*` class today** — the CSS augmentation is pure addition (a
class selector that will already match), never a removal, so this step is low-risk and can
happen incrementally, file by file, without waiting on the detection change.

### 5. The 6 real Custom Elements — separate track, not phase 1

`wb-card`, `wb-demo`, `wb-grid`, `wb-audio`, `wb-control`, `wb-fix-card` have actual
`customElements.define()`-registered classes with their own lifecycle. You can't rename their
tag without either (a) keeping the class registered under its current tag name and having a
plain-tag wrapper delegate to it, or (b) reworking each one to attach its behavior to
whatever host tag the author used (closer to how the schema-driven components would work, but
requires touching real class-based code, not just detection logic). Recommend treating these
as a **follow-up decision per tag**, not blocking the other 48 — `wb-demo` in particular is
internal tooling (wraps every code-panel demo on the docs site itself) and has the weakest
case for ever becoming author-facing plain HTML.

### 6. `data/custom-elements.json` / VS Code IntelliSense

Confirmed non-blocking: this file is hand-maintained (`scripts/generate-custom-elements.js`,
54-entry `customElementMappings` array) and already inaccurate today — it claims
`customElement: true` for ~48 tags that were never actually registered via
`customElements.define()`. It needs a rewrite regardless of this proposal (to describe
attributes instead of tags), but nothing about IntelliSense breaks that isn't already
questionable.

## Non-goals

- Does **not** rename generated BEM classes (`wb-card__header` stays `wb-card__header`) —
  `getBaseClass()`'s fallback to `` `wb-${schema.behavior}` `` is untouched.
- Does **not** touch the native-tag autoInject system (`nativeMap`, `x-ripple`-style
  attributes) — that system already matches the target model and needs no change.
- Does **not** migrate the 6 real Custom Elements in phase 1 (§5).
- Does **not** fix the dead "data attribute" branch or the stale `skip`/`skip-children` docs —
  worth their own issues, called out here so they aren't confused with this proposal's scope.

## Migration plan

1. **Land the opt-out fix** (`x-ignore` honored in `schema-builder.js`) — standalone, useful
   regardless of the rest, low risk, unblocks nothing else so it can go first.
2. **CSS dual-selector pass** — mechanical, file-by-file, ~29 files in
   `src/styles/behaviors/`. No behavior change, purely additive.
3. **Add attribute detection alongside tag detection (dual maintenance — decided)** —
   `detectSchema()`, `scan()`, and `startObserver()`'s tag test in `schema-builder.js` each
   gain an `x-{name}` attribute check as an *additional* match, not a replacement. `<wb-card>`
   and `<article>` both resolve to the same schema from this point on. Nothing else in
   the repo has to change for this step to ship — it's the safest possible way to make the new
   authoring form real without breaking a single existing page, demo, or test. This is the
   concrete next chunk of work; see below.
4. **New authoring — `x-*` form — becomes the one taught in docs/demos going forward.**
   Existing `docs/components/**/*.md` pages and `pages/*.html`/`demos/*.html` instances are
   migrated opportunistically (e.g. whenever a page is touched for another reason) rather than
   in one 66-file sweep, now that both forms genuinely coexist with no deadline forcing a rush.
5. **Test suite catches up as pages migrate** — no separate 50-file sweep either; a test only
   needs updating when the page/demo it covers actually switches attribute forms. The 3 tests
   that assert the naming convention itself
   (`schema-tag-name-resolution.spec.ts`, `no-redundant-tag-name-class.spec.ts`,
   `page-schema-validation.spec.ts`) need a decision on what "the convention" means once two
   forms are both valid — likely "either form is acceptable," not "wb-* is required."
6. **Regenerate `data/custom-elements.json`** once there's enough real `x-*` usage in the repo
   to make IntelliSense for it worthwhile — not urgent while `wb-*` is still the dominant form.
7. **Decide per-tag on the 6 real Custom Elements** (§5) — separate follow-up, own proposal.
   Not blocked by, and doesn't block, steps 1-6.
8. **Retire `wb-*` tag detection entirely** — only once nothing in the repo (or a consumer's
   project) still authors with it. No target date; dual maintenance has no forced end.

## Decisions

- **Transition strategy: dual maintenance, indefinitely.** Both `<wb-card>` and
  `<article>` resolve to the same schema for as long as this stays useful — no flag
  day, no forced migration deadline, no target date to "finish." This directly changes step 3
  above from "risky, needs a window" to "purely additive, safe to ship alone."
- **Opt-out: `x-ignore`, no new attribute.** One opt-out, not two — covers both "skip native
  behavior" and "skip composite DOM building" under a single name. Section 2 above is final.
- **`proposed-custom-elements.md` is obsolete**, marked as such at the top of that file. It
  asked for more `wb-*` tags; this proposal's `x-*` attribute form is now the way to add the
  same layout behaviors (`x-grid`, `x-flex`, `x-stack`, …) it was proposing tags for.

All three open questions from the original draft are resolved as of this update — nothing
outstanding here blocks starting issue #521 (the schema-builder.js detection change).
