# Ratio

Behavior applied with x-ratio.

## Type — new capability

`x-ratio` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-ratio ratio="16:9">
  <img src="images/placeholder.svg" alt="Coastline from the air">
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `ratio` | `string` | `16x9` | The aspect ratio the frame holds its child to, applied as the `--x-frame-ratio` custom property. The behavior's own default is `16/9`. NOTE: this schema declares a default of `16x9`, which the code never produces — the two disagree and the code is authoritative. |

## Live example

See `x-ratio` on the [Behaviors showcase](/?page=behaviors) — search for `x-ratio` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/ratio.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
