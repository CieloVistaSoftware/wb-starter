# WB-Starter v3 Standards

## Purpose

WB-Starter v3 is a composition-only system. Behavior functions receive an existing
DOM element and apply capability to it in Light DOM. There is no component base
class, no component inheritance hierarchy, and no Shadow DOM.

The words **component** and **behavior** describe the contract of the markup and
the responsibility of the function. They do not describe two different runtime
mechanisms: both are resolved by the WB registry and invoked as functions.

## Component vs. Behavior

### Component

Use a component when the markup needs a named WB-Starter boundary with a defined
presentation or structure. Components use an autonomous `<wb-*>` tag. The mapped
behavior may create or normalize the component's internal Light DOM, apply its
classes, bind events, and expose its API.

<div x-demo>
<article title="Release notes" variant="glass">
  <p>Changes in this release.</p>
</article>
</div>

<div x-demo>
<dialog title="Confirm action">
  <p>Continue?</p>
</dialog>
</div>

The tag is the component's public boundary. It is not a class instance that must
extend a shared base class. A `<wb-*>` tag is mapped to a behavior in
`src/core/tag-map.js`; registration shims required by the Custom Elements API do
not create an inheritance model or hold shared component logic.

Component schemas live in `src/wb-models/{name}.schema.json`. Component behavior
functions live in `src/wb-viewmodels/{name}.js`, and their styles live in the
appropriate file under `src/styles/behaviors/`.

### Behavior

Use a behavior when an existing element already has the right semantic meaning and
only needs an enhancement. An explicit behavior uses an `x-*` attribute:

<div x-demo>
<button x-ripple type="button">Save</button>
</div>

<div x-demo>
<a x-tooltip="Open the release notes" href="/release-notes">Release notes</a>
</div>

<div x-demo>
<nav x-sticky aria-label="Primary">
  <a href="#top">Top</a>
  <a href="#docs">Docs</a>
</nav>
</div>

An `x-*` attribute is an opt-in declaration. It does not replace the host element,
and it does not turn that element into a subclass. A behavior function must work
with the element it receives and must preserve the element's native semantics.

Effects, utilities, and enhancements generally belong here. A behavior can also
be applied to a `<wb-*>` host when that combination is meaningful.

### Semantic auto-injection

Use native semantic HTML first when it expresses the meaning of the content or
control. When auto-injection is enabled for the page, WB can map selected native
elements to behaviors through `nativeMap`:

```html
<button variant="primary" type="button">Save</button>
<details>
  <summary>More information</summary>
  <p>Additional details.</p>
</details>
<table sortable>
  <caption>Recent releases</caption>
  ...
</table>
```

These elements remain native HTML elements. The behavior decorates them in place;
it must not replace a meaningful native element with a generic `<div>` or require
an unnecessary `x-*` marker. The supported mappings are maintained in
`src/core/tag-map.js` (`nativeMap`). Auto-injection is a page configuration choice,
so do not assume that a bare native element is enhanced on every page.

The native element's own semantics remain authoritative. Use correct headings,
labels, captions, landmarks, button types, form relationships, alternative text,
and keyboard behavior before adding visual enhancements. Add ARIA only when native
HTML cannot express the required state or relationship.

## Choosing a Markup Form

Use this order when authoring markup:

1. Choose the correct native semantic element when it expresses the requirement.
2. Add an `x-*` behavior when an existing element needs an explicit enhancement.
3. Use a `<wb-*>` component when a named WB-Starter component boundary or owned
   structure is required.

Do not use a `<wb-*>` tag merely to style an element, and do not use a generic
`<div>` when a native semantic element is available. Do not use both a generic
native mapping and an explicit replacement behavior on the same host unless the
combination is intentional and supported. More-specific mappings, such as
`input[type="checkbox"]`, take precedence over generic mappings such as `input`.

## Naming and Attributes

### Tags and behavior attributes

- Components use lowercase `<div>` tags.
- Explicit behaviors use lowercase `x-behavior-name` attributes.
- Behavior attributes may be boolean or carry the behavior's configuration value.

<div x-demo>
<span x-badge variant="success">Ready</div>
</div>

<div x-demo>
<button x-tooltip="Save this record" type="button">Save</button>
</div>

### Configuration attributes

Configuration attributes use clean names. Do not add `x-` or `data-` to a
component or behavior property:

<div x-demo>
<article title="Hello" variant="glass" hoverable></article>
</div>

```html
<input type="text" clearable>
<table sortable searchable></table>
```

`data-*` is not the canonical configuration API for `<wb-*>` or `x-*` elements.
Follow the component schema or behavior documentation for the accepted property
names and values. Do not use `data-*` attributes as a substitute for declared
properties.

## Light DOM and Composition Rules

- Never use `attachShadow()`, `this.shadowRoot`, or `ShadowRoot`.
- Never create or extend `WBBaseComponent` or another shared component base class.
- Behavior functions receive `(element, options)` and operate on that element.
- Put reusable logic in exported helper functions, behaviors, schemas, and design
  tokens rather than parent classes.
- Preserve existing child content unless the component contract explicitly owns
  and transforms it.
- Generate per-instance IDs when ARIA relationships require them; never hardcode
  an ID inside reusable component behavior.
- Use ES modules (`import` and `export`) throughout the implementation.

## File Layout

| Concern | Location |
| --- | --- |
| Component schema | `src/wb-models/{name}.schema.json` |
| Behavior function | `src/wb-viewmodels/{name}.js` |
| Behavior registry/index | `src/wb-viewmodels/index.js` |
| Tag and selector mappings | `src/core/tag-map.js` |
| Behavior styles | `src/styles/behaviors/{name}.css` |

Keep component and behavior CSS in the existing behavior style files. Do not add
inline style blocks or page-local copies of component styles.

## Runtime Dispatch

The WB runtime discovers declarations through three maps:

| Markup | Map | Meaning |
| --- | --- | --- |
| `<article>` | `elementMap` | Named component boundary |
| `<button x-ripple>` | `extensionMap` | Explicit enhancement |
| `<button>`, `<details>`, `<table>` | `nativeMap` | Optional semantic auto-injection |

`WB.init()` scans existing markup and can observe dynamically added markup.
`WB.inject(element, name, options)` applies a resolved behavior once to the host
element. The dispatch path is shared, but the markup contract determines whether
the function is being used as a component or as an enhancement.

## Examples

### Component with semantic children

<div x-demo>
<div x-as-article>
  <header>
    <h2>Article title</h2>
    <p>Short summary.</p>
  </header>
  <p>Article content.</p>
  <footer>
    <time datetime="2026-08-07">August 7, 2026</time>
  </footer>
</div>
</div>

The `<div x-as-article>` boundary identifies the component, while its internal
`<header>`, heading, paragraph, footer, and `<time>` elements retain their native
meaning.

### Native element with an explicit enhancement

<div x-demo>
<button x-ripple type="submit">Submit</button>
</div>

The button remains a button. The behavior adds the interaction without changing
the control's native role, focus model, or form behavior.

### Native element with configured auto-injection

```html
<form validate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>
  <button type="submit">Continue</button>
</form>
```

When the page enables the corresponding native mappings, WB enhances these
elements in place. The markup remains valid and meaningful without WB.

## Migration from Legacy Syntax

Legacy v2 component declarations used behavior attributes for structures that are
now named components. Convert the structure to a `<wb-*>` tag, while retaining
`x-*` for genuine enhancements:

```html
<!-- Legacy v2 -->
<div x-card title="Hello" variant="glass">Content</div>
<button x-ripple type="button">Click me</button>

<!-- v3 -->
<article title="Hello" variant="glass">Content</article>
<button x-ripple type="button">Click me</button>
```

Do not convert semantic HTML to a custom tag just to obtain styling. Prefer the
native form and use `nativeMap` or an explicit `x-*` behavior as appropriate.

## Quick Reference

```text
COMPONENT BOUNDARY
<article title="..." variant="glass">...</article>

EXPLICIT ENHANCEMENT
<button x-ripple type="button">Save</button>

SEMANTIC HTML WITH OPTIONAL AUTO-INJECTION
<button type="button">Save</button>
<details><summary>More</summary>...</details>

CONFIGURATION
title="..." variant="glass" sortable
No x- prefix. No data- prefix.

IMPLEMENTATION
Schema:   src/wb-models/{name}.schema.json
Behavior: src/wb-viewmodels/{name}.js
Styles:   src/styles/behaviors/{name}.css
```
