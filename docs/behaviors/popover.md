# Popover

`x-popover` attaches a small panel with `popoverTitle` and `popoverContent` to the element, opened by a click (or on hover with `trigger="hover"`) on the `position` side. Use it for a sentence or two of extra detail; for a one-line hint use `x-tooltip`.

## Usage

<div x-demo>
<button x-popover popoverTitle="Retry policy" popoverContent="Failed runs retry twice, 30 seconds apart.">Retry policy</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `description` | `string` | — | Popover body text. Only used when `popoverContent` is absent. |
| `heading` | `string` | — | Popover heading. Only used when `popoverTitle` is absent. |
| `trigger` | `string` | `click` | What opens it: `click` (default) or `hover`. |
| `position` | `string` | `top` | Side the popover opens on: `top` (default), `bottom`, `left` or `right`. |
| `popoverContent` | `string` | — | Popover body text. Read BEFORE `description`. |
| `popoverTitle` | `string` | — | Popover heading. Read BEFORE `heading`. |

<sub>Schema: [`popover.schema.json`](../../src/wb-models/popover.schema.json)</sub>
