# Draggable Card

`x-carddraggable` renders a card the user can pick up by its header and move; `axis` limits the direction, `constrain` keeps it inside its parent or the viewport, and `snapToGrid` rounds the position. Drag start, move and end each fire an event.

## Usage

<div x-demo>
<article x-carddraggable title="Drag me" content="Pick this card up and move it — the position sticks." constrain axis="both"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Card content |
| `constrain` | `none` · `parent` · `viewport` | `none` | Constrain to area |
| `axis` | `both` · `x` · `y` | `both` | Drag axis |
| `snapToGrid` | `number` | `0` | Snap grid size (0=disabled) |
| `variant` | `default` · `elevated` | `default` |  |

## Events

- `wb:drag:start` — Drag started
- `wb:drag:move` — During drag
- `wb:drag:end` — Drag ended

## Methods

- `setPosition()` — Sets card position
- `getPosition()` — Gets current position
- `reset()` — Resets to original position

<sub>Schema: [`carddraggable.schema.json`](../../src/wb-models/carddraggable.schema.json)</sub>
