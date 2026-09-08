# OTP Behavior

Schema for x-otp behavior (one-time password input)

## Type — new capability

`x-otp` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-otp length="6"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `length` | `integer` | — | Number of OTP digits |

## Live example

See `x-otp` on the [Behaviors showcase](/?page=behaviors) — search for `x-otp` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/otp.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
