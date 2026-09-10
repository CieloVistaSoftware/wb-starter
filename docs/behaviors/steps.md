# Steps

Behavior applied with x-steps.

## Type — new capability

`x-steps` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-steps items="Cart,Shipping,Payment,Confirm" current="2"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | `string` | `this is the items` | Comma-separated step labels, e.g. `Details,Payment,Confirm`. Whitespace around each is trimmed. |
| `current` | `string` | `1` | Which step is active, counting from **1**, not 0. Defaults to `1`. |

## Live example

See `x-steps` on the [Behaviors showcase](/?page=behaviors) — search for `x-steps` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/steps.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
