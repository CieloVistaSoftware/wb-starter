# Popover

`x-popover` attaches a small panel with `popoverTitle` and `popoverContent` to the element, opened by a click (or on hover with `trigger="hover"`) on the `position` side. Use it for a sentence or two of extra detail; for a one-line hint use `x-tooltip`.

## Usage

<div x-demo>
<button x-popover popoverTitle="Retry policy" popoverContent="Failed runs retry twice, 30 seconds apart.">Retry policy</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `description` | text | — | Popover body text. Only used when `popoverContent` is absent. |
| `heading` | text | — | Popover heading. Only used when `popoverTitle` is absent. |
| `trigger` | `click` · `hover` | `click` | What opens it: `click` (default) or `hover`. |
| `position` | `top` · `bottom` · `left` · `right` | `top` | Side the popover opens on: `top` (default), `bottom`, `left` or `right`. |
| `popoverContent` | text | — | Popover body text. Read BEFORE `description`. |
| `popoverTitle` | text | — | Popover heading. Read BEFORE `heading`. |

<sub>Schema: [`popover.schema.json`](../../src/wb-models/popover.schema.json)</sub>
