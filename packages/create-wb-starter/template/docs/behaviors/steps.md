# Steps

`x-steps` draws a progress indicator for a multi-step process from the comma-separated `items`, marking steps before `current` as done and `current` itself as active. `current` counts from 1.

## Usage

<div x-demo>
<div x-steps items="Cart,Shipping,Payment,Confirm" current="2"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | `string` | — | Comma-separated step labels, e.g. `Details,Payment,Confirm`. Whitespace around each is trimmed. |
| `current` | `string` | `1` | Which step is active, counting from **1**, not 0. Defaults to `1`. |

<sub>Schema: [`steps.schema.json`](../../src/wb-models/steps.schema.json)</sub>
