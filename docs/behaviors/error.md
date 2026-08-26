# Error Behavior

Schema for x-error behavior (error message)

## Type — new capability

`x-error` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-error>Build failed: 2 of 13 catalog-integrity checks.</div>
```

## Live example

See `x-error` on the [Behaviors showcase](/?page=behaviors) — search for `x-error` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/error.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
