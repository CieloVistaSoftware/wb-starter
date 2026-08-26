# Drawer Layout

Collapsible sidebar layout with toggle

## Type — decorates a semantic element

`x-drawer-layout` is the **aside behavior**. It attaches to `<aside>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<aside x-drawer-layout position="start" width="220px" min-width="64px">
  <nav><a href="#">Overview</a><a href="#">Runs</a><a href="#">Settings</a></nav>
</aside>
```

### On a different element

Use `x-drawer-layout` when the host is not a `<aside>` and you want the same behavior:

```html
<div x-drawer-layout>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | `left` · `right` | `left` |  |
| `width` | `string` | `250px` | Expanded width |
| `min-width` | `string` | `48px` | Collapsed width |
| `collapsed` | `boolean` | `false` | Initial collapsed state |

## Events

- `wb:drawerLayout:toggle` — Drawer toggled

## Methods

- `expand()` — Expands the drawer
- `collapse()` — Collapses the drawer
- `toggle()` — Toggles collapsed state
- `isCollapsed()` — Returns collapsed state

## Live example

See `x-drawer-layout` on the [Behaviors showcase](/?page=behaviors) — search for `x-drawer-layout` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/drawerLayout.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
