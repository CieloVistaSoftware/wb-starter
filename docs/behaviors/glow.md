# Glow

`x-glow` gives the element a pulsing halo in `color`, which defaults to the theme's primary colour. Use it sparingly to pull attention to one control.

## Usage

<div x-demo>
<button variant="primary" x-glow>Start trial</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `var(--primary, #6366f1)` | Colour of the glow. Defaults to the theme primary (`var(--primary, #6366f1)`), so it follows the active theme unless you pin it. |

<sub>Schema: [`glow.schema.json`](../../src/wb-models/glow.schema.json)</sub>
