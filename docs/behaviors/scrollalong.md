# ScrollAlong - wb-starter v3.0

Sticky-sidebar / "tag-along" positioning — makes an element (typically an `<aside>`
or `<nav>`) stick to the top of the viewport as the page scrolls past it, via CSS
`position: sticky`.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `scrollalong` |
| Attribute | `x-scrollalong` |
| Attribute form | `<div x-scrollalong>` |
| Applies to | any element, typically inside a flex/grid layout |
| Category | Layout |
| Schema | `src/wb-models/scrollalong.schema.json` |
| Source | `src/wb-viewmodels/scrollalong.js` |

Both forms run the same behavior: `<aside x-scrollalong>` and `<div x-scrollalong>` are
equivalent — the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`scrollalong()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-scrollalong` activates
without any manual `WB.scan()` call.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `offset` | `offset` | number (px) | `0` | Distance from the top of the viewport once stuck |

The behavior sets `position: sticky`, `top: {offset}px`, and `align-self:
flex-start` directly on the element — it relies on the element already being sized
by its container, it does not add any wrapper or placeholder.

## Usage

### Default

<div x-demo>
<aside x-scrollalong style="padding: 1rem; border: 1px solid var(--border-color);">
  This element sticks to the top of the viewport as you scroll past it.
</aside>
</div>

### With an offset

<div x-demo>
<aside x-scrollalong offset="20" style="padding: 1rem; border: 1px solid var(--border-color);">
  Sticks 20px from the top instead of flush against it.
</aside>
</div>

### Attribute form

<div x-demo>
<div x-scrollalong style="padding: 1rem; border: 1px solid var(--border-color); display: block;">
  Same behavior via the &lt;x-scrollalong&gt; custom tag.
</div>
</div>

## CSS Classes

`scrollalong` adds no CSS class to the element — it applies `position`, `top`, and
`align-self` directly as inline styles, so there is nothing to target via a
stylesheet selector.

## Accessibility

`scrollalong` only changes positioning — it adds no ARIA roles or attributes, and
the element's semantics and DOM order are unchanged. Because the element stays
visible while the rest of the page scrolls under it, make sure it doesn't obscure
focus outlines or interactive content in a way that blocks keyboard navigation.

## Source

[src/wb-viewmodels/scrollalong.js](../../src/wb-viewmodels/scrollalong.js)
