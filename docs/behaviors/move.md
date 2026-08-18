# Move - wb-starter v3.0

Reorders items inside a grid or flex container by swapping DOM positions —
direction buttons (`x-moveup`/`x-movedown`/`x-moveleft`/`x-moveright`) nested inside
an `x-move` container swap their item with the adjacent one when clicked.

## Overview

| Property | Value |
|----------|-------|
| Behavior | `move` |
| Container attribute | `x-move` |
| Direction attributes | `x-moveup`, `x-movedown`, `x-moveleft`, `x-moveright` |
| Custom Tag | `<wb-move>` |
| Applies to | a grid/flex container (`x-move`) with descendant buttons (`x-move{direction}`) |
| Category | Interactive |
| Schema | `src/wb-models/move.schema.json` |
| Source | `src/wb-viewmodels/move.js` |

Both forms run the same behavior: `<div x-move>` and `<wb-move>` are equivalent —
the tag form is registered in the tag map
([`src/core/tag-map.js`](../../src/core/tag-map.js)) and dispatches to the identical
`move()` function. `autoInject` is on by default site-wide
([`src/core/config.js`](../../src/core/config.js)), so `x-move` activates without
any manual `WB.scan()` call.

`move()` is the **container** entry point: it adds the `wb-move` marker class and
wires up any descendant element carrying one of the four direction attributes below.
Each direction attribute works stand-alone too (a button anywhere with `x-moveup`
etc. wires itself), but needs an ancestor whose own parent is `display: grid` or
`display: flex` (or that carries the marker attribute `data-grid-item`/
`data-moveable`, or class `grid-item`/`moveable`) to know which element is "the
item" to move.

## Properties

`move` itself takes no configuration attributes — it only scans for and wires the
direction buttons below.

| Direction attribute | Swaps the item with... |
|----------------------|--------------------------|
| `x-moveup` | The item `columns` positions earlier (grid) or the previous sibling (single-column list) |
| `x-movedown` | The item `columns` positions later (grid) or the next sibling (single-column list) |
| `x-moveleft` | The previous sibling |
| `x-moveright` | The next sibling |

Grid column count is read from the container's computed `grid-template-columns`; a
non-grid (flex/list) container is treated as a single column, so `x-moveup`/
`x-movedown` behave like `x-moveleft`/`x-moveright` there.

## Usage

### Grid reorder buttons

<wb-demo>
<div x-move style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
  <div style="padding: 1rem; border: 1px solid var(--border-color);">
    Item 1 <button x-moveright>→</button>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-color);">
    Item 2 <button x-moveleft>←</button> <button x-moveright>→</button>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-color);">
    Item 3 <button x-moveleft>←</button>
  </div>
</div>
</wb-demo>

### Custom Tag

<wb-demo>
<wb-move style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
  <div style="padding: 1rem; border: 1px solid var(--border-color);">
    A <button x-moveright>→</button>
  </div>
  <div style="padding: 1rem; border: 1px solid var(--border-color);">
    B <button x-moveleft>←</button>
  </div>
</wb-move>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.wb-move` | Always, on the `x-move` container | Marker class; no dedicated stylesheet rules ship for it |

## Events

| Event | Fires when | `detail` | Bubbles |
|-------|-----------|----------|---------|
| `wb:reorder` | A swap completes | `{ items }` — the container's children in their new order | Yes |

```javascript
document.querySelector('[x-move]').addEventListener('wb:reorder', (e) => {
  console.log('New order:', e.detail.items);
});
```

## Accessibility

The direction buttons are real `<button>` elements, so they're keyboard-focusable
and activate on Enter/Space by default — but `move` itself adds no `aria-live`
region announcing the reorder, so screen reader users get no automatic
notification that the DOM order changed. If reordering is user-facing (not just
decorative), pair it with your own live-region announcement on `wb:reorder`.

## Source

[src/wb-viewmodels/move.js](../../src/wb-viewmodels/move.js)
