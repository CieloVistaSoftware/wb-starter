# Badge

`x-badge` turns a `<span>` into a small coloured label: its text comes from `label`, its colour from `variant`, and `pill`, `dot`, `outline` and `glow` change its shape. Use it for a status, a count or a category next to other content.

## Usage

<div x-demo>
<span x-badge label="Beta" variant="warning" pill></span>
<span x-badge label="3 failing" variant="error"></span>
<span x-badge label="Passed" variant="success" outline></span>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Badge text content |
| `variant` | `default` · `primary` · `secondary` · `success` · `warning` · `error` · `info` · `glass` · `gradient` | `default` | Color variant |
| `size` | `xs` · `sm` · `md` · `lg` | `md` | Badge size |
| `pill` | `boolean` | `false` | Pill shape with full border radius |
| `dot` | `boolean` | `false` | Dot indicator (no text) |
| `outline` | `boolean` | `false` | Outline style (transparent background) |
| `removable` | `boolean` | `false` | Show remove/close button |
| `glow` | `boolean` | `false` | Soft pulsing glow halo in the badge's own variant color, for drawing attention (e.g. NEW/LIVE badges) |
| `icon` | `string` | — | Leading icon/emoji shown before the label |

## Methods

- `show()` — Shows the badge
- `hide()` — Hides the badge
- `toggle()` — Toggles visibility
- `remove()` — Removes the badge from DOM with animation
- `update()` — Updates the badge label

<sub>Schema: [`badge.schema.json`](../../src/wb-models/badge.schema.json)</sub>
