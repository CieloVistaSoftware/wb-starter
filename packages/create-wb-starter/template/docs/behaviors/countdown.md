# Countdown

Behavior applied with x-countdown.

Apply `x-countdown` to any element.

## Usage

```html
<div x-countdown to="2027-12-31" class="time-display"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `seconds` | `string` | `0` | Read by countdown(). |
| `format` | `string` | `auto` | Read by countdown(). |
| `date` | `string` | — | Read by countdown(). |
| `to` | `string` | — | Read by countdown(). |

## Events

- `wb:countdown:complete` — Fired by countdown().

## Live example

See `x-countdown` on the [Behaviors showcase](/?page=behaviors) — search for `x-countdown` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/countdown.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
