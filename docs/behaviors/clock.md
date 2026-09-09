# Clock

Behavior applied with x-clock.

## Type — new capability

`x-clock` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-clock></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `string` | `digital` | Clock face: `digital` (default) or the analogue rendering. |
| `format` | `string` | `24` | `24` (default) or `12` for a 12-hour clock with AM/PM. |
| `show-seconds` | `string` | — | Show the seconds field. On unless set to `"false"`. |

## Live example

See `x-clock` on the [Behaviors showcase](/?page=behaviors) — search for `x-clock` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/clock.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
