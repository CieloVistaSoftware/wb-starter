# Drawer Layout

`x-drawer-layout` makes a sidebar collapsible: a toggle shrinks it from `width` to `min-width` and back. Put it on the `<aside>` or `<nav>` that holds your side navigation.

## Usage

<div x-demo>
<aside x-drawer-layout position="left" width="220px" min-width="64px">
  <nav>
    <a href="#">Overview</a>
    <a href="#">Runs</a>
    <a href="#">Settings</a>
  </nav>
</aside>
</div>

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

<sub>Schema: [`drawerLayout.schema.json`](../../src/wb-models/drawerLayout.schema.json)</sub>
