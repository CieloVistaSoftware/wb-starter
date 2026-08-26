# Hero

Hero section behavior.

## Type — new capability

`x-hero` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-hero variant="centered">
  <h1>Ship the markup, not the toolchain</h1>
  <p>Behaviors decorate real elements in light DOM — no build, no shadow roots.</p>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `` · `default` · `cosmic` | `default` |  |

## Live example

See `x-hero` on the [Behaviors showcase](/?page=behaviors) — search for `x-hero` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/hero.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
