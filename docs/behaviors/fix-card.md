# Fix Card

Component for displaying fix/remediation details.

## Type — new capability

`x-fix-card` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<article x-fix-card title="Pinned note" content="This card keeps its place while the rest of the page scrolls."></article>
```

## Live example

See `x-fix-card` on the [Behaviors showcase](/?page=behaviors) — search for `x-fix-card` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/fix-card.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
