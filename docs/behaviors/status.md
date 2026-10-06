# Status

`x-status` adds a variant class to inline text: `primary`, `success`, `error` and the other status colours style its text, and `red`, `yellow`, `green` and `dot` turn it into a window-control dot.

## Usage

<div x-demo>
<span x-status variant="red"></span> <span x-status variant="yellow"></span> <span x-status variant="green"></span>
<span x-status variant="success">All checks passed</span>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `default` · `red` · `yellow` · `green` · `dot` · `primary` · `secondary` · `success` · `error` · `warning` · `info` | `default` | Visual style variant |

## Former name

This behavior was `x-span` until #1105. The old attribute still works as an alias, but new markup uses `x-status`: `span` is an HTML element name, and no native element maps to this behavior.

<sub>Schema: [`status.schema.json`](../../src/wb-models/status.schema.json)</sub>
