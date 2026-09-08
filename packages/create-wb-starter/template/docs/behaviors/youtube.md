# Youtube

Behavior applied with x-youtube.

## Type — new capability

`x-youtube` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-youtube id="dQw4w9WgXcQ" ratio="16:9"></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | — | Read by youtube(). |
| `video-id` | `string` | — | Read by youtube(). |
| `controls` | `string` | — | Read by youtube(). |
| `autoplay` | `boolean` | `false` | Read by youtube(). Bare attribute. |
| `muted` | `boolean` | `false` | Read by youtube(). Bare attribute. |
| `loop` | `boolean` | `false` | Read by youtube(). Bare attribute. |

## Live example

See `x-youtube` on the [Behaviors showcase](/?page=behaviors) — search for `x-youtube` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/youtube.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>
