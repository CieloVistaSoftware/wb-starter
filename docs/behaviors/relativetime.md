# Relativetime

`x-relativetime` replaces the element's text with how long ago `date` was — "3 days ago", "Just now" — and recomputes it every `refresh` milliseconds. Keep the absolute date in the markup as the fallback text.

## Usage

<div x-demo>
<span x-relativetime date="2025-01-01">Jan 1, 2025</span>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `datetime` | date or date-time | — | Alias of `date`, read only when `date` is absent. |
| `refresh` | milliseconds | `60000` | How often the text is recomputed, in milliseconds. Defaults to `60000` — once a minute. |
| `date` | date or date-time, e.g. `2026-12-31T23:59` | — | The timestamp to describe. `datetime` is accepted as an alias; `date` is read first. |

<sub>Schema: [`relativetime.schema.json`](../../src/wb-models/relativetime.schema.json)</sub>
