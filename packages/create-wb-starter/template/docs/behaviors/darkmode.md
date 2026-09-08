# Dark Mode Toggle

Button to toggle dark/light theme.

## Type — new capability

`x-darkmode` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-darkmode>
  x-darkmode · variant: primary
</button>
```

## Live example

See `x-darkmode` on the [Behaviors showcase](/?page=behaviors) — search for `x-darkmode` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/darkmode.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
