# WB-Starter v3 Standards

## Purpose

WB-Starter is semantic HTML plus behaviors. A behavior is a plain function that
receives an element that already exists and enhances it in Light DOM. There are
no components, no base classes, no inheritance and no Shadow DOM.

John: *"Our goal is to honor html semantic elements but add other wb-* markup
where we want."* So the guiding rule is: **write the native element that means
what you want, and let a behavior enhance it.** Reach for an `x-*` attribute only
when no native element carries the meaning, or to add an enhancement on top.

This page describes what ships, checked against the source on 2026-10-06 (#340).
Where it names a file, that file is the authority if the two ever disagree.

## What a behavior is

A behavior is a function in `src/wb-viewmodels/`:

```js
export function ripple(element, options = {}) {
  // enhance `element` in place: classes, listeners, built parts, an API
  return () => { /* cleanup: undo listeners and observers */ };
}
```

- It receives `(element, options)` and works on that element. It never replaces
  the element and never changes its native role.
- It may build the element's internal Light DOM (a card builds its header and
  footer), add classes, bind events and expose an API on the element
  (`element.wbCardExpandable.show()`).
- It returns a cleanup function when it attached anything that outlives the call.

There is no second kind of thing. Version 3 called some behaviors "components"
because they were reached through a custom tag; those tags are deprecated, and
4.0.0 removed all 104 of them (John: *"we are not using components any more"*), and every one became
either the semantic element that already auto-injects it or an `x-*` attribute
on a host. `elementMap` in `src/core/tag-map.js` is kept, empty on purpose, so
nothing that imports it breaks.

## How a behavior reaches an element

There are two ways, both resolved in `src/core/tag-map.js`:

| Markup | Map | Meaning |
| --- | --- | --- |
| `<article>`, `<dialog>`, `<details>`, `<table>`, `<button>`, `<nav>`, … | `nativeMap` | Auto-injection: the native element gets its behavior with no attribute |
| `<button x-ripple>`, `<span x-badge>`, `<div x-alert>` | `extensionMap` | An explicit `x-*` attribute opts the element in |

**Auto-injection is on by default** (`src/core/config.js`, `autoInject: true`). A
page turns it off only with `WB.init({ autoInject: false })`, and then only `x-*`
attributes are honoured. A more specific selector wins over a generic one:
`input[type="checkbox"]` gets the checkbox behavior, not the generic input one.

An `x-*` attribute is a declaration, not a replacement. Writing it does not turn
the element into a subclass and does not hide what the element is. Any element
can opt out of auto-injection with `x-ignore`
([escape hatches](../escape-hatches.md)).

`WB.init()` scans the page and observes markup added later. `WB.inject(element,
name, options)` applies one behavior to one element once; every path (native,
`x-*`, schema) goes through it, which is why `x-ignore` is checked there.

## Choosing a markup form

Use this order:

1. **The native element that means what you want.** `<article>` for a card,
   `<dialog>` for a dialog, `<details>` for a disclosure, `<table>` for tabular
   data, `<nav>` for navigation. It is enhanced automatically.
2. **An `x-*` enhancement on that element** when it needs more than its native
   meaning: `<button x-ripple>`, `<a x-tooltip="…">`.
3. **An `x-*` behavior on a neutral host** (`<div x-alert>`, `<div x-tabs>`) only
   when no native element carries the meaning.

Never add the behavior an element already gets: no `x-card` on an `<article>`, no
`x-button` on a `<button>` (DEMOS-AND-DOCS-STANDARDS.md §32, #1141; enforced by
`tests/compliance/no-redundant-x-attribute.spec.ts`). A *different* behavior or a
variant (`<article x-cardimage>`) is an opt-in, not a duplicate. Never use a
generic `<div>` when a native element means the right thing.

### Naming an x- token after an element

An `x-*` token may carry an HTML element's name only when `nativeMap` maps that
element to the same behavior. Then the token is how a host that is *not* that
element asks for it: `<div x-button>`, `<span x-mark>`. A token named after an
element that nothing maps is a name that says nothing about what the behavior
does. `x-span` was the one case; it is now `x-status`, and `x-span` stays only as
an alias in `BEHAVIOR_ALIASES` (#1105). Enforced by
`tests/compliance/x-tokens-named-after-elements-are-mapped.spec.ts`.

### Inline text elements we do not map

Mapping an element commits us to render it well, so "not mapped" is a decision
on the record (#1105). Of MDN's 29 inline text elements, `code`, `kbd` and
`mark` are mapped. The other 26 are not:

| Elements | Decision | Why |
| --- | --- | --- |
| `b` `i` `em` `strong` `s` `u` `small` `sub` `sup` | Not mapped | The browser's own rendering plus the theme's base styles is the whole job; there is nothing for script to add. |
| `abbr` `cite` `dfn` `q` `var` `samp` `data` | Not mapped | Their meaning is in the element and its attributes (`title`, `value`). Use the element; don't re-express it as attributes on something else. |
| `bdi` `bdo` `br` `wbr` `ruby` `rt` `rp` | Not mapped | Text-layout primitives the browser handles completely. |
| `time` | Not mapped | Write `<time datetime="…">` instead of inventing `date=` attributes. A behavior that formats it would be new work with its own issue. |
| `a` | Not mapped | A behavior on every link would run on the whole page. Links opt in with `x-*` enhancements such as `x-tooltip`. |
| `span` | Not mapped | It has no semantics by definition. It is the neutral inline host for `x-*` behaviors. |

### Choosing a value or an action: select or x-dropdown

**The test: does the user pick a value that the form submits, or run an
action?** A value is `<select>`; an action is `x-dropdown` (#682).

- **`<select>`** is the control for choosing a value. The platform supplies the
  popup, keyboard model, mobile rendering, form participation and
  accessibility, and nothing hand-built matches it. It takes `variant`, `size`,
  `clearable`, `searchable` and `multiple` itself, so no wrapper is needed.
- **`x-dropdown`** is for what `<select>` structurally cannot do: a menu of
  actions ("Duplicate", "Export", "Delete"), items with rich content (icons,
  secondary text, links), or a menu that stays open across several choices.
  An `<option>` holds text only and closes on pick.
- **`<div x-select options='…'>`** is deprecated. It rebuilt a native control
  in the light DOM to accept options as a JSON attribute, and that rebuild is
  where #390, #448 and #497 came from. It keeps working; new markup writes a
  `<select>` with `<option>` children.

## Configuration attributes

- A behavior's options are plain attributes named exactly as its schema
  property: `title`, `variant`, `hoverable`, `showClose`. No `x-` prefix and no
  `data-` prefix on an option.
- The spelling rules (camelCase for a multi-word name, the dashed spelling kept
  as a read fallback) live in
  [ATTRIBUTE-NAMING-STANDARD.md](../architecture/standards/ATTRIBUTE-NAMING-STANDARD.md).
  It is the authority; this page does not restate it.
- An attribute takes intent (`variant="success"`), never CSS internals.
- Booleans are bare attributes: `hoverable`, not `hoverable="true"`.

<div x-demo>
<article title="Release notes" subtitle="Version 3" variant="glass" hoverable>
  <p>Changes in this release.</p>
</article>
</div>

## Schemas

Each behavior with options has a schema, `src/wb-models/{name}.schema.json`. It
declares the behavior's properties, events, methods and CSS variables, and the
generated docs, IntelliSense and several compliance specs are built from it. So
a schema must declare what the code does, no more and no less (#1600 found one
naming an event and four methods the code never had).

A schema's `$view` can also build DOM: `SchemaBuilder.processElement()`
(`src/core/mvvm/schema-builder.js`) constructs an element's parts from it. That
is the one trap in this design: **a schema and a behavior must never both build
the same element's DOM.** When they did, they raced, and the loser's markup
silently overwrote the winner's (the cardimage and cardvideo failures in #279).
A behavior that builds its own complete DOM is listed in `SCHEMA_EXCLUDED_TAGS`
in schema-builder.js, or its schema has an empty `$view`, and the schema builder
then leaves the element alone. Add a behavior to that list only after reading
its source and confirming it builds everything it needs unconditionally.

## Light DOM and composition rules

- Never use `attachShadow()`, `this.shadowRoot` or `ShadowRoot`.
- Never create or extend a shared base class. Shared logic is an exported helper
  function (`src/wb-viewmodels/helpers.js`, `src/core/`), never a parent class.
- Preserve the element's existing children unless the behavior's contract says
  it owns and transforms them.
- Generate per-instance IDs when ARIA relationships need them; never hard-code an
  ID inside a behavior.
- Styling belongs in a stylesheet under `src/styles/behaviors/`. A behavior sets
  classes or custom properties; it does not write `element.style` for anything a
  stylesheet can say (#779).
- ES modules only (`import` / `export`).

## File layout

| Concern | Location |
| --- | --- |
| Behavior function | `src/wb-viewmodels/{name}.js` (semantic elements: `src/wb-viewmodels/semantics/`) |
| Lazy-load registry | `src/wb-viewmodels/index.js` |
| Element and attribute mappings | `src/core/tag-map.js` (`nativeMap`, `extensionMap`) |
| Schema | `src/wb-models/{name}.schema.json` |
| Styles | `src/styles/behaviors/{name}.css`, loaded per behavior by `src/styles/behavior-css-manifest.js` |
| Generated doc | `docs/behaviors/{name}.md` |

## Examples

### A native element, auto-injected

<div x-demo>
<details>
  <summary>More information</summary>
  <p>Additional details.</p>
</details>
</div>

No attribute: `<details>` is in `nativeMap`. Without WB it is still a working
disclosure.

### A native element with an explicit enhancement

<div x-demo>
<button x-ripple type="button">Save</button>
</div>

The button stays a button: same role, focus order and form behavior. The ripple
is added on top.

### A behavior on a neutral host

<div x-demo>
<div x-alert variant="success" title="Saved">Your changes were saved.</div>
</div>

No native element means "alert box", so the behavior goes on a `<div>`.

## Deprecated: wb- prefixed tags

Every custom tag named with the `wb-` prefix is deprecated and was removed in
4.0.0. Do not write one,
and do not show one in an example. Write the native element that auto-injects
the behavior, or put the `x-*` attribute on a host:

```html-static
<article title="Hello" variant="glass">Content</article>
<div x-alert variant="info">Heads up</div>
```

Do not wrap semantic HTML in a custom tag to get styling, and do not add the
auto-injected behavior's `x-*` attribute to its own native element.

## Quick reference

```text
NATIVE ELEMENT, AUTO-INJECTED
<article title="..." variant="glass">...</article>
<details><summary>More</summary>...</details>

EXPLICIT ENHANCEMENT
<button x-ripple type="button">Save</button>

BEHAVIOR ON A NEUTRAL HOST (no native element fits)
<div x-alert variant="info">...</div>

OPTIONS
title="..." variant="glass" hoverable
Named as the schema property. No x- prefix. No data- prefix.

OPT OUT
<table x-ignore>...</table>

IMPLEMENTATION
Behavior: src/wb-viewmodels/{name}.js
Mapping:  src/core/tag-map.js
Schema:   src/wb-models/{name}.schema.json
Styles:   src/styles/behaviors/{name}.css
```
