# Rating

`x-rating` renders a row of `max` stars with `value` of them filled, and lets the user click to set a new rating unless `readonly` is set; `half` allows half stars. Changes fire `wb:rating:change`.

## Usage

<div x-demo>
<div x-rating value="4" max="5" half></div>
</div>

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

<sub>Schema: [`rating.schema.json`](../../src/wb-models/rating.schema.json)</sub>
