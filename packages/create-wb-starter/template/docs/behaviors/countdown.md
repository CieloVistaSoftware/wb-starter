# Countdown

Behavior applied with x-countdown.

## Type — new capability

`x-countdown` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-countdown to="2027-12-31" class="time-display"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `seconds` | `string` | `0` | A fixed duration in seconds, used instead of an absolute `date`. |
| `format` | `string` | `auto` | How the remaining time is rendered. `auto` (default) drops units that are zero. |
| `date` | `string` | `this is the date` | Target date/time to count down to. `to` is accepted as an alias; `date` is read first. |
| `to` | `string` | `this is the to` | Alias of `date`, read only when `date` is absent. |

## Events

- `wb:countdown:complete` — Fired by countdown().

## Live example

See `x-countdown` on the [Behaviors showcase](/?page=behaviors) — search for `x-countdown` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/countdown.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
