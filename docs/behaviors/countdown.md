# Countdown

`x-countdown` shows the time left until `date` (or `to`), or for a fixed number of `seconds`, and updates it every second until it reaches zero, when `wb:countdown:complete` fires. Put it on an empty `<div>` or `<span>`.

## Usage

<div x-demo>
<div x-countdown to="2027-12-31"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `seconds` | number of seconds | `0` | A fixed duration in seconds, used instead of an absolute `date`. |
| `format` | `auto`, or a pattern using `DD` `HH` `MM` `SS` | `auto` | How the remaining time is rendered. `auto` (default) drops units that are zero. |
| `date` | date or date-time, e.g. `2026-12-31T23:59` | — | Target date/time to count down to. `to` is accepted as an alias; `date` is read first. |
| `to` | date or date-time | — | Alias of `date`, read only when `date` is absent. |

## Events

- `wb:countdown:complete` — The countdown reached zero.

<sub>Schema: [`countdown.schema.json`](../../src/wb-models/countdown.schema.json)</sub>
