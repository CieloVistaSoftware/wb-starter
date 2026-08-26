# Vimeo

Behavior applied with x-vimeo.

## Type — new capability

`x-vimeo` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-vimeo video-id="76979871"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `video-id` | `string` | — | Read by vimeo(). |
| `autoplay` | `boolean` | `false` | Read by vimeo(). Bare attribute. |
| `data-autoplay` | `boolean` | `false` | Read by vimeo(). Bare attribute. |
| `muted` | `boolean` | `false` | Read by vimeo(). Bare attribute. |
| `data-muted` | `boolean` | `false` | Read by vimeo(). Bare attribute. |
| `loop` | `boolean` | `false` | Read by vimeo(). Bare attribute. |
| `data-loop` | `boolean` | `false` | Read by vimeo(). Bare attribute. |

## Live example

See `x-vimeo` on the [Behaviors showcase](/?page=behaviors) — search for `x-vimeo` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/vimeo.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
