# Badge

Small label/tag for status indicators, counts, or categories

## Type — new capability

`x-badge` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<span x-badge label="Beta" variant="warning" pill></span>
```

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

## Live example

See `x-badge` on the [Behaviors showcase](/?page=behaviors) — search for `x-badge` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/badge.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
