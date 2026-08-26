# Slidein

On click, plays the slide-in-<dir> animation for 0.5s.

## Type — new capability

`x-slidein` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button class="effect-demo" x-slidein direction="left">
  x-slidein · direction: left
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `string` | `left` | Read by slidein(). |

## Live example

See `x-slidein` on the [Behaviors showcase](/?page=behaviors) — search for `x-slidein` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/slidein.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
