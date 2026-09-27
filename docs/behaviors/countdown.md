# Countdown

`x-countdown` shows the time left until `date` (or `to`), or for a fixed number of `seconds`, and updates it every second until it reaches zero, when `wb:countdown:complete` fires. Put it on an empty `<div>` or `<span>`.

## Usage

<div x-demo>
<div x-countdown to="2027-12-31" class="time-display"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `seconds` | `string` | `0` | A fixed duration in seconds, used instead of an absolute `date`. |
| `format` | `string` | `auto` | How the remaining time is rendered. `auto` (default) drops units that are zero. |
| `date` | `string` | — | Target date/time to count down to. `to` is accepted as an alias; `date` is read first. |
| `to` | `string` | — | Alias of `date`, read only when `date` is absent. |

## Events

- `wb:countdown:complete` — The countdown reached zero.

<sub>Schema: [`countdown.schema.json`](../../src/wb-models/countdown.schema.json)</sub>
