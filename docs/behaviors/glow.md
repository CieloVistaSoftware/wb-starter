# Glow

Behavior applied with x-glow.

## Type — new capability

`x-glow` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-glow>
  x-glow · variant: primary
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `color` | `string` | `var(--primary, #6366f1)` | Read by glow(). |

## Live example

See `x-glow` on the [Behaviors showcase](/?page=behaviors) — search for `x-glow` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/glow.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
