# Alert

Alert behavior for displaying messages with severity levels

## Type — new capability

`x-alert` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-alert type="info" message="Info alert message"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `info` · `success` · `warning` · `error` | `info` | Alert severity/style variant |
| `title` | `string` | — | Alert title (optional heading) |
| `message` | `string` | — | Alert message content |
| `icon` | `string` | — | Icon (emoji or icon name) |
| `dismissible` | `boolean` | `false` | Show close button to dismiss alert |

## Methods

- `show()` — Shows the alert
- `hide()` — Hides the alert
- `toggle()` — Toggles alert visibility
- `dismiss()` — Dismisses and removes the alert with animation

## Live example

See `x-alert` on the [Behaviors showcase](/?page=behaviors) — search for `x-alert` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/alert.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
