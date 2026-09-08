# Drawer

Slide-out panel overlay from screen edge

## Type — decorates a semantic element

`x-drawer` is the **aside behavior**. It attaches to `<aside>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<button x-drawer title="Filters" content="Status, owner, label and date range live here." position="end" width="320px">
  x-drawer · title: Filters · content: Status, owner, label and date range live here. · position: end · width: 320px
</button>
```

### On a different element

Use `x-drawer` when the host is not a `<aside>` and you want the same behavior:

```html
<div x-drawer>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Drawer title |
| `content` | `string` | — | Drawer body content |
| `position` | `left` · `right` · `top` · `bottom` | `right` |  |
| `width` | `string` | `320px` | Drawer width (left/right) |
| `height` | `string` | `auto` | Drawer height (top/bottom) |
| `close-on-backdrop` | `boolean` | `true` | Close on backdrop click |
| `close-on-escape` | `boolean` | `true` | Close on Escape key |
| `show-close` | `boolean` | `true` | Show close button |
| `variant` | `default` · `overlay` · `push` | `overlay` |  |

## Events

- `wb:drawer:open` — Drawer opened
- `wb:drawer:close` — Drawer closed

## Methods

- `open()` — Opens the drawer
- `close()` — Closes the drawer
- `toggle()` — Toggles the drawer
- `isOpen()` — Returns open state

## Live example

See `x-drawer` on the [Behaviors showcase](/?page=behaviors) — search for `x-drawer` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/drawer.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
