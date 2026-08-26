# accordion

Turns a set of titled child sections into independently expandable/collapsible items. Implemented by `accordion()` in [src/wb-viewmodels/collapse.js](../../src/wb-viewmodels/collapse.js) (registered under the `collapse` module).

> ⚠️ **Deprecated.** `<div x-accordion>` / `x-accordion` still work and are documented
> here for existing markup, but new pages should use the native
> [`<details>`/`<summary>`](../components/semantics/details.md) element instead —
> it needs no JavaScript, works out of the box with assistive tech, and doesn't
> carry the quirks described below. Using `<div x-accordion>` specifically also logs
> a one-time `console.warn` in the browser console.

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-accordion` |
| Custom Tag (deprecated) | `<div x-accordion>` |
| Behavior function | `accordion()` — module `collapse` (`src/wb-viewmodels/collapse.js`) |
| Recommended replacement | `<details>`/`<summary>` — see [details](../components/semantics/details.md) |
| Root CSS Class | `x-accordion` (host), `.x-accordion-item` (each item) |
| Category | Interactive |
| Schema | none (no `accordion.schema.json`) |

## Properties

`accordion()` only looks at plain attributes — no `data-*` equivalents beyond the
back-compat ones listed below (Tier-1 Law 11: no `data-*` on `x-*`/`wb-*` elements).

| Attribute | Applies to | Type | Description |
|-----------|-----------|------|-------------|
| `accordion-title` | each child element | string | Marks that child as its own accordion item; the value becomes the item's clickable heading. `data-accordion-title` / `data-title` are accepted as back-compat aliases |
| `open` | a child with `accordion-title` | boolean | That specific item starts expanded |
| `open` | the host element | boolean | When present, and no child already carries its own `open`, the **first** item starts expanded |
| `title` | `<div x-accordion>` host only | string | Heading text for the single-item form — only read when the host tag is literally `<div x-accordion>` (not read for `x-accordion` on any other tag) |

**Fallback behavior worth knowing:** `accordion()` only builds real accordion
markup (`.x-accordion-item` / `.x-accordion-head` / `.x-accordion-body`) when
either (a) the host has children carrying `accordion-title`, or (b) the host tag
is literally `<div x-accordion>`. Put `x-accordion` on any *other* element with no
titled children (e.g. `<div x-accordion title="Q">A</div>`) and it silently falls
back to the plain [`x-collapse`](x-collapse.md) behavior instead — a single
toggle button + content panel styled with `.x-collapse__trigger` /
`.x-collapse__content`, not accordion classes. Use the multi-item form below for
a real accordion via `x-accordion` on semantic HTML.

## Usage

### Multi-item FAQ list

<div x-demo>
<div x-accordion>
  <div accordion-title="What is wb-starter?">A schema-first, no-build website starter kit.</div>
  <div accordion-title="Does it need a build step?">No — every behavior runs directly in the browser.</div>
  <div accordion-title="Is x-accordion the recommended choice?">No, prefer the native details/summary element for new markup.</div>
</div>
</div>

### One item pre-opened

<div x-demo>
<div x-accordion>
  <div accordion-title="Closed by default">This item starts collapsed.</div>
  <div accordion-title="Opened by default" open>This item starts expanded because it carries its own open attribute.</div>
</div>
</div>

### Host-level `open` expands the first item

<div x-demo>
<div x-accordion open>
  <div accordion-title="First item">Opens automatically — the host itself carries open, and no child overrides it.</div>
  <div accordion-title="Second item">Stays collapsed.</div>
</div>
</div>

## CSS Classes

| Class | Applied to | Description |
|-------|-----------|-------------|
| `x-accordion` | host element | Marker class added once the accordion is built |
| `.x-accordion-item` | each item wrapper | Bordered row; adjacent items share a collapsed border |
| `.x-accordion-item.open` | an expanded item | Reveals `.x-accordion-body` |
| `.x-accordion-head` | each item's clickable row | `role="button"`, keyboard-focusable, flex row (title + icon) |
| `.x-accordion-title` | the heading text span | — |
| `.x-accordion-icon` | the ▸/▾ disclosure glyph | Text content flips between `▸` (closed) and `▾` (open); no CSS transition |
| `.x-accordion-body` | the content panel | `display: none` unless the parent `.x-accordion-item` has `.open` |

## Events

| Event | Fires when | `detail` |
|-------|-----------|----------|
| `wb:accordion:ready` | the multi-item form finishes building | `{ items }` — number of items built |
| `wb:accordion:toggle` | any item's head is clicked or activated via Enter/Space | `{ open, title }` |

Both events bubble, so one listener on an ancestor (or `document`) catches every
accordion on the page:

```javascript
document.addEventListener('wb:accordion:toggle', (e) => {
  console.log(`"${e.detail.title}" is now ${e.detail.open ? 'open' : 'closed'}`);
});
```

- [Schema/Test]: no dedicated schema or test file for `accordion`; see
  [tests/behaviors/accordion.spec.ts](../../tests/behaviors/accordion.spec.ts) for
  the disclosure-behavior coverage that does exist.
