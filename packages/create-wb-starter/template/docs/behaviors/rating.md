# Rating

Star rating component for displaying or collecting ratings

Applies to `<div>`, and to any element carrying `x-rating`.

## Usage

```html
<div x-rating>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | `0` | Current rating value |
| `max` | `number` | `5` | Maximum rating |
| `readonly` | `boolean` | `false` | Display only, not interactive |
| `disabled` | `boolean` | `false` | Disabled state |
| `half` | `boolean` | `false` | Allow half-star ratings |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `icon` | `string` | `★` | Custom icon (emoji or symbol) |

## Events

- `wb:rating:change` — Rating changed

## Methods

- `getValue()` — Gets current rating
- `setValue()` — Sets rating value
- `clear()` — Clears rating to 0
- `enable()` — Enables the rating
- `disable()` — Disables the rating

## Accessibility

- **role** — slider
- **ariaValueMin** — 0
- **ariaValueMax** — dynamic from max
- **ariaValueNow** — dynamic from value

## Live example

See `x-rating` on the [Behaviors showcase](/?page=behaviors) — search for `x-rating` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/rating.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
