# Glow

`x-glow` gives the element a halo in `color`, which defaults to the theme's primary colour: a pulsing ring around the box, or with `target="text"` a steady glow around the letters. Use it sparingly to pull attention to one control or one heading.

## Usage

<div x-demo>
<button variant="primary" x-glow>Start trial</button>
</div>

A glowing heading: the letters glow, not the line box, and it holds steady.

<div x-demo>
<h3 x-glow target="text" color="#06b6d4">Night mode</h3>
</div>

The box glow pulses; a reader who prefers reduced motion gets the glow without the pulse.

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | `box` \| `text` | `box` | What glows. `box` haloes the element's rectangle and pulses; `text` haloes the letters with a steady text-shadow, for headings. |
| `color` | `string` | `var(--primary, #6366f1)` | Colour of the glow. Defaults to the theme primary (`var(--primary, #6366f1)`), so it follows the active theme unless you pin it. |

<sub>Schema: [`glow.schema.json`](../../src/wb-models/glow.schema.json)</sub>
