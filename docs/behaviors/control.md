# Control

Behavior applied with x-control.

## Type — new capability

`x-control` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-control label="Threshold">
  <input type="range" min="0" max="100" value="60">
</div>
```

## Live example

See `x-control` on the [Behaviors showcase](/?page=behaviors) — search for `x-control` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/control.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
