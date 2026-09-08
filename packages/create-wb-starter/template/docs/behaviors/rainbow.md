# Rainbow

Behavior applied with x-rainbow.

## Type — new capability

`x-rainbow` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-rainbow>
  x-rainbow · variant: primary
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `duration` | `string` | `3s` | Read by rainbow(). |

## Live example

See `x-rainbow` on the [Behaviors showcase](/?page=behaviors) — search for `x-rainbow` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/rainbow.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
