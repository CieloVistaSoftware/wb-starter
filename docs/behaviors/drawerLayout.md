# Drawer Layout

Collapsible sidebar layout with toggle

Applies to `<aside>`, and to any element carrying `x-drawer-layout`.

## Usage

```html
<aside x-drawer-layout>
  …
</aside>
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
