# Span

`x-span` adds a variant class to a `<span>`: `muted`, `primary`, `success` and the other status colours style its text, and `red`, `yellow` and `green` turn it into a window-control dot.

## Usage

<div x-demo>
<span x-span variant="red"></span> <span x-span variant="yellow"></span> <span x-span variant="green"></span>
<span x-span variant="success">All checks passed</span>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `default` · `red` · `yellow` · `green` · `dot` · `primary` · `secondary` · `success` · `error` · `warning` · `info` | `default` | Visual style variant |

<sub>Schema: [`span.schema.json`](../../src/wb-models/span.schema.json)</sub>
