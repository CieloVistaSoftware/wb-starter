# Img

Behavior applied with x-img.

## Type — new capability

`x-img` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<img src="https://picsum.photos/seed/lens/480/320" alt="Prime lens on a wooden desk">
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Read by img(). |
| `fallback` | `string` | — | Read by img(). |
| `aspect-ratio` | `string` | — | Read by img(). |
| `lazy` | `boolean` | `false` | Read by img(). Bare attribute. |
| `data-lazy` | `boolean` | `false` | Read by img(). Bare attribute. |
| `zoomable` | `boolean` | `false` | Read by img(). Bare attribute. |
| `data-zoomable` | `boolean` | `false` | Read by img(). Bare attribute. |

## Live example

See `x-img` on the [Behaviors showcase](/?page=behaviors) — search for `x-img` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/img.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
