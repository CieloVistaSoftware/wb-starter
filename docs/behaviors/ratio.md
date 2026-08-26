# Ratio

Behavior applied with x-ratio.

## Type — new capability

`x-ratio` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-ratio ratio="16:9">
  <img src="https://picsum.photos/seed/wide/640/360" alt="Coastline from the air">
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `ratio` | `string` | `16x9` | Read by ratio(). |

## Live example

See `x-ratio` on the [Behaviors showcase](/?page=behaviors) — search for `x-ratio` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/ratio.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
