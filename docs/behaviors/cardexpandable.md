# Expandable Card

`x-cardexpandable` renders a card whose body is clipped to `lines` lines (or `max-height`) with a control that expands it to full length and back. Use it for long descriptions in a grid of cards that should line up.

## Usage

<div x-demo>
<article x-cardexpandable
  title="What changed in 4.0"
  content="Composition replaced inheritance: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no behavior base class any more, and no shadow boundary to reach through."
  lines="2"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Expandable content |
| `expanded` | `boolean` | `false` | Initial expanded state |
| `max-height` | `string` | `100px` | Max height when collapsed (pixel/unit string). Ignored when `lines` is set -- use maxHeight for non-text/mixed content where line-clamp doesn't apply. |
| `lines` | `number` | `null` | Clamp collapsed text to exactly N full lines via CSS line-clamp, instead of an arbitrary pixel maxHeight. Takes priority over maxHeight when set. |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:expandable:toggle` — Fired on expand/collapse

## Methods

- `expand()` — Expands the card
- `collapse()` — Collapses the card
- `toggle()` — Toggles expanded state
- `isExpanded()` — Returns expanded state

<sub>Schema: [`cardexpandable.schema.json`](../../src/wb-models/cardexpandable.schema.json)</sub>
