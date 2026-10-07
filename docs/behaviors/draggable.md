# Draggable

`x-draggable` lets the user move the element with the mouse or a finger. `axis` restricts movement to `x` or `y`, and `handle` names a child selector so that only that part starts a drag.

## Usage

<div x-demo>
<div x-draggable axis="both" style="display:inline-block;padding:1rem;border:1px dashed var(--border-color);background:var(--bg-secondary)">Drag me</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `axis` | `x` · `y` · `both` | `both` |  |
| `handle` | CSS selector | — | Selector for drag handle |

<sub>Schema: [`draggable.schema.json`](../../src/wb-models/draggable.schema.json)</sub>
