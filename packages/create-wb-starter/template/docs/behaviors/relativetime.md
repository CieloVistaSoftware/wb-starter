# Relativetime

Behavior applied with x-relativetime.

## Type — new capability

`x-relativetime` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<span x-relativetime date="2025-01-01" class="time-display">Jan 1, 2025</span>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `datetime` | `string` | — | Read by relativetime(). |
| `refresh` | `string` | `60000` | Read by relativetime(). |
| `date` | `string` | — | Read by relativetime(). |

## Live example

See `x-relativetime` on the [Behaviors showcase](/?page=behaviors) — search for `x-relativetime` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/relativetime.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
