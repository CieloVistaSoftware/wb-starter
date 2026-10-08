# Drawer

`x-drawer` turns a button into the trigger for a slide-out panel: clicking it opens a drawer from the `position` edge with `title` and `content`, closed by its close button, Escape or a backdrop click.

## Usage

<div x-demo>
<button x-drawer title="Filters" content="Status, owner, label and date range live here." position="right" width="320px">Open filters</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | text | — | Drawer title |
| `content` | text or HTML | — | Drawer body content |
| `position` | `left` · `right` · `top` · `bottom` | `right` |  |
| `width` | CSS length | `320px` | Drawer width (left/right) |
| `height` | CSS length | `auto` | Drawer height (top/bottom) |
| `closeOnBackdrop` | `boolean` | `true` | Close on backdrop click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `showClose` | `boolean` | `true` | Show close button |
| `variant` | `default` · `overlay` · `push` | `overlay` |  |

## Methods

- `open()` — Opens the drawer
- `close()` — Closes the drawer
- `toggle()` — Toggles the drawer
- `isOpen()` — Returns open state

<sub>Schema: [`drawer.schema.json`](../../src/wb-models/drawer.schema.json)</sub>
