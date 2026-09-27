# Stats Card

`x-cardstats` renders one statistic as a card: a large `value`, the `label` saying what it counts, and an optional up/down `trend` with its `trend-value`. Use a row of them for a dashboard summary.

## Usage

<div x-demo>
<article x-cardstats value="1,284" label="Builds this month" trend="up" trend-value="12%"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | The main statistic value (e.g., 1,234 or $50K) |
| `label` | `string` | — | Label describing what the value represents |
| `icon` | `string` | — | Icon (emoji or icon name) |
| `trend` | `` · `up` · `down` · `neutral` | — | Trend direction |
| `trend-value` | `string` | — | Trend amount (e.g., +12%, -5%) |
| `variant` | `default` · `compact` · `large` · `minimal` | `default` | Visual style variant |
| `color` | `string` | — | Accent color (CSS color value) |

## Methods

- `show()` — Shows the stats card
- `hide()` — Hides the stats card
- `toggle()` — Toggles visibility
- `update()` — Updates the value and optionally trend
- `animate()` — Animates the value counting up

<sub>Schema: [`cardstats.schema.json`](../../src/wb-models/cardstats.schema.json)</sub>
