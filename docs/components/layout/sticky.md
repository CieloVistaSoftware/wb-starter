# Sticky - wb-starter v3.0

Makes an element stick to the viewport once the page scrolls past it, using a
scroll listener rather than plain CSS `position: sticky` — this lets it swap
in a fixed-position placeholder (so layout doesn't jump) and fire real events
when the stuck state changes.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `sticky` |
| Attribute | `x-sticky` |
| Custom Tag | `<div x-sticky>` |
| Applies to | any element |
| Category | Layout |
| Schema | `src/wb-models/sticky.schema.json` |
| Source | `src/wb-viewmodels/sticky.js` |

Both forms run the same behavior: `<nav x-sticky>` and `<div x-sticky>` are
equivalent — the tag form is registered in the tag map ([`src/core/tag-map.js`](../../../src/core/tag-map.js)) and dispatches to the identical `sticky()` function.

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `offset` | `offset` | number (px) | `0` | Distance from the top of the viewport once stuck |
| `zIndex` | `z-index` | number | `100` | `z-index` applied while stuck |
| `threshold` | `threshold` | number (px) | element's own top | Scroll position (`window.scrollY`) that triggers sticking; defaults to the element's natural top offset |
| `stuckClass` | `class-name` | string | `"is-stuck"` | Class added to the element while it is stuck |
| `animate` | `animate` | boolean | `true` | Adds a `box-shadow` transition when sticking/unsticking; set `animate="false"` to disable |

While stuck, the element switches to `position: fixed` and a placeholder
`<div class="sticky-placeholder">` is inserted in its place to prevent layout
shift.

## Usage

### Default

<wb-demo>
<div x-sticky>
  <p>Scroll the page — once this element's natural position passes the top of the viewport, it sticks there.</p>
</div>
</wb-demo>

### Offset and z-index

<wb-demo>
<div x-sticky offset="10" z-index="500">
  <p>Sticks 10px from the top, above most other stacked content.</p>
</div>
</wb-demo>

### Custom Tag

<wb-demo>
<div x-sticky>
  <p>Same behavior via the &lt;wb-sticky&gt; custom tag.</p>
</div>
</wb-demo>

### Disabled animation

<wb-demo>
<div x-sticky animate="false">
  <p>No shadow transition when the stuck state toggles.</p>
</div>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-sticky` | Always (except on a literal `<div x-sticky>` host, which is matched by its tag selector instead) | Base styling hook |
| `.is-stuck` (or the `class-name` override) | While stuck | Adds a drop shadow (`box-shadow: 0 2px 10px rgba(0,0,0,0.15)`) |

## Events

| Event | Fires when | `detail` |
|-------|-----------|----------|
| `wb:sticky:stuck` | The element becomes stuck | `{ offset }` |
| `wb:sticky:unstuck` | The element unsticks | — |

```javascript
document.querySelector('[x-sticky]').addEventListener('wb:sticky:stuck', (e) => {
  console.log('Stuck at offset', e.detail.offset);
});
```

## Methods

| Method | Description |
|--------|-------------|
| `element.wbSticky.stick()` | Forces the stuck state on |
| `element.wbSticky.unstick()` | Forces the stuck state off |
| `element.wbSticky.isStuck()` | Returns the current stuck state (`boolean`) |
| `element.wbSticky.refresh()` | Recalculates the trigger point and re-evaluates scroll position |

## Accessibility

`sticky` does not add ARIA roles or attributes — the element's semantics are
unchanged, only its positioning. Keep in mind that a persistently stuck
element (e.g. a sticky header) reduces the visible viewport for the rest of
the page's content, so avoid stacking multiple stuck elements at high
`z-index` values that could obscure focus outlines on the content beneath
them.

## Source

[src/wb-viewmodels/sticky.js](../../../src/wb-viewmodels/sticky.js)
