# Stats Card

Statistics display card with value, label, icon, and trend indicator

Applies to `<article>`, and to any element carrying `x-cardstats`.

## Usage

```html
<article x-cardstats>
  …
</article>
```

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

## Live example

See `x-cardstats` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardstats` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardstats.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
